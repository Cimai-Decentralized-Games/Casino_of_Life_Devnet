import React from 'react';
import { FaHandPointer } from 'react-icons/fa';

const ActionsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 flex items-center">
        <FaHandPointer className="mr-4" /> Actions in Reinforcement Learning
      </h1>
      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <p className="text-lg">
          In Reinforcement Learning, actions are the decisions made by the agent to interact with the environment. 
          These are the choices available to the agent at each step of the learning process.
        </p>
      </div>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Key Aspects of Actions</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Represent the agent's possible interactions with the environment</li>
          <li>Can be discrete (e.g., move left, right) or continuous (e.g., steering angle)</li>
          <li>Directly influence the state of the environment</li>
          <li>Lead to rewards or penalties, guiding the learning process</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Types of Action Spaces</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Discrete Action Space</h3>
            <p>Finite set of possible actions (e.g., up, down, left, right in a grid world)</p>
          </div>
          <div className="bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">Continuous Action Space</h3>
            <p>Infinite set of possible actions (e.g., exact angle and force in a robotic arm)</p>
          </div>
        </div>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Examples of Actions in RL</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Moving a game character (e.g., left, right, jump in a platformer game)</li>
          <li>Selecting a move in a board game (e.g., placing a piece in Go)</li>
          <li>Adjusting controls in a simulation (e.g., throttle and steering in a racing game)</li>
          <li>Making decisions in real-world scenarios (e.g., buying or selling stocks)</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Importance in RL</h2>
        <p className="text-lg">
          Actions are crucial in RL as they determine how the agent interacts with and learns from its environment. 
          The choice of actions directly impacts the agent's ability to maximize rewards and achieve its goals. 
          Designing an appropriate action space is a key part of formulating an RL problem.
        </p>
      </section>
    </div>
  );
};

export default ActionsPage;