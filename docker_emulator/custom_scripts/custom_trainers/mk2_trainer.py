"""
Game specific training script for Mortal Kombat II The Arcade Game on Genesis
"""

import warnings
warnings.filterwarnings("ignore")

import os
import sys
import retro
import datetime
import argparse
import logging
import numpy as np
import gc

from ..common.utils import get_model_file_name, com_print, init_logger, create_output_dir
from ..game_wrappers_mgr import init as init_wrappers
from ..model_trainer import ModelTrainer
from ..model_vs_game import ModelVsGame

NUM_TEST_MATCHES = 10

def parse_cmdline(argv):
    parser = argparse.ArgumentParser()

    parser.add_argument('--alg', type=str, default='ppo2', help='Algorithm to use (e.g., ppo2, a2c)')
    parser.add_argument('--nn', type=str, default='CnnPolicy', help='Neural network policy to use')
    parser.add_argument('--model_desc', type=str, default='CNN', help='Description of the model')
    parser.add_argument('--env', type=str, default='MortalKombatII-Genesis', help='Retro environment name')
    parser.add_argument('--state', type=str, default=None, help='Initial state of the environment')
    parser.add_argument('--num_players', type=int, default=2, help='Number of players')
    parser.add_argument('--num_env', type=int, default=16, help='Number of parallel environments')
    parser.add_argument('--num_timesteps', type=int, default=10_000_000, help='Number of timesteps to train')
    parser.add_argument('--output_basedir', type=str, default='~/OUTPUT', help='Base directory for output')
    parser.add_argument('--load_model', type=str, default='', help='Path to pre-trained model to load')
    parser.add_argument('--opponent_model', type=str, default='', help='Path to opponent model')
    parser.add_argument('--character', type=str, required=True, help='Character to train')
    parser.add_argument('--opponents', nargs='+', default=['random'], help='List of opponents to train against')
    parser.add_argument('--alg_verbose', action='store_true', help='Verbose output for algorithm')
    parser.add_argument('--info_verbose', action='store_true', help='Verbose info output')
    parser.add_argument('--display_width', type=int, default=1440, help='Display width for rendering')
    parser.add_argument('--display_height', type=int, default=810, help='Display height for rendering')
    parser.add_argument('--deterministic', action='store_true', help='Use deterministic actions')
    parser.add_argument('--test_only', action='store_true', help='Only run tests, no training')
    parser.add_argument('--play', action='store_true', help='Play the game with trained model')

    args = parser.parse_args(argv)

    return args

def create_training_states(character, opponents):
    states = []
    for opponent in opponents:
        states.append(f"{character}Vs{opponent}_VeryHard_01")
    return states

def test_model(args, num_matches, logger):
    game = ModelVsGame(args, logger, need_display=False)

    won_matches = 0
    total_rewards = 0
    for i in range(num_matches):
        info, reward = game.play(False)
        if info[0].get('enemy_health') == 0:
            won_matches += 1
        total_rewards += reward

    return won_matches, total_rewards

def main(argv):
    args = parse_cmdline(argv[1:])
    logger = init_logger(args)
    wrapper_class = init_wrappers(args)
    env = wrapper_class(retro.make(args.env))
    
    com_print('================ MK2 trainer ================')
    game_states = create_training_states(args.character, args.opponents)
    com_print('These states will be trained on:')
    com_print(game_states)

    args.alg_verbose = False
    
    model_path = args.load_model

    if not args.test_only:    
        for state in game_states:
            com_print(f'TRAINING ON STATE:{state} - {args.num_timesteps} timesteps')
            args.state = state
            args.load_model = model_path
            trainer = ModelTrainer(args, logger)
            model_path = trainer.train()

            gc.collect()

    com_print('====== TESTING MODEL ======')
    for state in game_states:
        num_test_matches = NUM_TEST_MATCHES
        new_args = args
        new_args.model_1 = model_path
        new_args.model_2 = args.opponent_model
        won_matches, total_reward = test_model(new_args, num_test_matches, logger)
        percentage = won_matches / num_test_matches
        com_print(f'STATE:{state}... WON MATCHES:{won_matches}/{num_test_matches} TOTAL REWARDS:{total_reward}')
        gc.collect()

    if args.play:
        args.state = game_states[0]  # Use the first state for play mode
        args.model_1 = model_path
        args.model_2 = args.opponent_model
        args.num_timesteps = 0

        player = ModelVsGame(args, logger, True)
        player.play(continuous=True, need_reset=False)

if __name__ == '__main__':
    main(sys.argv)