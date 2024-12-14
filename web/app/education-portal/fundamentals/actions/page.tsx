'use client';

import React from 'react';
import { FaHandPointer, FaGamepad, FaCode } from 'react-icons/fa';
import CodeBlock from '../../../../components/codeblock/code-block';

const ActionsPage: React.FC = () => {
  const actionSpaceCode = `
from col_retro.environment import CasinoFightingEnv

env = CasinoFightingEnv(
    game='MortalKombatII-Genesis',
    scenario='tournament'
)

# Action space structure:
# [UP, DOWN, LEFT, RIGHT, A, B, C, X, Y, Z, MODE, START]
action = env.action_space.sample()  # Random action`;

  const specialMovesCode = `
import numpy as np
from col_retro.environment import CasinoFightingEnv

def perform_hadoken():
    # Initialize action array (all buttons released)
    action = np.zeros(12, dtype=np.int8)
    
    # Sequence: DOWN, DOWN+RIGHT, RIGHT + PUNCH
    sequences = [
        {'DOWN': 1},
        {'DOWN': 1, 'RIGHT': 1},
        {'RIGHT': 1, 'A': 1}  # High Punch
    ]
    
    return sequences

# Use in environment
env = CasinoFightingEnv(
    game='MortalKombatII-Genesis',
    scenario='tournament'
)

obs, info = env.reset()
for move in perform_hadoken():
    action = np.zeros(12, dtype=np.int8)
    for button, value in move.items():
        action[env.buttons.index(button)] = value
    obs, reward, term, trunc, info = env.step(action)`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <FaHandPointer className="text-4xl text-primary" />
        <h1 className="text-4xl font-bold">Actions in Casino of Life</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaGamepad className="mr-2" /> MK2 Action Space
            </h2>
            <p className="mb-4">
              In Mortal Kombat II, actions are represented as a 12-button discrete space:
            </p>
            <CodeBlock
              code={actionSpaceCode}
              language="python"
              title="Action Space Definition"
              description="Basic setup and action space structure"
            />
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Button Mappings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Movement</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>UP: Jump</li>
                  <li>DOWN: Duck</li>
                  <li>LEFT: Move Left</li>
                  <li>RIGHT: Move Right</li>
                </ul>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Attack Buttons</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>A: High Punch</li>
                  <li>B: High Kick</li>
                  <li>C: Block</li>
                  <li>X: Low Punch</li>
                  <li>Y: Low Kick</li>
                  <li>Z: Special</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaCode className="mr-2" /> Using Actions
            </h2>
            <p className="mb-4">Example of performing specific moves:</p>
            <CodeBlock
              code={specialMovesCode}
              language="python"
              title="Special Move Implementation"
              description="Example of implementing a Hadoken-style special move"
            />
          </section>

          <section className="bg-base-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Special Moves</h2>
            <p className="mb-4">Common special move patterns:</p>
            <div className="space-y-3">
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Projectile</h3>
                <p className="font-mono">↓ ↘ → + Punch</p>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Upper Cut</h3>
                <p className="font-mono">↓ ↑ + Punch</p>
              </div>
              <div className="p-4 bg-base-300 rounded-lg">
                <h3 className="font-semibold mb-2">Sweep</h3>
                <p className="font-mono">← ↙ ↓ + Kick</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Training Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold mb-2">Basic Training</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Start with basic moves before combinations</li>
              <li>Use reward function to encourage effective moves</li>
            </ul>
          </div>
          <div className="p-4 bg-base-300 rounded-lg">
            <h3 className="font-semibold mb-2">Advanced Training</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Consider action timing in your strategy</li>
              <li>Balance exploration and exploitation</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-8 bg-base-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
        <p className="text-lg">
          Now that you understand the action space, learn about 
          <a href="/education-portal/fundamentals/rewards" className="text-primary hover:text-primary-focus ml-1">
            Reward Functions
          </a> 
          and how they guide your agent&apos;s learning process.
        </p>
      </div>
    </div>
  );
};

export default ActionsPage;