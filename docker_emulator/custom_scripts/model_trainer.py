"""
Train a Model on Mortal Kombat II using stable-retro
"""

import warnings
warnings.filterwarnings("ignore")

import os
import sys
import retro
import cv2
import subprocess
import time
import datetime
import argparse
import logging
import signal
import psutil
import numpy as np
import gymnasium as gym
import traceback
import torch
from stable_baselines3 import PPO
from stable_baselines3.common.vec_env import DummyVecEnv, VecFrameStack
import base64
import io
from PIL import Image
import json
import requests
import threading

BACKEND_URL = 'http://host.docker.internal:6001'

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def log_system_info():
    logging.info(f"CPU usage: {psutil.cpu_percent()}%")
    logging.info(f"Memory usage: {psutil.virtual_memory().percent}%")
    logging.info(f"Available memory: {psutil.virtual_memory().available / (1024 * 1024):.2f} MB")

def signal_handler(signum, frame):
    logging.error(f"Received signal {signum}")
    log_system_info()
    sys.exit(1)

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

def parse_cmdline(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--env', type=str, default='MortalKombatII-Genesis')
    parser.add_argument('--state', type=str, default=None)
    parser.add_argument('--num_env', type=int, default=1)
    parser.add_argument('--num_timesteps', type=int, default=10000)
    parser.add_argument('--output_basedir', type=str, default='~/OUTPUT')
    parser.add_argument('--load_model', type=str, default='')
    parser.add_argument('--play', default=False, action='store_true')
    parser.add_argument('--record', default=False, action='store_true')
    parser.add_argument('--stream', default=False, action='store_true')
    parser.add_argument('--stream_saved', default=False, action='store_true')
    parser.add_argument('--video_path', type=str, default='')
    return parser.parse_args(argv)

def check_docker_limits():
    try:
        with open('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'r') as f:
            memory_limit = int(f.read().strip()) / (1024 * 1024)  # Convert to MB
        with open('/sys/fs/cgroup/cpu/cpu.cfs_quota_us', 'r') as f:
            cpu_quota = int(f.read().strip())
        with open('/sys/fs/cgroup/cpu/cpu.cfs_period_us', 'r') as f:
            cpu_period = int(f.read().strip())
        
        cpu_limit = cpu_quota / cpu_period if cpu_quota > 0 else "Unlimited"
        
        logging.info(f"Docker memory limit: {memory_limit:.2f} MB")
        logging.info(f"Docker CPU limit: {cpu_limit}")
    except Exception as e:
        logging.error(f"Error checking Docker limits: {str(e)}")

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
        if np.random.rand() < 0.05:  # 5% chance of random action
            action = np.random.randint(2, size=len(button_names))

        logging.info(f"Action: {action}")
        
    return action

def train_model(env, num_timesteps, output_basedir):
    model = PPO('CnnPolicy', env, verbose=1)
    model.learn(total_timesteps=num_timesteps)
    
    # Save the model
    if not os.path.exists(output_basedir):
        os.makedirs(output_basedir)
    model_path = os.path.join(output_basedir, "model.zip")
    model.save(model_path)
    
    return model_path

def make_retro_env(game, state=retro.State.DEFAULT, num_env=1):
    def make_env():
        env = retro.RetroEnv(game=game, state=state, render_mode="rgb_array")
        return env
    return DummyVecEnv([make_env for _ in range(num_env)])

class ModelTrainer:
    def __init__(self, args):
        self.args = args
        logging.info(f"Initializing ModelTrainer with args: {args}")
        log_system_info()
        
        try:
            self.env = make_retro_env(args.env, args.state, args.num_env)
            self.env = VecFrameStack(self.env, n_stack=4)
            logging.info("Environment created successfully")
        except Exception as e:
            logging.error(f"Error creating environment: {str(e)}")
            raise

        if args.load_model:
            try:
                self.model = PPO.load(args.load_model, env=self.env)
                logging.info(f"Model loaded from {args.load_model}")
            except Exception as e:
                logging.error(f"Error loading model: {str(e)}")
                raise
        else:
            try:
                self.model = PPO('CnnPolicy', self.env, verbose=1)
                logging.info("New PPO model created")
            except Exception as e:
                logging.error(f"Error creating new model: {str(e)}")
                raise

    def train(self):
        logging.info('========= Start Training ==========')
        log_system_info()
        
        start_time = time.time()
        last_log_time = start_time
        
        try:
            for step in range(self.args.num_timesteps):
                try:
                    self.model.learn(total_timesteps=1, reset_num_timesteps=False, progress_bar=False)
                except Exception as e:
                    logging.error(f"Error during training step {step}: {str(e)}")
                    logging.error(traceback.format_exc())
                    raise
                
                current_time = time.time()
                if current_time - last_log_time >= 5:  # Log every 5 seconds
                    logging.info(f"Step {step + 1}/{self.args.num_timesteps}")
                    log_system_info()
                    last_log_time = current_time

            logging.info('Training completed successfully')
        except Exception as e:
            logging.error(f"Error during training: {str(e)}")
            logging.error(traceback.format_exc())
            raise

        model_savepath = os.path.join(self.args.output_basedir, f"{self.args.env}_model.zip")
        try:
            self.model.save(model_savepath)
            logging.info(f'Model saved to: {model_savepath}')
        except Exception as e:
            logging.error(f"Error saving model: {str(e)}")
            raise

        log_system_info()
        return model_savepath

    def play(self, stream=True, save_video=False):
        logging.info('========= Start Play Loop ==========')
        log_system_info()
        
        obs = self.env.reset()
        
        if stream:
            try:
                ffmpeg_process = setup_ffmpeg_stream()
                threading.Thread(target=log_ffmpeg_output, args=(ffmpeg_process,), daemon=True).start()
                logging.info("FFmpeg stream setup successfully")
            except Exception as e:
                logging.error(f"Error setting up FFmpeg stream: {str(e)}")
                raise

        if save_video:
            try:
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                video_path = os.path.join(self.args.output_basedir, f"{self.args.env}_gameplay.mp4")
                out = cv2.VideoWriter(video_path, fourcc, 30.0, (256, 224))
                logging.info(f"Video recording setup successfully. Path: {video_path}")
            except Exception as e:
                logging.error(f"Error setting up video recording: {str(e)}")
                raise
        
        try:
            step_count = 0
            while True:
                action, _states = self.model.predict(obs, deterministic=True)
                obs, rewards, dones, info = self.env.step(action)
                img = self.env.render(mode='rgb_array')[0]  # Get the first environment's render
                
                if save_video:
                    out.write(cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
                
                if stream:
                    success = process_frame(self.env, ffmpeg_process, step_count)
                    if not success:
                        logging.warning(f"Failed to process frame at step {step_count}")
                        break

                img_pil = Image.fromarray(img)
                img_buffer = io.BytesIO()
                img_pil.save(img_buffer, format='JPEG')
                img_str = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
                
                yield img_str
                
                if dones[0]:
                    obs = self.env.reset()
                
                step_count += 1
                if step_count % 100 == 0:
                    logging.info(f"Completed {step_count} steps")
                    log_system_info()
        
        except Exception as e:
            logging.error(f"Error during play loop: {str(e)}")
            raise
        
        finally:
            if save_video:
                out.release()
                logging.info("Video saved successfully")
            if stream:
                ffmpeg_process.stdin.close()
                ffmpeg_process.wait()
                logging.info("FFmpeg process closed")
            self.env.close()
            logging.info("Environment closed")
        
        if save_video:
            logging.info(f'Video saved to: {video_path}')
            return video_path

def main(argv):
    args = parse_cmdline(argv[1:])
    logging.info(f"Starting main function with args: {args}")
    log_system_info()
    check_docker_limits()

    try:
        trainer = ModelTrainer(args)
        logging.info(f"ModelTrainer initialized successfully")

        if args.play:
            logging.info(f"Starting play mode")
            video_path = None
            for frame in trainer.play(stream=args.stream, save_video=args.record):
                if args.stream:
                    print(f"data:image/jpeg;base64,{frame}")
                    sys.stdout.flush()
        elif args.stream_saved:
            logging.info(f"Starting stream_saved mode")
            for frame in trainer.stream_saved_video(args.video_path):
                print(f"data:image/jpeg;base64,{frame}")
                sys.stdout.flush()
        else:
            logging.info(f"Starting training mode")
            model_path = trainer.train()
            logging.info(f"Training finished. Model saved at: {model_path}")
            
            if args.play:
                logging.info(f"Starting play mode after training")
                video_path = None
                for frame in trainer.play(stream=args.stream, save_video=args.record):
                    if args.stream:
                        print(f"data:image/jpeg;base64,{frame}")
                        sys.stdout.flush()

        if args.record:
            logging.info(f"Gameplay finished. Video saved at: {video_path}" if video_path else "Gameplay finished.")

    except Exception as e:
        logging.error(f"An error occurred in main: {str(e)}")
        logging.error(traceback.format_exc())
        sys.exit(1)

if __name__ == '__main__':
    main(sys.argv)

