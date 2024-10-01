import os
import numpy as np
import gymnasium as gym
import retro
from gymnasium import spaces
# Define use_frame_skip at the top of the file
use_frame_skip = True

class StochasticFrameSkip(gym.Wrapper):
    def __init__(self, env, n, stickprob):
        gym.Wrapper.__init__(self, env)
        self.n = n
        self.stickprob = stickprob
        self.curac = None
        self.rng = np.random.RandomState()

    def reset(self, **kwargs):
        self.curac = None
        return self.env.reset(**kwargs)

    def step(self, ac):
        done = False
        totrew = 0
        for i in range(self.n):
            if self.curac is None:
                self.curac = ac
            elif i == 0:
                if self.rng.rand() > self.stickprob:
                    self.curac = ac
            elif i == 1:
                self.curac = ac
            ob, rew, terminated, truncated, info = self.env.step(self.curac)
            totrew += rew
            if terminated or truncated:
                done = True
                break
        return ob, totrew, terminated, truncated, info

def make_retro(*, game, state, num_players, **kwargs):
    env = retro.make(game, state, **kwargs, players=num_players)
    return env

def init_env(game, state, num_players):
    env = make_retro(game=game, state=state, num_players=num_players)
    
    if use_frame_skip:
        env = StochasticFrameSkip(env, n=4, stickprob=0.25)
    
    env = gym.wrappers.ResizeObservation(env, (84, 84))
    env = gym.wrappers.GrayScaleObservation(env)
    env = gym.wrappers.FrameStack(env, 4)
    
    return env

def get_button_names(env):
    return env.unwrapped.buttons

def init_play_env(args):
    env = init_env(args.env, args.state, num_players=2)
    button_names = env.unwrapped.buttons
    print(f"Environment action space: {env.action_space}")
    print(f"Environment observation space: {env.observation_space}")
    return env, button_names