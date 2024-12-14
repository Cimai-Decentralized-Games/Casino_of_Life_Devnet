'use client';

import React from 'react';
import { FaDumbbell, FaBrain, FaChartLine, FaCog } from 'react-icons/fa';
import CodeBlock from '../../../../components/codeblock/code-block';

const TrainingPage: React.FC = () => {
  const basicTrainingCode = `
from col_retro.trainers.mk2_trainer import MK2Trainer

# Initialize trainer
trainer = MK2Trainer(
    character='LiuKang',
    save_dir='my_trained_models'
)

# Start training
model = trainer.train(
    total_timesteps=100000,
    learning_rate=3e-4,
    batch_size=64
)
  `;

  const advancedTrainingCode = `
from col_retro.trainers.mk2_trainer import MK2Trainer
from stable_baselines3.common.callbacks import EvalCallback

# Create custom callback for tournament evaluation
eval_callback = EvalCallback(
    eval_env=tournament_env,
    eval_freq=10000,
    n_eval_episodes=5,
    best_model_save_path='./best_model'
)

# Initialize trainer with custom settings
trainer = MK2Trainer(
    character='LiuKang',
    save_dir='tournament_models',
    n_envs=4  # Parallel environments
)

# Advanced training configuration
model = trainer.train(
    total_timesteps=500000,
    learning_rate=linear_schedule(3e-4),
    callback=eval_callback,
    custom_features=True
)
  `;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-4">
          <FaDumbbell className="text-primary" />
          Training Your MK2 Agent
        </h1>
        <p className="text-lg opacity-90">
          Learn how to train your AI agent to become a formidable fighter in Mortal Kombat II.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-6">
          <div className="bg-base-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FaBrain className="text-primary" />
              Basic Training
            </h2>
            
            <p className="mb-4">
              Start with basic training to get your agent learning the fundamentals:
            </p>

            <CodeBlock
              code={basicTrainingCode}
              language="python"
              title="Basic Training Setup"
              description="Simple configuration to start training your agent"
            />
          </div>

          <div className="bg-base-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Training Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-base-300 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Learning Rate</h3>
                <p className="text-sm opacity-80">
                  Start with 3e-4 and adjust based on training stability
                </p>
              </div>
              <div className="bg-base-300 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Batch Size</h3>
                <p className="text-sm opacity-80">
                  64-128 for single environment, 32-64 for parallel environments
                </p>
              </div>
              {/* Add more parameter cards */}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-base-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FaChartLine className="text-primary" />
              Advanced Training
            </h2>
            
            <p className="mb-4">
              Advanced techniques for competitive agent development:
            </p>

            <CodeBlock
              code={advancedTrainingCode}
              language="python"
              title="Advanced Training Configuration"
              description="Setup for parallel training with evaluation callbacks"
            />
          </div>

          <div className="bg-base-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FaCog className="text-primary" />
              Training Tips
            </h2>
            
            <div className="space-y-4">
              <div className="bg-base-300 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Curriculum Learning</h3>
                <p className="text-sm opacity-80">
                  Start with basic moves and gradually increase complexity
                </p>
              </div>
              
              <div className="bg-base-300 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Reward Shaping</h3>
                <p className="text-sm opacity-80">
                  Adjust rewards to encourage desired fighting style
                </p>
              </div>
              
              <div className="bg-base-300 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Model Evaluation</h3>
                <p className="text-sm opacity-80">
                  Regularly test against different opponents and scenarios
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
        <p>
          Ready to test your trained agent? Learn about 
          <a href="/education-portal/fundamentals/evaluation" className="text-primary hover:text-primary-focus ml-1">
            Evaluation Strategies
          </a> 
          to measure your agent&apos;s performance.
        </p>
      </div>
    </div>
  );
};

export default TrainingPage;