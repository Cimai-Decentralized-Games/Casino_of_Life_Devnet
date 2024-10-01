'use client';

import React from "react";
import RLInfoCard from "./rl-info-card";
import Link from "next/link";
import { FaGlobe, FaHandPointer, FaStar, FaChartBar, FaCalculator, FaBalanceScale, FaChartLine, FaBrain, FaNetworkWired } from 'react-icons/fa';

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
    title: "Q-Value", 
    Icon: FaCalculator,
    description: "A Q-value represents the value of taking a particular action in a given state, helping the agent determine which action will yield the highest reward."
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
    title: "Q-Learning", 
    Icon: FaBrain,
    description: "Q-learning is a popular value-based method where the agent updates its Q-values (state-action values) to converge on the optimal strategy over time."
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
            <Link href={`/education-portal/fundamentals/${topic.title.toLowerCase()}`} key={index}>
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