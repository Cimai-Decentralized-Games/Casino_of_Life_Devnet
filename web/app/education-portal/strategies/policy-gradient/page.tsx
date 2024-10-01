import React from 'react';
import { FaChartLine } from 'react-icons/fa';

const PolicyGradientPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 flex items-center">
        <FaChartLine className="mr-4" /> Policy Gradient Methods in Reinforcement Learning
      </h1>
      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <p className="text-lg">
          Policy Gradient methods are a class of reinforcement learning algorithms that directly optimize the policy by estimating the gradient of expected returns with respect to the policy parameters. These methods are particularly effective in continuous action spaces and can learn stochastic policies.
        </p>
      </div>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Key Concepts</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Direct policy optimization without needing to maintain a value function</li>
          <li>Can learn stochastic policies, which can be beneficial in certain environments</li>
          <li>Often more stable and scalable in high-dimensional or continuous action spaces</li>
          <li>Gradient estimation typically uses Monte Carlo methods</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">How Policy Gradient Methods Work</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Initialize the policy parameters θ</li>
          <li>Collect a set of trajectories by executing the current policy</li>
          <li>Estimate the gradient of the expected return with respect to θ</li>
          <li>Update the policy parameters using gradient ascent</li>
          <li>Repeat steps 2-4 until convergence</li>
        </ol>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Advantages of Policy Gradient Methods</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Effective in high-dimensional and continuous action spaces</li>
          <li>Can learn stochastic policies, which can be optimal in some cases</li>
          <li>Often have better convergence properties than value-based methods</li>
          <li>Can be easily extended to handle partially observable environments</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Common Policy Gradient Algorithms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">REINFORCE</h3>
            <p>The simplest policy gradient method, using Monte Carlo estimates of the gradient.</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Actor-Critic</h3>
            <p>Combines policy gradient with value function estimation to reduce variance in gradient estimates.</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Proximal Policy Optimization (PPO)</h3>
            <p>Uses a clipped objective function to ensure stable policy updates.</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Trust Region Policy Optimization (TRPO)</h3>
            <p>Enforces a trust region constraint to limit the size of policy updates.</p>
          </div>
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Challenges and Limitations</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>High variance in gradient estimates, especially for long trajectories</li>
          <li>Can be sample inefficient compared to some value-based methods</li>
          <li>Sensitive to hyperparameter choices</li>
          <li>May converge to local optima rather than global optima</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Advanced Concepts</h2>
        <div className="space-y-4">
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Natural Policy Gradient</h3>
            <p>Uses the Fisher information matrix to compute more effective policy updates.</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Deterministic Policy Gradient</h3>
            <p>Extends policy gradient methods to deterministic policies, which can be more sample efficient.</p>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Applications</h2>
        <p className="text-lg mb-4">
          Policy Gradient methods have been successfully applied in various domains:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>Robotics control and manipulation</li>
          <li>Game playing (e.g., Go, StarCraft II)</li>
          <li>Autonomous driving</li>
          <li>Natural language processing tasks</li>
        </ul>
      </section>
    </div>
  );
};

export default PolicyGradientPage;