'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBrain, FaChartLine, FaRobot, FaNetworkWired } from 'react-icons/fa';
import RLInfoCard from './rl-info-card';
import RLBasics from './rl-basics';
import ColCurve from './col-curve';
import RLGameInteraction from './rl-game-interactions';
import DecentralizedAI from './decentralized-ai';

const tools = [
  {
    title: "RL Basics",
    description: "Learn the fundamentals of Reinforcement Learning",
    component: "rl-basics",
    Icon: FaBrain
  },
  {
    title: "Casino of Life Curve",
    description: "Interactive Bonding Curve with Agent controlled PID controller",
    component: "col-curve",
    Icon: FaChartLine
  },
  {
    title: "Agent Training",
    description: "Train your own RL agent in classic game environments",
    component: "rl-game-interactions",
    Icon: FaRobot
  },
  {
    title: "Decentralized AI",
    description: "Explore how AI agents work with NFTs and blockchain",
    component: "decentralized-ai",
    Icon: FaNetworkWired
  }
];

const LearnRL: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  const handleNavigateToTraining = () => {
    setActiveComponent('rl-game-interactions');
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case 'rl-basics':
        return <RLBasics />;
      case 'col-curve':
        return <ColCurve />;
      case 'rl-game-interactions':
        return <RLGameInteraction game="Mortal Kombat II" />;
      case 'decentralized-ai':
        return <DecentralizedAI onNavigateToTraining={handleNavigateToTraining} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Learn Reinforcement Learning</h1>
      <AnimatePresence mode="wait">
        {!activeComponent ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {tools.map((tool) => (
              <motion.div
                key={tool.component}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <RLInfoCard
                  title={tool.title}
                  description={tool.description}
                  onClick={() => setActiveComponent(tool.component)}
                  Icon={tool.Icon}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="component"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-base-200 p-6 rounded-lg shadow-lg"
          >
            <button 
              className="btn btn-secondary mb-4"
              onClick={() => setActiveComponent(null)}
            >
              Back to Dashboard
            </button>
            {renderComponent()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearnRL;
