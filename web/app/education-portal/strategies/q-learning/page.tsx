import React from 'react';
import { FaBrain } from 'react-icons/fa';

const QLearningPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 flex items-center">
        <FaBrain className="mr-4" /> Q-Learning in Reinforcement Learning
      </h1>
      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <p className="text-lg">
          Q-Learning is a model-free reinforcement learning algorithm used to find the optimal action-selection policy for any given Markov Decision Process (MDP). It&apos;s an off-policy learner, meaning it can learn from actions that are outside the current policy.
        </p>
      </div>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Key Concepts</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Value-based method that learns Q-values for state-action pairs</li>
          <li>Off-policy learning allows for exploration without affecting the learned policy</li>
          <li>Uses temporal difference (TD) learning to update Q-values</li>
          <li>Balances exploration and exploitation using strategies like ε-greedy</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">The Q-Learning Algorithm</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Initialize Q-values for all state-action pairs arbitrarily</li>
          <li>For each episode:</li>
          <li className="ml-6">Choose a starting state</li>
          <li className="ml-6">While the state is not terminal:</li>
          <li className="ml-12">Choose an action using an exploration strategy (e.g., ε-greedy)</li>
          <li className="ml-12">Take the action, observe reward R and new state S&apos;</li>
          <li className="ml-12">Update Q-value using the Q-learning update rule</li>
          <li className="ml-12">Move to the new state S&apos;</li>
          <li>Repeat until convergence</li>
        </ol>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Q-Learning Update Rule</h2>
        <div className="bg-base-100 p-4 rounded-lg shadow">
          <p className="text-lg font-semibold mb-2">Q(S, A) ← Q(S, A) + α [R + γ max<sub>a</sub> Q(S&apos;, a) - Q(S, A)]</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Q(S, A): Q-value for the current state-action pair</li>
            <li>α: Learning rate (0 &lt; α ≤ 1)</li>
            <li>R: Immediate reward</li>
            <li>γ: Discount factor (0 ≤ γ &lt; 1)</li>
            <li>max<sub>a</sub> Q(S&apos;, a): Maximum Q-value for the next state</li>
          </ul>
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Advantages of Q-Learning</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Model-free: Does not require knowledge of the environment&apos;s dynamics</li>
          <li>Off-policy: Can learn from actions not in the current policy, allowing for exploration</li>
          <li>Guaranteed convergence to optimal policy (given sufficient exploration)</li>
          <li>Can handle stochastic environments</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Challenges and Limitations</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Curse of dimensionality: Q-table becomes impractical for large state spaces</li>
          <li>Slow convergence in some environments</li>
          <li>Struggles with continuous state or action spaces without function approximation</li>
          <li>May overestimate Q-values in certain situations</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Variants and Extensions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Double Q-Learning</h3>
            <p>Addresses overestimation bias by using two Q-functions.</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Delayed Q-Learning</h3>
            <p>Provides probably approximately correct (PAC) learning guarantees.</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Peng&apos;s Q(λ)</h3>
            <p>Combines Q-learning with eligibility traces for faster learning.</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Deep Q-Network (DQN)</h3>
            <p>Uses neural networks to approximate Q-values for complex state spaces.</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Applications</h2>
        <p className="text-lg mb-4">
          Q-Learning has been successfully applied in various domains:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>Game playing (e.g., simple board games, Atari games)</li>
          <li>Robotics and control systems</li>
          <li>Resource management and scheduling</li>
          <li>Traffic light control</li>
          <li>Recommendation systems</li>
        </ul>
      </section>
    </div>
  );
};

export default QLearningPage;