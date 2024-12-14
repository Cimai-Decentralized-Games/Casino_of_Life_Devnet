'use client';

import React from "react";
import RLInfoCard from "./rl-info-card";
import Link from "next/link";
import { FaGlobe, FaHandPointer, FaStar, FaChartBar, FaCalculator, FaBalanceScale, FaChartLine, FaBrain, FaNetworkWired, FaTrophy, FaUpload } from 'react-icons/fa';

const fundamentalTopics = [
  { 
    title: "Environment", 
    Icon: FaGlobe,
    description: "The environment is where the agent operates and makes decisions. In our case, this can be a game like Pong or Breakout."
  },
  { 
    title: "Actions", 
    Icon: FaHandPointer,
    description: "Actions are the decisions made by the agent to interact with the environment. These actions can include moving left, right, jumping, or pressing a button in a game."
  },
  { 
    title: "Rewards", 
    Icon: FaStar,
    description: "Rewards are the feedback the agent receives based on the actions it takes. Positive rewards encourage behavior, while negative rewards discourage it."
  },
  { 
    title: "States", 
    Icon: FaChartBar,
    description: "A state represents a snapshot of the environment at a particular time. It includes all the information the agent uses to make decisions."
  },
  { 
    title: "Training", 
    Icon: FaBrain,
    description: "Training is the process of updating the agent's policy based on the feedback it receives from the environment."
  },
  {
    title: "Evaluation",
    Icon: FaCalculator,
    description: "Evaluation is the process of testing the agent's performance in the environment."
  },
  { 
    title: "PPO ", 
    Icon: FaCalculator,
    description: "PPO is a popular policy gradient method that uses a trust region to update the policy, ensuring that the updates are not too large and avoiding divergence."
  },
  {
    title: "Tournaments",
    Icon: FaTrophy,
    description: "Tournament System is the process of testing the agent's performance in the environment."
  },
  {
    title: "tournament-system",
    Icon: FaUpload,
    description: "Tournament System is the process of submitting the agent's trained model to the tournament system."
  }
];

const strategyTopics = [
  { 
    title: "Exploration vs Exploitation", 
    Icon: FaBalanceScale,
    description: "An agent must balance exploring new actions and exploiting known actions that yield high rewards. Too much exploration can lead to inefficient learning, while too much exploitation may cause the agent to miss better strategies."
  },
  { 
    title: "Policy Gradient", 
    Icon: FaChartLine,
    description: "Policy gradient methods directly optimize the policy (the action-selection mechanism) to maximize the reward. These methods work well in environments with continuous action spaces."
  },
  { 
    title: "PPO", 
    Icon: FaBrain,
    description: "PPO is a popular policy gradient method that uses a trust region to update the policy, ensuring that the updates are not too large and avoiding divergence."
  },
  { 
    title: "Deep Q-Networks", 
    Icon: FaNetworkWired,
    description: "Deep Q-Networks combine Q-learning with deep neural networks, allowing the agent to handle more complex environments with large state spaces, such as retro games."
  }
];

const RLBasics: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Introduction to Reinforcement Learning (RL)</h1>
      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <p className="text-lg text-center">
          Reinforcement Learning (RL) is a type of machine learning where an agent
          learns by interacting with an environment and receiving feedback in the
          form of rewards or penalties. The goal of the agent is to maximize its
          cumulative reward over time by taking appropriate actions.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6">Fundamentals of RL</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fundamentalTopics.map((topic, index) => (
            <Link 
              href={`/education-portal/fundamentals/${topic.title
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')}`} 
              key={index}
            >
              <RLInfoCard
                title={topic.title}
                Icon={topic.Icon}
                description={topic.description}
              />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-semibold mb-6">Basic RL Strategies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {strategyTopics.map((topic, index) => (
            <Link href={`/education-portal/strategies/${topic.title.toLowerCase().replace(/\s+/g, '-')}`} key={index}>
              <RLInfoCard
                title={topic.title}
                Icon={topic.Icon}
                description={topic.description}
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default RLBasics;