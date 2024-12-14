'use client';

import React from 'react';
import { FaStar, FaFistRaised, FaHeartbeat, FaTrophy } from 'react-icons/fa';
import CodeBlock from '../../../../components/codeblock/code-block';

const RewardsPage: React.FC = () => {
  const basicRewardCode = `
from col_retro.environment import CasinoFightingEnv

env = CasinoFightingEnv(
    game='MortalKombatII-Genesis',
    scenario='tournament',
    reward_func='balanced'  # or 'aggressive', 'defensive'
)

# Rewards are provided at each step
obs, reward, term, trunc, info = env.step(action)

# Access detailed metrics
print(f"Hits Landed: {info['hits_landed']}")
print(f"Damage Dealt: {info['damage_dealt']}")
print(f"Health: {info['health_p1']}")`;

  const customRewardCode = `
# custom_reward.json
{
  "name": "aggressive_style",
  "weights": {
    "damage_dealt": 2.0,
    "damage_taken": -0.5,
    "distance_penalty": -0.2,
    "block_reward": 0.1,
    "victory_reward": 100.0
  }
}

# Python usage
env = CasinoFightingEnv(
    game='MortalKombatII-Genesis',
    reward_func='path/to/custom_reward.json'
)`;

  const trainingLoopCode = `
from col_retro.trainers.mk2_trainer import MK2Trainer

trainer = MK2Trainer(
    character='LiuKang',
    reward_style='balanced'
)

# Train with reward monitoring
model = trainer.train(
    total_timesteps=100000,
    callback=RewardTrackingCallback()
)

# Evaluate rewards
results = trainer.evaluate(episodes=10)
print(f"Average Reward: {results['average_reward']}")`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <FaStar className="text-4xl text-yellow-400" />
        <h1 className="text-4xl font-bold">Rewards in Casino of Life</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaFistRaised className="mr-2" /> MK2 Reward Structure
            </h2>
            <p className="mb-4">
              The Casino of Life environment provides a comprehensive reward system for Mortal Kombat II training:
            </p>
            <CodeBlock
              code={basicRewardCode}
              language="python"
              title="Basic Reward Setup"
              description="Initialize environment with reward configuration"
            />
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaHeartbeat className="mr-2" /> Reward Components
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Damage Rewards</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>+1.0 for each point of damage dealt</li>
                  <li>-1.0 for each point of damage taken</li>
                  <li>Bonus for combo chains</li>
                </ul>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Strategic Rewards</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>+0.5 for successful blocks</li>
                  <li>+0.3 for maintaining optimal distance</li>
                  <li>-0.1 for excessive backing away</li>
                </ul>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Victory Rewards</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>+100.0 for winning the round</li>
                  <li>+500.0 for winning the match</li>
                  <li>Bonus for flawless victory</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Custom Reward Functions</h2>
            <p className="mb-4">Create your own reward function:</p>
            <CodeBlock
              code={customRewardCode}
              language="python"
              title="Custom Reward Configuration"
              description="Define and use custom reward weights"
            />
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaTrophy className="mr-2" /> Training Tips
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Reward Shaping</h3>
                <p>Start with dense rewards during early training, then gradually shift to sparser rewards for advanced behavior.</p>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Balance</h3>
                <p>Adjust reward weights to encourage desired fighting style (aggressive, defensive, balanced).</p>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Monitoring</h3>
                <p>Use the info dict to track detailed performance metrics during training.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Example Training Loop</h2>
        <CodeBlock
          code={trainingLoopCode}
          language="python"
          title="Training with Rewards"
          description="Complete example of training with reward monitoring"
        />
      </section>

      <div className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
        <p className="text-lg">
          Now that you understand the reward system, learn about 
          <a href="/education-portal/fundamentals/training" className="text-primary hover:text-primary-focus ml-1">
            Training Strategies
          </a> 
          to maximize your agent&apos;s performance.
        </p>
      </div>
    </div>
  );
};

export default RewardsPage;