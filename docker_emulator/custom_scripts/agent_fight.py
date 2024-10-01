import argparse
import retro
import numpy as np
import os
import logging
import time
import sys
import torch
import subprocess
import gymnasium as gym
import cv2
import traceback
import threading
from mk2_envs import init_play_env
from mk2_model_vs_model import load_pytorch_model, get_action
from common.utils import com_print, init_logger
from datetime import datetime

os.environ['PATH'] = '/usr/local/bin:' + os.environ['PATH']

SAVE_STATE_DIR = "/app/stable-retro/retro/data/stable/MortalKombatII-Genesis"

# Set up logging to both console and file
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("/app/custom_scripts/fight_log.txt"),
                        logging.StreamHandler(sys.stdout)
                    ])

logging.info("Script started")

def setup_ffmpeg_stream():
    ffmpeg_path = '/usr/local/bin/ffmpeg'
    if not os.path.exists(ffmpeg_path):
        raise FileNotFoundError(f"FFmpeg not found at {ffmpeg_path}")

    command = [
        ffmpeg_path,
        '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-s', '1280x720',
        '-pix_fmt', 'rgb24',
        '-r', '15',
        '-i', '-',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-crf', '23',
        '-f', 'hls',
        '-hls_time', '4',
        '-hls_list_size', '5',
        '-hls_segment_type', 'mpegts',
        '-hls_flags', 'independent_segments',
        '/app/hls/stream.m3u8'
    ]
    
    return subprocess.Popen(command, stdin=subprocess.PIPE, stderr=subprocess.PIPE)

def process_frame(env, ffmpeg_process, step_count):
    try:
        logging.info(f"Step {step_count}: Processing screen")
        
        if isinstance(env.unwrapped, retro.RetroEnv):
            screen = env.unwrapped.get_screen()
        else:
            screen = env.render(mode='rgb_array')

        if isinstance(screen, gym.wrappers.frame_stack.LazyFrames):
            screen = np.array(screen)
        
        logging.info(f"Screen shape: {screen.shape}")
        logging.info(f"Screen dtype: {screen.dtype}")
        logging.info(f"Screen min/max: {screen.min()}, {screen.max()}")

        if screen.shape[-1] != 3:  # If not RGB
            screen = screen.squeeze(-1)  # Remove single-dimensional entries
            screen = np.stack((screen,) * 3, axis=-1)  # Convert to RGB

        frame_rgb = cv2.resize(screen, (1280, 720), interpolation=cv2.INTER_CUBIC)
        frame_rgb = frame_rgb.astype(np.uint8)

        ffmpeg_process.stdin.write(frame_rgb.tobytes())
        return True

    except Exception as e:
        logging.error(f"Error processing frame {step_count}: {str(e)}")
        logging.error(traceback.format_exc())
        return False
    
def log_ffmpeg_output(process):
    for line in iter(process.stderr.readline, b''):
        logging.info(f"FFmpeg: {line.decode().strip()}")




def get_action(model, observation, button_names):
    with torch.no_grad():
        logging.info(f"Observation type: {type(observation)}, shape: {observation.shape if hasattr(observation, 'shape') else 'N/A'}")
        
        if isinstance(observation, bool):
            logging.warning(f"Received boolean observation: {observation}")
            return np.random.randint(2, size=len(button_names))
        
        if isinstance(observation, np.ndarray):
            logging.info(f"Observation sum: {np.sum(observation)}")
            observation = torch.FloatTensor(observation)
        elif isinstance(observation, tuple) or isinstance(observation, list):
            logging.info(f"Observation sum: {np.sum(observation[0])}")
            observation = torch.FloatTensor(np.array(observation[0]))
        else:
            logging.info(f"Observation sum: {np.sum(np.array(observation))}")
            observation = torch.FloatTensor(np.array(observation))
        
        observation = observation.unsqueeze(0)
        
        action = model(observation)
        
        # Handle tuple output
        if isinstance(action, tuple):
            action = action[0]  # Assume the first element is the action
        
        # Convert to numpy array
        action = action.cpu().numpy()
        
        # Reshape if necessary
        if action.ndim > 1:
            action = action.reshape(-1)
        
        # Ensure action is binary
        action = (action > 0.5).astype(int)
        
        # Add some randomness to encourage exploration
        if np.random.rand() < 0.75:  # 75% chance of random action
            action = np.random.randint(2, size=len(button_names))

        logging.info(f"Action: {action}")
        
    return action

