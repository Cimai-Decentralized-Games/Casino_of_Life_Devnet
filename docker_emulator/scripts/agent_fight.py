import argparse
import retro
import numpy as np
import os
import logging
import time
from stable_baselines3 import PPO
from tensorflow.keras.models import load_model

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def load_model_based_on_extension(model_path):
    _, extension = os.path.splitext(model_path)
    try:
        if extension == '.zip':
            return PPO.load(model_path)
        elif extension == '.h5':
            return load_model(model_path)
        else:
            raise ValueError(f"Unsupported model format: {extension}")
    except Exception as e:
        logging.error(f"Error loading model from {model_path}: {str(e)}")
        raise

def agent_fight(env_name, model1_path, model2_path, save_state_path, num_rounds=3):
    try:
        env = retro.make(env_name)
        logging.info(f"Environment '{env_name}' created successfully")
        
        model1 = load_model_based_on_extension(model1_path)
        model2 = load_model_based_on_extension(model2_path)
        logging.info("Both models loaded successfully")
        
        p1_wins = 0
        p2_wins = 0
        
        for round in range(num_rounds):
            logging.info(f"Starting round {round + 1}")
            
            # Load the save state
            try:
                with open(save_state_path, 'rb') as f:
                    env.em.set_state(f.read())
                logging.info("Save state loaded successfully")
            except Exception as e:
                logging.error(f"Error loading save state: {str(e)}")
                raise
            
            obs = env.reset()
            done = False
            while not done:
                action1 = model1.predict(obs[0])[0] if isinstance(model1, PPO) else np.argmax(model1.predict(obs[0]))
                action2 = model2.predict(obs[1])[0] if isinstance(model2, PPO) else np.argmax(model2.predict(obs[1]))
                
                # Ensure actions are compatible with the environment
                action1 = np.clip(action1, env.action_space.low, env.action_space.high)
                action2 = np.clip(action2, env.action_space.low, env.action_space.high)
                
                obs, reward, done, info = env.step(np.concatenate([action1, action2]))
                
                env.render()
                
                if 'p1_health' not in info or 'p2_health' not in info:
                    logging.warning("Health information not found in environment info")
                    break
                
                if info['p1_health'] <= 0 or info['p2_health'] <= 0:
                    done = True
            
            # Determine winner
            if info['p1_health'] > info['p2_health']:
                logging.info(f"Round {round + 1}: Model 1 wins!")
                p1_wins += 1
            else:
                logging.info(f"Round {round + 1}: Model 2 wins!")
                p2_wins += 1
            
            # Pause between rounds
            time.sleep(2)
        
        logging.info(f"Final Result - Model 1: {p1_wins} wins, Model 2: {p2_wins} wins")
    
    except Exception as e:
        logging.error(f"An error occurred during the fight: {str(e)}")
    finally:
        env.close()
        logging.info("Environment closed")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--env', type=str, required=True, help='Name of the Retro environment')
    parser.add_argument('--model1', type=str, required=True, help='Path to the first model')
    parser.add_argument('--model2', type=str, required=True, help='Path to the second model')
    parser.add_argument('--save_state', type=str, required=True, help='Path to the save state file')
    parser.add_argument('--num_rounds', type=int, default=3, help='Number of rounds to fight')
    args = parser.parse_args()
    
    agent_fight(args.env, args.model1, args.model2, args.save_state, args.num_rounds)