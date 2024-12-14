'use client';

import React from 'react';
import { FaFingerprint, FaLink, FaDatabase, FaRobot, FaMoneyBillWave, FaGlobeAmericas, FaShieldAlt, FaUsers, FaVideo } from 'react-icons/fa';

const FeatureItem: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <li className="flex items-start mb-4">
    <div className="mr-4 mt-1">{icon}</div>
    <div>
      <strong className="block mb-1">{title}</strong>
      <span>{description}</span>
    </div>
  </li>
);

interface DecentralizedAIProps {
  onNavigateToTraining?: () => void;
}

const DecentralizedAI: React.FC<DecentralizedAIProps> = ({ onNavigateToTraining }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Decentralized AI and Proof-of-Gun</h1>
      
      {/* Video Section */}
      <section className="mb-12 bg-base-200 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <FaVideo className="mr-2" /> 
          Understanding Decentralized AI
        </h2>
        <div className="aspect-w-16 aspect-h-9">
          {/* Replace with your video embed */}
          <div className="bg-base-300 rounded-lg flex items-center justify-center">
            <p className="text-center">Educational Video Coming Soon</p>
          </div>
        </div>
      </section>

      {/* Key Concepts */}
      <section className="mb-12 bg-base-200 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Key Concepts</h2>
        <ul className="space-y-2">
          <FeatureItem 
            icon={<FaDatabase className="text-primary" />} 
            title="Proof-of-Gun" 
            description="Our innovative consensus mechanism using Gun.js for decentralized data storage and validation." 
          />
          <FeatureItem 
            icon={<FaMoneyBillWave className="text-primary" />} 
            title="FreeDUMBS Rewards" 
            description="Earn FreeDUMBS tokens by participating in the decentralized AI network." 
          />
          <FeatureItem 
            icon={<FaRobot className="text-primary" />} 
            title="AI Model Storage" 
            description="Store and manage AI models in a truly peer-to-peer way using Gun.js." 
          />
        </ul>
      </section>

      {/* Benefits Section */}
      <section className="mb-12 bg-base-200 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Benefits of Our Approach</h2>
        <ul className="space-y-2">
          <FeatureItem 
            icon={<FaGlobeAmericas className="text-secondary" />} 
            title="True Decentralization" 
            description="No central servers or authorities - pure peer-to-peer data storage and sharing." 
          />
          <FeatureItem 
            icon={<FaShieldAlt className="text-secondary" />} 
            title="Data Sovereignty" 
            description="You maintain control of your AI models while sharing them with the network." 
          />
          <FeatureItem 
            icon={<FaUsers className="text-secondary" />} 
            title="Community Rewards" 
            description="Earn FreeDUMBS by contributing to the network's storage and validation." 
          />
        </ul>
      </section>

      {/* How It Works */}
      <section className="mt-12 bg-base-200 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">How Proof-of-Gun Works</h2>
        <ol className="list-decimal list-inside space-y-4">
          <li className="p-3 bg-base-300 rounded">Store your AI models in the Gun.js network</li>
          <li className="p-3 bg-base-300 rounded">Participate in network validation and storage</li>
          <li className="p-3 bg-base-300 rounded">Earn FreeDUMBS tokens for your contributions</li>
          <li className="p-3 bg-base-300 rounded">Use FreeDUMBS for network governance and rewards</li>
          <li className="p-3 bg-base-300 rounded">Help build a truly decentralized AI ecosystem</li>
        </ol>
      </section>

      {/* Call to Action */}
      <section className="mt-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
        <p className="mb-6">Join our community and start earning FreeDUMBS today!</p>
        <button 
          onClick={onNavigateToTraining}
          className="btn btn-primary btn-lg"
        >
          Train Your Model
        </button>
      </section>
    </div>
  );
};

export default DecentralizedAI;