def load_pytorch_model(model_path):
    model = torch.load(model_path)
    model.eval()
    return model

def main(argv):
    try:
        args = parse_cmdline(argv[1:])
        logging.getLogger().setLevel(args.log_level)
        logger = init_logger(args)
        
        com_print('========= Initializing =============')
        p1_model = load_pytorch_model(args.load_p1_model)
        p2_model = load_pytorch_model(args.load_p2_model)

        com_print('========= Starting Fight ==========')

        # Setup FFmpeg stream
        ffmpeg_process = setup_ffmpeg_stream()
        threading.Thread(target=log_ffmpeg_output, args=(ffmpeg_process,), daemon=True).start()

        for round in range(args.num_rounds):
            com_print(f'Round {round + 1}')
            
            play_env, button_names = init_play_env(args)
            logging.info(f"Play environment created for round {round + 1}. Observation space: {play_env.observation_space}, Action space: {play_env.action_space}")
            com_print(f"Available buttons: {button_names}")

            obs, _ = play_env.reset()
            logging.info(f"Reset complete. Observation type: {type(obs)}, shape: {obs.shape if hasattr(obs, 'shape') else 'N/A'}")

            terminated = truncated = False
            total_reward = 0
            step_count = 0
            frame_skip = 2
            max_steps = 5000
            sleep_time = 0.2

            while not (terminated or truncated) and step_count < max_steps:
                if step_count % frame_skip == 0:
                    if not process_frame(play_env, ffmpeg_process, step_count):
                        break  # Exit the loop if frame processing fails

                    p1_action = get_action(p1_model, obs, button_names)
                    p2_action = get_action(p2_model, obs, button_names)

                    actions = np.concatenate([p1_action, p2_action])

                    p1_buttons = [button_names[i] for i, act in enumerate(p1_action) if act]
                    p2_buttons = [button_names[i] for i, act in enumerate(p2_action) if act]
                    logging.info(f"Step {step_count}: P1 actions: {p1_buttons}, P2 actions: {p2_buttons}")

                    logging.info(f"About to call play_env.step with actions: {actions}")
                    obs, reward, terminated, truncated, info = play_env.step(actions)
                    total_reward += reward

                    logging.info(f"Step result: reward={reward}, terminated={terminated}, truncated={truncated}")
                    logging.info(f"Step info: {info}")

                step_count += 1
                time.sleep(sleep_time)

                if terminated or truncated:
                    logging.info(f"Round {round + 1} finished. Total reward: {total_reward}")
                    logging.info(f"Final Info: {info}")
                    break

            logging.info(f"Round {round + 1} completed. Steps taken: {step_count}")
            
            play_env.close()
            logging.info(f"Play environment closed for round {round + 1}")
            
            time.sleep(2)  # 2-second delay between rounds

        # Close the FFmpeg process
        ffmpeg_process.stdin.close()
        ffmpeg_process.wait()

        com_print('========= Fight Finished ==========')
        
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        logging.error(traceback.format_exc())
        if 'ffmpeg_process' in locals():
            ffmpeg_process.stdin.close()
            ffmpeg_process.terminate()

def calculate_reward(info):
    p1_health = info['health']
    p2_health = info['enemy_health']
    reward = (p1_health - p2_health) / 100  # Normalize to small values
    return reward

def parse_cmdline(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--env', type=str, default='MortalKombatII-Genesis')
    parser.add_argument('--state', type=str, required=True, help='Name of the save state file')
    parser.add_argument('--load_p1_model', type=str, required=True)
    parser.add_argument('--load_p2_model', type=str, required=True)
    parser.add_argument('--num_rounds', type=int, default=3)
    parser.add_argument('--output_basedir', type=str, default='/app/logs')
    parser.add_argument('--log-level', type=str, default='INFO', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'],
                        help='Set the logging level')
    args = parser.parse_args(argv)
    args.state = os.path.join(SAVE_STATE_DIR, args.state)
    if not os.path.exists(args.state):
        raise FileNotFoundError(f"State file not found: {args.state}")
    return args

if __name__ == '__main__':
    main(sys.argv)