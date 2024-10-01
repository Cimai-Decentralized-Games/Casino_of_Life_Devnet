import sys
import argparse
import numpy as np
import torch

from common import com_print, init_logger
from mk2_envs import init_play_env

def parse_cmdline(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--env', type=str, default='MortalKombatII-Genesis')
    parser.add_argument('--state', type=str, required=True, help='Path to the save state file')
    parser.add_argument('--load_p1_model', type=str, required=True)
    parser.add_argument('--load_p2_model', type=str, required=True)
    parser.add_argument('--num_rounds', type=int, default=3)
    parser.add_argument('--output_basedir', type=str, default='/app/logs')
    return parser.parse_args(argv)

def load_pytorch_model(model_path):
    model = torch.load(model_path)
    model.eval()
    return model

def get_action(model, observation):
    with torch.no_grad():
        if isinstance(observation, np.ndarray):
            observation = torch.FloatTensor(observation)
        elif isinstance(observation, tuple) or isinstance(observation, list):
            observation = torch.FloatTensor(np.array(observation))
        else:
            observation = torch.FloatTensor(np.array(observation))
        
        observation = observation.unsqueeze(0)
        
        model_output = model(observation)
        action_probs = model_output[0]  # Get the first item of the tuple
        action = torch.argmax(action_probs, dim=1).item()
    return action

def main(argv):
    args = parse_cmdline(argv[1:])
    logger = init_logger(args)
    
    com_print('========= Initializing =============')
    play_env, button_names = init_play_env(args)
    com_print(f"Available buttons: {button_names}")

    p1_model = load_pytorch_model(args.load_p1_model)
    p2_model = load_pytorch_model(args.load_p2_model)

    com_print('========= Starting Fight ==========')

    for round in range(args.num_rounds):
        com_print(f'Round {round + 1}')
        obs, _ = play_env.reset()
        terminated = truncated = False
        total_reward = 0

        while not (terminated or truncated):
            p1_action = get_action(p1_model, obs)
            p2_action = get_action(p2_model, obs)

            p1_buttons = [button_names[p1_action]]
            p2_buttons = [button_names[p2_action]]
            
            com_print(f"P1 action: {p1_buttons}, P2 action: {p2_buttons}")

            actions = [p1_action, p2_action]
            obs, reward, terminated, truncated, info = play_env.step(actions)
            total_reward += reward

            play_env.render()

            if terminated or truncated:
                com_print(f"Round {round + 1} finished. Total reward: {total_reward}")
                com_print(f"Info: {info}")
                break

    com_print('========= Fight Finished ==========')
    play_env.close()

if __name__ == '__main__':
    main(sys.argv)