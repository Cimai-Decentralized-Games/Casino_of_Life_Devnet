import retro
import argparse
import numpy as np
import logging
import os
import torch

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def create_save_states(game, output_dir, p1_character, p2_character, render=False):
    try:
        env = retro.make(game)
        obs = env.reset()
        logging.info(f"Environment created for {game}")

        # 1. Initial state (title screen)
        save_state(env, os.path.join(output_dir, "1_title_screen.state"))

        # Navigate through initial screens
        for _ in range(180):  # Adjust this number as needed
            obs, _, _, _ = env.step(np.zeros(env.action_space.shape))
            if render:
                env.render()

        # Press start to get to main menu
        env.step(np.array([0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]))  # Button A (Start)
        env.step(np.zeros(env.action_space.shape))  # Release

        # 2. Main menu state
        save_state(env, os.path.join(output_dir, "2_main_menu.state"))

        # Wait for main menu
        for _ in range(60):  # Adjust as needed
            obs, _, _, _ = env.step(np.zeros(env.action_space.shape))
            if render:
                env.render()

        # Navigate to VS mode (assuming it's the first option)
        env.step(np.array([0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]))  # Button A (Select VS mode)
        env.step(np.zeros(env.action_space.shape))  # Release

        # Wait for character select screen
        for _ in range(120):  # Adjust as needed
            obs, _, _, _ = env.step(np.zeros(env.action_space.shape))
            if render:
                env.render()

        # 3. Character select screen state
        save_state(env, os.path.join(output_dir, "3_character_select.state"))

        # Select characters
        select_character(env, p1_character, player=1, render=render)
        select_character(env, p2_character, player=2, render=render)

        # Wait for fight to start
        for _ in range(300):  # Adjust this number as needed
            obs, _, _, _ = env.step(np.zeros(env.action_space.shape))
            if render:
                env.render()

        # 4. Fight start state
        save_state(env, os.path.join(output_dir, "4_fight_start.state"))

        # Run the fight
        done = False
        while not done:
            action = np.zeros(env.action_space.shape)
            obs, reward, done, info = env.step(action)
            if render:
                env.render()
            
            if 'p1_health' in info and 'p2_health' in info:
                if info['p1_health'] <= 0 or info['p2_health'] <= 0:
                    done = True

        # Determine the winner
        if info['p1_health'] > info['p2_health']:
            winner = "Player 1"
        else:
            winner = "Player 2"

        logging.info(f"Fight finished. Winner: {winner}")

        # 5. Post-fight state
        post_fight_state_path = os.path.join(output_dir, "5_post_fight.state")
        save_state(env, post_fight_state_path)

        # Save winner information
        winner_info_path = post_fight_state_path + ".winner"
        with open(winner_info_path, 'w') as f:
            f.write(winner)
        logging.info(f"Winner information saved to: {winner_info_path}")

        return winner

    except Exception as e:
        logging.error(f"Error creating save states: {str(e)}")
    finally:
        env.close()

def save_state(env, output_path):
    state = env.em.get_state()
    with open(output_path, 'wb') as f:
        f.write(state)
    logging.info(f"Save state created at: {output_path}")

def select_character(env, character, player, render=False):
    character_positions = {
        'LiuKang': (0, 0),
        'Kung Lao': (1, 0),
        'Johnny Cage': (2, 0),
        'Reptile': (3, 0),
        'SubZero': (0, 1),
        'Shang Tsung': (1, 1),
        'Kitana': (2, 1),
        'Jax': (3, 1),
        'Mileena': (0, 2),
        'Baraka': (1, 2),
        'Scorpion': (2, 2),
        'Raiden': (3, 2),
    }
    
    if character not in character_positions:
        raise ValueError(f"Invalid character: {character}")
    
    x, y = character_positions[character]
    
    # Move to the correct position
    for _ in range(x):
        env.step(np.array([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))  # Right
        env.step(np.zeros(env.action_space.shape))  # Release
        if render:
            env.render()
    for _ in range(y):
        env.step(np.array([0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]))  # Down
        env.step(np.zeros(env.action_space.shape))  # Release
        if render:
            env.render()
    
    # Select the character
    env.step(np.array([0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]))  # Button A
    env.step(np.zeros(env.action_space.shape))  # Release
    
    # Wait for selection to register
    for _ in range(60):
        env.step(np.zeros(env.action_space.shape))
        if render:
            env.render()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--game', type=str, default='MortalKombatII-Genesis')
    parser.add_argument('--output', type=str, required=True, help='Output directory for save states')
    parser.add_argument('--p1', type=str, required=True, help='Player 1 character')
    parser.add_argument('--p2', type=str, required=True, help='Player 2 character')
    parser.add_argument('--render', action='store_true', help='Render the environment')
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    winner = create_save_states(args.game, args.output, args.p1, args.p2, args.render)
    print(f"The winner is: {winner}")