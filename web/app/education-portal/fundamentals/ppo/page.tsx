'use client';

import React from 'react';
import { FaRobot, FaBrain, FaChartLine, FaCog } from 'react-icons/fa';
import CodeBlock from '../../../../components/codeblock/code-block';

const PPOPage: React.FC = () => {
  const basicPPOCode = `
from col_retro.trainers.mk2_trainer import MK2Trainer
from stable_baselines3 import PPO

# Initialize trainer with PPO algorithm
trainer = MK2Trainer(
    character='LiuKang',
    algorithm='ppo',
    policy='CnnPolicy'
)

# Configure and train the model
model = trainer.train(
    total_timesteps=100000,
    learning_rate=3e-4,
    n_steps=2048,
    batch_size=64,
    n_epochs=10,
    gamma=0.99,
    gae_lambda=0.95,
    clip_range=0.2
)`;

  const advancedPPOCode = `
from col_retro.environment import CasinoFightingEnv
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import EvalCallback

# Create environment
env = CasinoFightingEnv(
    game='MortalKombatII-Genesis',
    scenario='tournament'
)

# Custom network architecture
policy_kwargs = {
    "net_arch": [
        dict(
            pi=[128, 128],  # Policy network
            vf=[128, 128]   # Value function network
        )
    ]
}

# Initialize PPO with custom settings
model = PPO(
    "CnnPolicy",
    env,
    learning_rate=3e-4,
    n_steps=2048,
    batch_size=64,
    n_epochs=10,
    gamma=0.99,
    gae_lambda=0.95,
    clip_range=0.2,
    policy_kwargs=policy_kwargs,
    verbose=1
)`;

  const customTrainingCode = `
from col_retro.trainers.mk2_trainer import MK2Trainer
from stable_baselines3.common.callbacks import CheckpointCallback, EvalCallback

# Create trainer with custom configuration
trainer = MK2Trainer(
    character='LiuKang',
    algorithm='ppo',
    policy='CnnPolicy',
    custom_features=True
)

# Setup callbacks
checkpoint_callback = CheckpointCallback(
    save_freq=10000,
    save_path="./checkpoints/",
    name_prefix="mk2_ppo"
)

eval_callback = EvalCallback(
    eval_env=trainer.create_eval_env(),
    n_eval_episodes=5,
    eval_freq=5000,
    log_path="./eval_logs/",
    best_model_save_path="./best_model/"
)

# Train with advanced monitoring
model = trainer.train(
    total_timesteps=500000,
    callback=[checkpoint_callback, eval_callback],
    progress_bar=True
)`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <FaRobot className="text-4xl text-primary" />
        <h1 className="text-4xl font-bold">PPO in Casino of Life</h1>
      </div>

      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <p className="text-lg">
          Proximal Policy Optimization (PPO) is our primary training algorithm in Casino of Life. 
          It provides stable training for fighting game agents by carefully controlling policy updates 
          while maximizing performance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaBrain className="mr-2" /> Basic PPO Setup
            </h2>
            <p className="mb-4">
              Get started with PPO training in MK2:
            </p>
            <CodeBlock
              code={basicPPOCode}
              language="python"
              title="Basic PPO Training"
              description="Initialize and train a PPO agent"
            />
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Key PPO Parameters</h2>
            <div className="space-y-4">
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Learning Parameters</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>learning_rate: 3e-4 (recommended)</li>
                  <li>n_steps: 2048 (batch collection)</li>
                  <li>batch_size: 64 (training batch)</li>
                  <li>n_epochs: 10 (update iterations)</li>
                </ul>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Policy Parameters</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>gamma: 0.99 (discount factor)</li>
                  <li>gae_lambda: 0.95 (GAE parameter)</li>
                  <li>clip_range: 0.2 (policy update limit)</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaChartLine className="mr-2" /> Advanced Configuration
            </h2>
            <p className="mb-4">Custom PPO setup with advanced features:</p>
            <CodeBlock
              code={advancedPPOCode}
              language="python"
              title="Advanced PPO Setup"
              description="Configure PPO with custom network architecture"
            />
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaCog className="mr-2" /> Training Monitoring
            </h2>
            <p className="mb-4">Track and evaluate your PPO agent:</p>
            <CodeBlock
              code={customTrainingCode}
              language="python"
              title="Custom Training Setup"
              description="Advanced training with callbacks and monitoring"
            />
          </section>
        </div>
      </div>

      <section className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">PPO Advantages</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold mb-2">Stability</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Controlled policy updates</li>
              <li>Robust learning process</li>
              <li>Consistent performance</li>
            </ul>
          </div>
          <div className="p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold mb-2">Performance</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Sample efficient</li>
              <li>Good exploration</li>
              <li>Scalable training</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
        <p className="text-lg">
          Ready to start training? Check out our 
          <a href="/education-portal/fundamentals/training" className="text-primary hover:text-primary-focus ml-1">
            Training Guide
          </a> 
          for complete examples and best practices.
        </p>
      </div>
    </div>
  );
};

export default PPOPage;