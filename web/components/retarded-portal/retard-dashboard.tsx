'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBrain, FaChartLine, FaRobot, FaNetworkWired } from 'react-icons/fa';
import RLInfoCard from './ai-info-card';
import RetardBasics from './retard-basics';
import RetardCurve from './retard-curve';
import RetardGameInteractions from './retard-game-interactions';
import RetardAIStrategy from './retard-ai';

type RetardDashboardProps = Record<string, never>;

const tools = [
  {
    title: "Retard Basics",
    description: "Learn the basics of Retardio Gaming",
    component: "retard-basics",
    Icon: FaBrain
  },
  {
    title: "Retard Curve",
    description: "Interactive yield curve for RAPR and DUMBS",
    component: "retard-curve",
    Icon: FaChartLine
  },
  {
    title: "Agent Training",
    description: "Train your own RL agent in classic game environments",
    component: "retard-game-interactions",
    Icon: FaRobot
  },
  {
    title: "Retard AI",
    description: "Explore how AI agents work with NFTs and blockchain",
    component: "retard-ai",
    Icon: FaNetworkWired
  }
];

const RetardDashboard: React.FC<RetardDashboardProps> = () => {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  const handleNavigateToTraining = () => {
    setActiveComponent('retard-game-interactions');
  };

  const handleModelTrained = () => {
    console.log('Model trained');
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case 'retard-basics':
        return <RetardBasics />;
      case 'retard-curve':
        return <RetardCurve />;
      case 'retard-game-interactions':
        return <RetardGameInteractions onModelTrained={handleModelTrained} />;
      case 'retard-ai':
        return <RetardAIStrategy />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
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

export default RetardDashboard;