import argparse
import retro
import numpy as np
import os
import hashlib
import logging
import time
import sys
import torch
import subprocess
import cv2
import traceback
import threading
from mk2_model_vs_model import load_pytorch_model, get_action
from common.utils import com_print
SAVE_STATE_DIR = "/app/stable-retro/retro/data/stable/MortalKombatII-Genesis"


# Set up logging to both console and file
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("/app/custom_scripts/fight_log.txt"),
                        logging.StreamHandler(sys.stdout)
                    ])

logging.info("Script started")


def load_pytorch_model(model_path):
    model = torch.load(model_path)
    model.eval()
    return model

def get_action(model, observation, button_names):
    with torch.no_grad():
        logging.info(f"Original observation type: {type(observation)}, shape: {observation.shape if hasattr(observation, 'shape') else 'N/A'}")
        
        # Convert to numpy array if it's not already
        if not isinstance(observation, np.ndarray):
            observation = np.array(observation)
        
        # Change from [H, W, C] to [C, H, W]
        observation = np.transpose(observation, (2, 0, 1))  
        # Resize if necessary (adjust dimensions as needed)
        observation = cv2.resize(observation, (84, 84))
        
        # Convert to grayscale if necessary
        # observation = cv2.cvtColor(observation, cv2.COLOR_RGB2GRAY)
        
        # Normalize pixel values
        observation = observation.astype(np.float32) / 255.0
        
        # Stack frames if necessary (adjust number of frames as needed)
        observation = np.stack([observation] * 4, axis=0)
        
        # Convert to PyTorch tensor
        observation = torch.FloatTensor(observation)
        
        # Add batch dimension
        observation = observation.unsqueeze(0)
        
        logging.info(f"Preprocessed observation shape: {observation.shape}")
        
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

def log_ffmpeg_output(process):
    def log_output(pipe, prefix):
        for line in iter(pipe.readline, b''):
            logging.info(f"{prefix}: {line.decode().strip()}")

    threading.Thread(target=log_output, args=(process.stdout, "FFmpeg stdout"), daemon=True).start()
    threading.Thread(target=log_output, args=(process.stderr, "FFmpeg stderr"), daemon=True).start()

