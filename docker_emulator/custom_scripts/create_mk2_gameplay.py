import argparse
import retro
import numpy as np
import os
import logging
import time
import sys
import torch
import subprocess
import cv2
import traceback
import threading
import pygame
from skimage.transform import resize
from mk2_envs import init_play_env
from mk2_model_vs_model import load_pytorch_model, get_action
from common.utils import com_print, init_logger
import random
import requests

SAVE_STATE_DIR = "/app/stable-retro/retro/data/stable/MortalKombatII-Genesis"
BACKEND_URL = 'http://host.docker.internal:6001'
FRONTEND_URL = 'http://host.docker.internal:3001'

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("/app/custom_scripts/fight_log.txt"),
                        logging.StreamHandler(sys.stdout)
                    ])

logging.info("Script started")

pygame.init()
screen = pygame.display.set_mode((1280, 720), pygame.HWSURFACE | pygame.DOUBLEBUF | pygame.RESIZABLE)

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
    '-pix_fmt', 'bgr24',  # Change this from 'rgb24' to 'bgr24'
    '-r', '30',
    '-i', '-',
    '-c:v', 'libx264',  # Change from 'mpeg4' to 'libx264' for better compatibility
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
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

def process_frame(obs, ffmpeg_process, frame_count):
    try:
        if isinstance(obs, np.ndarray):
            frame = obs
        else:
            frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        
        frame = cv2.resize(frame, (1280, 720))
        frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)  # Explicitly convert RGB to BGR
        
        pygame_surface = pygame.surfarray.make_surface(frame.swapaxes(0, 1))
        screen.blit(pygame_surface, (0, 0))
        pygame.display.flip()
        
        if ffmpeg_process.poll() is None:
            ffmpeg_process.stdin.write(frame.tobytes())
        else:
            logging.error("FFmpeg process has terminated unexpectedly.")
            return False
        return True
    except Exception as e:
        logging.error(f"Error in process_frame: {str(e)}")
        traceback.print_exc()
        return False


def update_fight_state(fight_id, new_state):
    try:
        response = requests.post(f'{BACKEND_URL}/api/update-fight-state', json={
            'fightId': fight_id,
            'newState': new_state
        })
        if response.status_code == 200:
            logging.info('Fight state updated successfully')
        else:
            logging.error(f'Failed to update fight state: {response.text}')
    except Exception as e:
        logging.error(f'Error updating fight state: {str(e)}')

def main(argv):
    try:
        args = parse_cmdline(argv[1:])
        logger = init_logger(args)
        
        print(f"State file path: {args.state}")
        print(f"P1 model path: {args.load_p1_model}")
        print(f"P2 model path: {args.load_p2_model}")
        
        com_print('========= Initializing =============')
        play_env, button_names = init_play_env(args)
        com_print(f"Available buttons: {button_names}")

        p1_model = load_pytorch_model(args.load_p1_model)
        p2_model = load_pytorch_model(args.load_p2_model)

        com_print('========= Starting Fight ==========')

        ffmpeg_process = setup_ffmpeg_process("full_gameplay")

        fight_id = None

        for round in range(args.num_rounds):
            com_print(f'Round {round + 1}')
            obs = play_env.reset()
            
            if round == 0:
                initial_state = {
                    'round': 1,
                    'p1_health': 100,
                    'p2_health': 100,
                    'timestamp': time.time()
                }
                try:
                    response = requests.post(f'{BACKEND_URL}/api/start-game', json={
                        'gameId': 'MortalKombatII',
                        'initialState': initial_state
                    })
                    response.raise_for_status()
                    fight_data = response.json()
                    fight_id = fight_data['fightId']
                    logging.info(f'New fight started with ID: {fight_id}')
                except requests.RequestException as e:
                    logging.error(f'Failed to start new fight. Status code: {e.response.status_code if e.response else "N/A"}')
                    logging.error(f'Response content: {e.response.text if e.response else "N/A"}')
                    logging.error(f'Error details: {str(e)}')
                    return
                except Exception as e:
                    logging.error(f'Unexpected error starting new fight: {str(e)}')
                    return

            terminated = truncated = False
            total_reward = 0
            step_count = 0
            frame_count = 0
            max_steps = 3000
            frame_skip = 2

            while not (terminated or truncated) and step_count < max_steps:
                if ffmpeg_process.poll() is not None:
                    logging.error("FFmpeg process has terminated unexpectedly. Restarting...")
                    ffmpeg_process = setup_ffmpeg_process("full_gameplay")
                
                if step_count % frame_skip == 0:
                    frame = play_env.render(mode='rgb_array')
                    if process_frame(frame, ffmpeg_process, frame_count):
                        frame_count += 1

                p1_action = get_action(p1_model, obs, button_names)
                p2_action = get_action(p2_model, obs, button_names)

                actions = np.concatenate([p1_action, p2_action])
                actions_str = ''.join(map(str, actions))

                p1_buttons = [button_names[i] for i, act in enumerate(p1_action) if act.any()]
                p2_buttons = [button_names[i] for i, act in enumerate(p2_action) if act.any()]
                com_print(f"P1 actions: {p1_buttons}, P2 actions: {p2_buttons}")

                obs, reward, terminated, truncated, info = play_env.step(actions_str)
                total_reward += reward

                com_print(f"Step {step_count}: Reward: {reward}, Total Reward: {total_reward}")
                com_print(f"Game Info: {info}")

                if step_count % 100 == 0:
                    new_state = {
                        'round': round + 1,
                        'p1_health': info.get('health', 0),
                        'p2_health': info.get('enemy_health', 0),
                        'p1_rounds_won': info.get('rounds_won', 0),
                        'p2_rounds_won': info.get('enemy_rounds_won', 0),
                        'timestamp': time.time()
                    }
                    update_fight_state(fight_id, new_state)

                step_count += 1

                time.sleep(0.05)

                if 'rounds_won' in info:
                    if info['rounds_won'] > 0 or info['enemy_rounds_won'] > 0:
                        com_print(f"Round {round + 1} finished. Total reward: {total_reward}")
                        com_print(f"Rounds won - P1: {info['rounds_won']}, P2: {info['enemy_rounds_won']}")
                        break

            logging.info(f"Round {round + 1} completed. Steps taken: {step_count}")
            time.sleep(2)

        com_print('========= Fight Finished ==========')
        play_env.close()

        if ffmpeg_process:
            ffmpeg_process.stdin.close()
            ffmpeg_process.wait()

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        traceback.print_exc()
        com_print('========= Fight Finished ==========')
        play_env.close()

        if ffmpeg_process:
            ffmpeg_process.stdin.close()
            ffmpeg_process.wait()

def calculate_reward(info):
    p1_health = info['health']
    p2_health = info['enemy_health']
    reward = (p1_health - p2_health) / 100
    return reward

def parse_cmdline(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--env', type=str, default='MortalKombatII-Genesis')
    parser.add_argument('--state', type=str, required=True, help='Name of the save state file')
    parser.add_argument('--load_p1_model', type=str, required=True)
    parser.add_argument('--load_p2_model', type=str, required=True)
    parser.add_argument('--num_rounds', type=int, default=3)
    parser.add_argument('--output_basedir', type=str, default='/app/logs')
    args = parser.parse_args(argv)
    args.state = os.path.join(SAVE_STATE_DIR, args.state)
    if not os.path.exists(args.state):
        raise FileNotFoundError(f"State file not found: {args.state}")
    return args

if __name__ == '__main__':
    main(sys.argv)