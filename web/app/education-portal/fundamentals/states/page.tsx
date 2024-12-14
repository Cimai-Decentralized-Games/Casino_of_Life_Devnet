'use client';

import React from 'react';
import { FaMapMarkedAlt, FaGamepad, FaEye, FaChartBar } from 'react-icons/fa';
import CodeBlock from '../../../../components/codeblock/code-block';

const StatesPage: React.FC = () => {
  const basicStateCode = `
from col_retro.environment import CasinoFightingEnv

env = CasinoFightingEnv(
    game='MortalKombatII-Genesis',
    scenario='tournament'
)

# Get initial state
observation, info = env.reset()

# State components:
print(f"Frame shape: {observation.shape}")  # (224, 256, 3)
print(f"Player health: {info['health_p1']}")
print(f"Opponent health: {info['health_p2']}")
print(f"Round time: {info['time']}")`;

  const stateProcessingCode = `
import numpy as np
from col_retro.environment import CasinoFightingEnv

class CustomStateProcessor:
    def __init__(self):
        self.env = CasinoFightingEnv(
            game='MortalKombatII-Genesis'
        )
        
    def process_state(self, obs, info):
        # Normalize health values
        p1_health = info['health_p1'] / 100.0
        p2_health = info['health_p2'] / 100.0
        
        # Calculate distance between players
        p1_x = info['p1_x']
        p2_x = info['p2_x']
        distance = abs(p1_x - p2_x) / 256.0
        
        # Combine state components
        state = {
            'frame': obs / 255.0,  # Normalize pixels
            'health_diff': p1_health - p2_health,
            'distance': distance,
            'time': info['time'] / 99.0
        }
        
        return state`;

  const advancedStateCode = `
from col_retro.trainers.mk2_trainer import MK2Trainer

class StateTracker:
    def __init__(self):
        self.trainer = MK2Trainer(
            character='LiuKang',
            state_processor=CustomStateProcessor()
        )
        
    def analyze_state(self, state, info):
        # Analyze current situation
        advantage = self._calculate_advantage(state)
        opportunities = self._detect_opportunities(state)
        risks = self._assess_risks(state)
        
        return {
            'advantage': advantage,
            'opportunities': opportunities,
            'risks': risks
        }`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <FaMapMarkedAlt className="text-4xl text-primary" />
        <h1 className="text-4xl font-bold">States in Casino of Life</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaGamepad className="mr-2" /> MK2 State Space
            </h2>
            <p className="mb-4">
              In Mortal Kombat II, the state consists of processed frame data and game information:
            </p>
            <CodeBlock
              code={basicStateCode}
              language="python"
              title="Basic State Structure"
              description="Initialize environment and access state components"
            />
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaEye className="mr-2" /> State Components
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Visual State</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>RGB frame (224x256x3)</li>
                  <li>Preprocessed for neural networks</li>
                  <li>Optional grayscale conversion</li>
                </ul>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Game State</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Player health (0-100)</li>
                  <li>Opponent health (0-100)</li>
                  <li>Round timer (0-99)</li>
                  <li>Player positions</li>
                  <li>Active animations</li>
                </ul>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Match State</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Round number</li>
                  <li>Wins/losses</li>
                  <li>Match status</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">State Processing</h2>
            <p className="mb-4">Example of custom state processing:</p>
            <CodeBlock
              code={stateProcessingCode}
              language="python"
              title="Custom State Processing"
              description="Process and normalize state information"
            />
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaChartBar className="mr-2" /> State Analysis
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Frame Analysis</h3>
                <p>Use computer vision to extract player positions, animations, and hit detection.</p>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">State Tracking</h3>
                <p>Monitor state transitions to understand game dynamics and strategy effectiveness.</p>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Feature Engineering</h3>
                <p>Create derived features like health differences, positioning advantages, and combo opportunities.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Advanced State Management</h2>
        <CodeBlock
          code={advancedStateCode}
          language="python"
          title="Advanced State Tracking"
          description="Track and analyze complex state information"
        />
      </section>

      <div className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
        <p className="text-lg">
          Now that you understand states, learn about 
          <a href="/education-portal/fundamentals/training" className="text-primary hover:text-primary-focus ml-1">
            Training Strategies
          </a> 
          to help your agent make the best decisions based on these states.
        </p>
      </div>
    </div>
  );
};

export default StatesPage;
