import React from 'react';
import { FaNetworkWired } from 'react-icons/fa';

const DeepQNetworksPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 flex items-center">
        <FaNetworkWired className="mr-4" /> Deep Q-Networks (DQN) in Reinforcement Learning
      </h1>
      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <p className="text-lg">
          Deep Q-Networks (DQN) combine Q-learning with deep neural networks, allowing reinforcement learning agents to handle complex environments with large state spaces, such as video games or robotic control tasks.
        </p>
      </div>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Key Components of DQN</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Deep Neural Network: Approximates the Q-function</li>
          <li>Experience Replay: Stores and randomly samples past experiences</li>
          <li>Target Network: A separate network for stable Q-value estimation</li>
          <li>ε-greedy Exploration: Balances exploration and exploitation</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">How DQN Works</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>The agent observes the current state of the environment</li>
          <li>The state is passed through the Q-network to estimate Q-values for all actions</li>
          <li>An action is selected based on the ε-greedy policy</li>
          <li>The agent receives a reward and observes the next state</li>
          <li>The experience (state, action, reward, next state) is stored in the replay buffer</li>
          <li>A random batch of experiences is sampled from the replay buffer</li>
          <li>The Q-network is updated using the sampled experiences and the target network</li>
          <li>Periodically, the target network is updated to match the Q-network</li>
        </ol>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Advantages of DQN</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Can handle high-dimensional state spaces</li>
          <li>Learns directly from raw sensory inputs (e.g., pixels in Atari games)</li>
          <li>Improved stability compared to standard Q-learning with function approximation</li>
          <li>Can learn complex strategies in challenging environments</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Challenges and Limitations</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Can be sample inefficient, requiring many interactions with the environment</li>
          <li>May struggle with very long-term dependencies</li>
          <li>Overestimation bias of Q-values</li>
          <li>Difficulty in handling continuous action spaces</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Variants and Improvements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Double DQN</h3>
            <p>Addresses overestimation bias by using separate networks for action selection and evaluation.</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Dueling DQN</h3>
            <p>Separates the estimation of state value and action advantage for improved learning efficiency.</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Prioritized Experience Replay</h3>
            <p>Prioritizes important transitions in the replay buffer for more efficient learning.</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Rainbow DQN</h3>
            <p>Combines multiple improvements to DQN for state-of-the-art performance.</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Applications of DQN</h2>
        <p className="text-lg mb-4">
          DQN has been successfully applied to various domains, including:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>Playing Atari games at human-level performance</li>
          <li>Robotic control and manipulation tasks</li>
          <li>Resource management in computer systems</li>
          <li>Traffic light control in urban environments</li>
        </ul>
      </section>
    </div>
  );
};

export default DeepQNetworksPage;