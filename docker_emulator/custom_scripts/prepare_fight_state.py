import retro
import argparse
import numpy as np
import hashlib
from solana_interactions import record_save_state_on_chain

def prepare_fight_state(game, fighter1, fighter2, output_path):
    env = retro.make(game)
    env.reset()

    # Advance to character select screen
    for _ in range(180):  # Adjust this number as needed
        env.step(np.zeros(env.action_space.shape))

    # Select fighters (you'll need to implement this based on your fighter selection system)
    select_fighter(env, fighter1, player=1)
    select_fighter(env, fighter2, player=2)

    # Wait for fight to start
    for _ in range(300):  # Adjust this number as needed
        env.step(np.zeros(env.action_space.shape))

    # Save state
    state = env.em.get_state()
    with open(output_path, 'wb') as f:
        f.write(state)
    print(f"Fight state saved to {output_path}")

    # Automatically record the initial state on Solana
    state_hash = hashlib.sha256(state).digest()
    record_save_state_on_chain(
        state_hash,
        100,  # Initial health for player 1
        100,  # Initial health for player 2
        1,    # Round number (always 1 for initial state)
        0,    # Initial score for player 1
        0,    # Initial score for player 2
        0     # Initial game clock
    )
    print("Initial fight state recorded on Solana")

    env.close()

def select_fighter(env, fighter, player):
    character_positions = {
        'LiuKang': (0, 0),
        'KungLao': (1, 0),
        'JohnnyCage': (2, 0),
        'Reptile': (3, 0),
        'SubZero': (0, 1),
        'ShangTsung': (1, 1),
        'Kitana': (2, 1),
        'Jax': (3, 1),
        'Mileena': (0, 2),
        'Baraka': (1, 2),
        'Scorpion': (2, 2),
        'Raiden': (3, 2),
    }
    
    x, y = character_positions[fighter]
    
    # Move to the correct position
    for _ in range(x):
        env.step(np.array([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))  # Right
        env.step(np.zeros(env.action_space.shape))  # Release
    for _ in range(y):
        env.step(np.array([0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]))  # Down
        env.step(np.zeros(env.action_space.shape))  # Release
    
    # Select the character
    env.step(np.array([0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]))  # Button A
    env.step(np.zeros(env.action_space.shape))  # Release

    # Wait a bit for the selection to register
    for _ in range(60):
        env.step(np.zeros(env.action_space.shape))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--game', type=str, required=True, help='Name of the game')
    parser.add_argument('--fighter1', type=str, required=True, help='Name or ID of fighter 1')
    parser.add_argument('--fighter2', type=str, required=True, help='Name or ID of fighter 2')
    parser.add_argument('--output', type=str, required=True, help='Output path for the save state')
    args = parser.parse_args()

    prepare_fight_state(args.game, args.fighter1, args.fighter2, args.output)