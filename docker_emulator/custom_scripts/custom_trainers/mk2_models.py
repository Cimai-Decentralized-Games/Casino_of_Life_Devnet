import os
import numpy as np
from stable_baselines3 import PPO, A2C
import torch as th
from torchsummary import summary

def print_model_info(model, args):
    if args.nn == 'CnnPolicy':
        summary(model.policy, (4, 84, 84))  # Assuming 4 stacked frames of 84x84 images
    elif args.nn == 'MlpPolicy':
        summary(model.policy, (1, 128))  # Adjust input size based on MK2's state representation

def get_num_parameters(model):
    return sum(p.numel() for p in model.policy.parameters() if p.requires_grad)

def get_model_probabilities(model, state):
    obs = model.policy.obs_to_tensor(state)[0]
    dis = model.policy.get_distribution(obs)
    probs = dis.distribution.probs
    return probs.detach().cpu().numpy()

def init_model(output_path, player_model, player_alg, args, env, logger):
    policy_kwargs = None
    if args.nn == 'MlpPolicy':
        size = args.nnsize if hasattr(args, 'nnsize') else 64
        policy_kwargs = dict(activation_fn=th.nn.ReLU,
                             net_arch=[dict(pi=[size, size], vf=[size, size])])

    if player_alg in ['ppo', 'ppo2']:
        if player_model:
            model = PPO.load(os.path.expanduser(player_model), env=env)
        else:
            batch_size = (128 * args.num_env) // 4 if hasattr(args, 'num_env') else 32
            model = PPO(policy=args.nn, env=env, policy_kwargs=policy_kwargs,
                        verbose=1, n_steps=2048, n_epochs=4, batch_size=batch_size,
                        learning_rate=2.5e-4, clip_range=0.2, vf_coef=0.5, ent_coef=0.01,
                        max_grad_norm=0.5, clip_range_vf=None)
    elif player_alg == 'a2c':
        if player_model:
            model = A2C.load(os.path.expanduser(player_model), env=env)
        else:
            model = A2C(policy=args.nn, env=env, policy_kwargs=policy_kwargs,
                        verbose=1, tensorboard_log=output_path)
    else:
        raise ValueError(f"Unsupported algorithm: {player_alg}")

    model.set_logger(logger)
    return model