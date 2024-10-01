import argparse
import retro
import numpy as np
import os
import logging
import shutil
import sys
import torch
import subprocess
import cv2
import traceback
import threading
from mk2_envs import init_play_env
from mk2_model_vs_model import load_pytorch_model, get_action
from common.utils import com_print, init_logger
import gymnasium as gym
import requests
import json
import time

SAVE_STATE_DIR = "/app/stable-retro/retro/data/stable/MortalKombatII-Genesis"
BACKEND_URL = 'http://host.docker.internal:6001'

# Set up logging to both console and file
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("/app/custom_scripts/fight_log.txt"),
                        logging.StreamHandler(sys.stdout)
                    ])

logging.info("Script started")

def setup_ffmpeg_stream(fight_id):
    ffmpeg_path = '/usr/local/bin/ffmpeg'
    if not os.path.exists(ffmpeg_path):
        raise FileNotFoundError(f"FFmpeg not found at {ffmpeg_path}")
    
    output_dir = f'/app/hls/{fight_id}'
    os.makedirs(output_dir, exist_ok=True)

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
        f'{output_dir}/output.m3u8'
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
        if isinstance(observation, bool):
            print(f"Received boolean observation: {observation}")
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
        if np.random.rand() < 0.85:  # 85% chance of random action
            action = np.random.randint(2, size=len(button_names))

        logging.info(f"Action: {action}")
        
    return action

def load_pytorch_model(model_path):
    model = torch.load(model_path)
    model.eval()
    return model

def update_fight_status(fight_id, secure_id, status, state=None):
    update_url = f'{BACKEND_URL}/api/fight/update'
    
    data = {
        'fightId': fight_id,
        'secureId': secure_id,
        'status': status,
        'currentState': {
            'round': state.get('round', 1) if state else 1,
            'totalRounds': 3,  # Assuming 3 rounds per fight, adjust as needed
            'currentRoundTimeLeft': state.get('currentRoundTimeLeft', 60) if state else 60,
            'totalTimeLeft': state.get('totalTimeLeft', 180) if state else 180,
            'isPaused': False,  # Assuming the fight is not paused, adjust as needed
            'result': '',  # Fill this when the fight ends
            'winner': '',  # Fill this when the fight ends
            'p1_health': state.get('p1_health', 100) if state else 100,
            'p2_health': state.get('p2_health', 100) if state else 100,
        },
        'timestamp': int(time.time() * 1000),  # current timestamp in milliseconds
        'bettingOpen': False,  # Adjust as needed
        'bettingClosed': True,  # Adjust as needed
        'streamUrl': f'http://localhost/app/hls/{fight_id}/output.m3u8'  # Adjust the path as needed
    }

    logging.info(f"Attempting to update fight status. Update URL: {update_url}")
    logging.info(f"Request data: {json.dumps(data, indent=2)}")

    try:
        response = requests.post(update_url, json=data, timeout=10)
        logging.info(f"Response status code: {response.status_code}")
        logging.info(f"Response content: {response.text}")

        response.raise_for_status()
        logging.info(f'Fight data sent successfully to {update_url} for ID: {fight_id}, Secure ID: {secure_id}')
    except requests.RequestException as e:
        logging.error(f"RequestException occurred: {str(e)}")
        if e.response:
            logging.error(f"Response status code: {e.response.status_code}")
            logging.error(f"Response content: {e.response.text}")
        else:
            logging.error("No response received from server")
    except Exception as e:
        logging.error(f"Unexpected error updating fight data: {str(e)}")
        logging.error(f"Error type: {type(e).__name__}")
        logging.error(f"Error details: {traceback.format_exc()}")

    logging.info("Fight data update attempt completed")

