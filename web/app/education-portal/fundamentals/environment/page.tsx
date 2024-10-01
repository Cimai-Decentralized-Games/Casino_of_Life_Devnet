'use client';

import React from 'react';
import { FaGlobe } from 'react-icons/fa';

const Environment: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 flex items-center">
        <FaGlobe className="mr-4" /> Environment in Reinforcement Learning
      </h1>
      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <p className="text-lg">
          In Reinforcement Learning, the environment is the world in which the agent operates and makes decisions. 
          It's the setting that provides the context for the learning process.
        </p>
      </div>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Key Aspects of the Environment</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Defines the state space (all possible situations the agent can be in)</li>
          <li>Determines the available actions the agent can take</li>
          <li>Provides feedback in the form of rewards or penalties</li>
          <li>Changes in response to the agent's actions</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Examples of Environments</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Game worlds (e.g., chess board, Atari games)</li>
          <li>Simulated physical systems (e.g., robotic arm, self-driving car simulator)</li>
          <li>Real-world scenarios (e.g., stock market, traffic control system)</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Importance in RL</h2>
        <p className="text-lg">
          Understanding the environment is crucial for designing effective RL algorithms. 
          The complexity of the environment often determines the difficulty of the learning task 
          and influences the choice of RL techniques to be used.
        </p>
      </section>
    </div>
  );
};

export default Environment;