def setup_ffmpeg_process(round_number):
    ffmpeg_command = [
        'ffmpeg',
        '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-s', '1280x720',
        '-pix_fmt', 'rgb24',
        '-r', '30',  # Input frame rate
        '-i', '-',
        '-c:v', 'mpeg4',
        '-q:v', '5',
        '-f', 'hls',
        '-hls_time', '4',
        '-hls_list_size', '5',
        '-hls_flags', 'delete_segments',
        '-hls_segment_type', 'mpegts',
        f'/app/hls/stream_round_{round_number}.m3u8'
    ]
    logging.info(f"FFmpeg command for round {round_number}: {' '.join(ffmpeg_command)}")
    process = subprocess.Popen(ffmpeg_command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    log_ffmpeg_output(process)
    return process

def run_fight_and_stream(game, model1_path, model2_path, save_state_path, button_names, num_rounds=3):
    try:
        logging.info(f"Attempting to create environment for {game}")
        env = retro.make(game="MortalKombatII-Genesis", state=save_state_path)
        logging.info("Environment created successfully")

        # Set up FFmpeg process for streaming the entire gameplay
        ffmpeg_process = setup_ffmpeg_process("full_gameplay")

        # Load models
        model1 = load_pytorch_model(model1_path)
        model2 = load_pytorch_model(model2_path)
        logging.info("Both models loaded successfully")

        p1_wins = 0
        p2_wins = 0

        com_print('========= Starting Fight ==========')

        max_steps = 1000
        for round in range(num_rounds):
            logging.info(f"Starting round {round + 1}")
            reset_result = env.reset()
            if isinstance(reset_result, tuple):
                obs = reset_result[0]  # The observation is the first element of the tuple
            else:
                obs = reset_result
            logging.info(f"Initial observation shape: {obs.shape}")
            
            step_count = 0
            frame_count = 0
            frame_skip = 2
            
            while step_count < max_steps:
                action1 = get_action(model1, obs, button_names)
                action2 = get_action(model2, obs, button_names)
                
                action1_binary = (action1 > 0.5).astype(int)
                action2_binary = (action2 > 0.5).astype(int)
                
                combined_action = np.logical_or(action1_binary, action2_binary).astype(int)

                player1_buttons = [button_names[i] for i, act in enumerate(action1) if act]
                player2_buttons = [button_names[i] for i, act in enumerate(action2) if act]
                logging.info(f"Step {step_count}: P1 actions: {player1_buttons}, P2 actions: {player2_buttons}")
                
                logging.info(f"Action taken: {combined_action}")
                
                step_result = env.step(combined_action)
                if len(step_result) == 5:
                    obs, reward, terminated, truncated, info = step_result
                    done = terminated or truncated
                else:
                    obs, reward, done, info = step_result
                
                custom_reward = calculate_reward(info)
                
                logging.info(f"Step {step_count}: obs shape: {obs.shape}, env_reward: {reward}, custom_reward: {custom_reward}, done: {done}")
                logging.info(f"Game state: {info}")
                
                if step_count % 25 == 0:
                    cv2.imwrite(f"frame_{round}_{step_count}.png", obs)
                
                frame_count += 1
                if frame_count % frame_skip == 0:
                    try:
                        frame = obs  # Use the observation directly

                        # Resize the frame if necessary
                        if frame.shape != (720, 1280, 3):
                            frame = cv2.resize(frame, (1280, 720))
                        
                        # Ensure the frame is in the correct format (RGB24)
                        if frame.dtype != np.uint8:
                            frame = (frame * 255).astype(np.uint8)
                        
                        # Check if ffmpeg process is still running
                        if ffmpeg_process.poll() is None:
                            ffmpeg_process.stdin.write(frame.tobytes())
                            logging.info(f"Frame {frame_count} written to FFmpeg.")
                        else:
                            logging.error("FFmpeg process has terminated unexpectedly.")
                            break
                    except Exception as e:
                        logging.error(f"Error processing frame {frame_count}: {str(e)}")

                # Determine the winner
                if info['health'] > info['enemy_health']:
                    p1_wins += 1
                elif info['health'] < info['enemy_health']:
                    p2_wins += 1
                
                step_count += 1
                
                if done:
                    logging.info(f"Round ended. Reason: {'Terminated' if terminated else 'Truncated'}")
                    break

            logging.info(f"Round {round + 1} completed. Steps taken: {step_count}")
            time.sleep(2)  # 2-second delay between rounds

        logging.info(f"Final score - Player 1: {p1_wins}, Player 2: {p2_wins}")
        
    except Exception as e:
        logging.error(f"An error occurred during the fight: {str(e)}")
        logging.error(traceback.format_exc())
    finally:
        if 'env' in locals() and env:
            env.close()
        if 'ffmpeg_process' in locals() and ffmpeg_process:
            ffmpeg_process.stdin.close()
            ffmpeg_process.wait()
        logging.info("All rounds completed. Environment closed and streaming ended")

        com_print('========= Fight Finished ==========')

def calculate_reward(info):
    p1_health = info['health']
    p2_health = info['enemy_health']
    reward = (p1_health - p2_health) / 100  # Normalize to small values
    return reward

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--game', type=str, default='MortalKombatII-Genesis')
    parser.add_argument('--model1', type=str, required=True, help='Path to the first model')
    parser.add_argument('--model2', type=str, required=True, help='Path to the second model')
    parser.add_argument('--save_state', type=str, required=True, help='Path to the save state file')
    parser.add_argument('--num_rounds', type=int, default=3, help='Number of rounds to fight')
    args = parser.parse_args()
    
    run_fight_and_stream(args.game, args.model1, args.model2, args.save_state, args.num_rounds)