def main(argv):
    try:
        args = parse_cmdline(argv[1:])
        logger = init_logger(args)
        
        logging.info(f"Starting fight with ID: {args.fight_id}, Secure ID: {args.secure_id}")
        
        com_print('========= Initializing =============')
        p1_model = load_pytorch_model(args.load_p1_model)
        p2_model = load_pytorch_model(args.load_p2_model)

        com_print('========= Starting Fight ==========')

        # Setup FFmpeg stream
        ffmpeg_process = setup_ffmpeg_stream(args.fight_id)
        threading.Thread(target=log_ffmpeg_output, args=(ffmpeg_process,), daemon=True).start()

        # Initial fight status update
        initial_state = {
            'round': 1,
            'p1_health': 100,
            'p2_health': 100,
            'timestamp': int(time.time() * 1000),
            'currentRoundTimeLeft': 99,  # Adjust as needed
            'totalTimeLeft': 99 * args.num_rounds,  # Adjust as needed
            'isPaused': False,
            'result': '',
            'winner': '',
            'bettingOpen': True,
            'bettingClosed': False
        }
        update_fight_status(args.fight_id, args.secure_id, 'in_progress', initial_state)

        total_rounds_won_p1 = 0
        total_rounds_won_p2 = 0

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
            max_steps = 5000
            frame_skip = 2
            sleep_time = 0.2

            round_start_time = time.time()

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

                    # Update fight state
                    current_time = time.time()
                    new_state = {
                        'round': round + 1,
                        'p1_health': info.get('health', 0),
                        'p2_health': info.get('enemy_health', 0),
                        'timestamp': int(current_time * 1000),
                        'currentRoundTimeLeft': max(0, 99 - int(current_time - round_start_time)),
                        'totalTimeLeft': max(0, 99 * args.num_rounds - int(current_time - round_start_time)),
                        'isPaused': False,
                        'result': '',
                        'winner': '',
                        'bettingOpen': False,
                        'bettingClosed': True
                    }
                    update_fight_status(args.fight_id, args.secure_id, 'in_progress', new_state)

                step_count += 1

                # Check for round end conditions
                if 'rounds_won' in info:
                    if info['rounds_won'] > 0 or info['enemy_rounds_won'] > 0:
                        total_rounds_won_p1 += info['rounds_won']
                        total_rounds_won_p2 += info['enemy_rounds_won']
                        com_print(f"Round {round + 1} finished. Total reward: {total_reward}")
                        com_print(f"Rounds won - P1: {total_rounds_won_p1}, P2: {total_rounds_won_p2}")
                        break

                if terminated or truncated:
                    com_print(f"Round {round + 1} finished. Total reward: {total_reward}")
                    com_print(f"Info: {info}")
                    break

            logging.info(f"Round {round + 1} completed. Steps taken: {step_count}")
            time.sleep(sleep_time)  # 2-second delay between rounds
            play_env.close()

        com_print('========= Fight Finished ==========')

        if ffmpeg_process:
            ffmpeg_process.stdin.close()
            ffmpeg_process.wait()

        # Determine the winner
        result = ''
        winner = ''
        if total_rounds_won_p1 > total_rounds_won_p2:
            result = 'P1 Wins'
            winner = 'P1'
        elif total_rounds_won_p2 > total_rounds_won_p1:
            result = 'P2 Wins'
            winner = 'P2'
        else:
            result = 'Draw'

        # Final fight status update
        final_state = {
            'round': args.num_rounds,
            'p1_health': info.get('health', 0),
            'p2_health': info.get('enemy_health', 0),
            'timestamp': int(time.time() * 1000),
            'currentRoundTimeLeft': 0,
            'totalTimeLeft': 0,
            'isPaused': False,
            'result': result,
            'winner': winner,
            'bettingOpen': False,
            'bettingClosed': True
        }
        update_fight_status(args.fight_id, args.secure_id, 'completed', final_state)

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        # Update fight status to error
        error_state = {
            'timestamp': int(time.time() * 1000),
            'result': 'Error',
            'bettingOpen': False,
            'bettingClosed': True
        }
        update_fight_status(args.fight_id, args.secure_id, 'error', error_state)

def parse_cmdline(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--env', type=str, default='MortalKombatII-Genesis')
    parser.add_argument('--state', type=str, required=True, help='Name of the save state file')
    parser.add_argument('--load_p1_model', type=str, required=True)
    parser.add_argument('--load_p2_model', type=str, required=True)
    parser.add_argument('--num_rounds', type=int, default=3)
    parser.add_argument('--fight_id', type=str, required=True)
    parser.add_argument('--secure_id', type=str, required=True)
    parser.add_argument('--output_basedir', type=str, default='/app/logs')
    args = parser.parse_args(argv)
    args.state = os.path.join(SAVE_STATE_DIR, args.state)
    if not os.path.exists(args.state):
        raise FileNotFoundError(f"State file not found: {args.state}")
    return args

if __name__ == '__main__':
    main(sys.argv)