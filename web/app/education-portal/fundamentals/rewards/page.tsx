import React from 'react';
import { FaStar } from 'react-icons/fa';

const RewardsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 flex items-center">
        <FaStar className="mr-4 text-yellow-400" /> Rewards in Reinforcement Learning
      </h1>
      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <p className="text-lg">
          Rewards are the fundamental driving force in Reinforcement Learning. They provide feedback to the agent about the desirability of its actions, guiding it towards optimal behavior.
        </p>
      </div>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Key Aspects of Rewards</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Scalar feedback signals that the agent receives after each action</li>
          <li>Can be positive (encouragement) or negative (discouragement)</li>
          <li>Define the goal of the learning process</li>
          <li>Shape the agent's behavior over time</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Types of Reward Structures</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Sparse Rewards</h3>
            <p>Rewards are given infrequently, often only at the end of an episode or upon achieving a specific goal.</p>
            <p className="mt-2 italic">Example: A reward only when winning a game of chess.</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Dense Rewards</h3>
            <p>Rewards are given frequently, providing more immediate feedback on the agent's actions.</p>
            <p className="mt-2 italic">Example: Points for each piece captured in chess.</p>
          </div>
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Reward Function</h2>
        <p className="text-lg mb-4">
          The reward function R(s, a, s') defines the reward given for transitioning from state s to s' by taking action a. It encapsulates the goal of the learning task.
        </p>
        <div className="bg-base-100 p-4 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">Characteristics of a Good Reward Function</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Aligned with the true objective of the task</li>
            <li>Provides sufficient information to learn the desired behavior</li>
            <li>Balances immediate feedback with long-term goals</li>
            <li>Avoids reward hacking (unintended optimization)</li>
          </ul>
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Challenges in Reward Design</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Reward sparsity: Too infrequent rewards can slow down learning</li>
          <li>Reward shaping: Carefully designing rewards to guide learning without oversimplifying the task</li>
          <li>Delayed rewards: Handling situations where the consequences of actions are not immediately apparent</li>
          <li>Multi-objective rewards: Balancing multiple, possibly conflicting objectives</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Importance in RL</h2>
        <p className="text-lg mb-4">
          Rewards are crucial in RL for several reasons:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>Define the goal of the learning process</li>
          <li>Provide the learning signal that guides the agent's behavior</li>
          <li>Allow for the formulation of the RL problem as reward maximization</li>
          <li>Enable the agent to learn complex behaviors without explicit programming</li>
        </ul>
      </section>
    </div>
  );
};

export default RewardsPage;