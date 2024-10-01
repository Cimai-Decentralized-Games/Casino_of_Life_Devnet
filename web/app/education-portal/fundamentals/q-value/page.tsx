import React from 'react';
import { FaCalculator } from 'react-icons/fa';

const QValuePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 flex items-center">
        <FaCalculator className="mr-4" /> Q-Value in Reinforcement Learning
      </h1>
      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <p className="text-lg">
          In Reinforcement Learning, a Q-value represents the expected cumulative reward of taking a particular action in a given state and then following the optimal policy thereafter. It's a fundamental concept in value-based RL methods.
        </p>
      </div>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Key Aspects of Q-Values</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Represent the quality of an action in a given state</li>
          <li>Help the agent determine which action will yield the highest long-term reward</li>
          <li>Are updated iteratively as the agent interacts with the environment</li>
          <li>Form the basis for Q-learning and other value-based RL algorithms</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Q-Value Equation</h2>
        <div className="bg-base-100 p-4 rounded-lg shadow">
          <p className="text-lg font-semibold mb-2">Q(s, a) = R(s, a) + γ * max(Q(s', a'))</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Q(s, a): Q-value of taking action a in state s</li>
            <li>R(s, a): Immediate reward for taking action a in state s</li>
            <li>γ (gamma): Discount factor for future rewards (0 ≤ γ ≤ 1)</li>
            <li>max(Q(s', a')): Maximum Q-value for the next state s'</li>
          </ul>
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Q-Value in Action</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Q-Table</h3>
            <p>In simple environments, Q-values can be stored in a table, with rows representing states and columns representing actions.</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Q-Network</h3>
            <p>In complex environments, Q-values are approximated using neural networks, forming the basis of Deep Q-Networks (DQN).</p>
          </div>
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Importance in RL</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Guide the agent's decision-making process</li>
          <li>Enable value-based learning methods like Q-learning</li>
          <li>Provide a way to balance immediate rewards with long-term gains</li>
          <li>Form the foundation for more advanced RL techniques</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Challenges and Considerations</h2>
        <p className="text-lg mb-4">
          While Q-values are powerful, they come with challenges:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>Can be difficult to estimate accurately in large state spaces</li>
          <li>May suffer from overestimation bias in certain situations</li>
          <li>Require careful balancing of exploration and exploitation</li>
          <li>Can be computationally intensive to update in complex environments</li>
        </ul>
      </section>
    </div>
  );
};

export default QValuePage;