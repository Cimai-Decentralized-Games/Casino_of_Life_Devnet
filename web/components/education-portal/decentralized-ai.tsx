'use client';

import React, { useState } from 'react';
import { FaFingerprint, FaLink, FaClock, FaExchangeAlt, FaMoneyBillWave, FaTrash, FaGlobeAmericas, FaShieldAlt, FaUsers } from 'react-icons/fa';

interface AIModel {
  id: number | null;
  name: string;
  version: string;
  creator: string;
  creationDate: string;
}

const FeatureItem: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <li className="flex items-start mb-4">
    <div className="mr-4 mt-1">{icon}</div>
    <div>
      <strong className="block mb-1">{title}</strong>
      <span>{description}</span>
    </div>
  </li>
);

const DecentralizedAI: React.FC = () => {
  const [aiModel, setAiModel] = useState<AIModel>({
    id: null,
    name: '',
    version: '',
    creator: '',
    creationDate: '',
  });

  const createAIModelNFT = () => {
    const newModel: AIModel = {
      id: Math.floor(Math.random() * 1000000),
      name: `AI Model ${Math.floor(Math.random() * 100)}`,
      version: `1.0.${Math.floor(Math.random() * 10)}`,
      creator: `Developer${Math.floor(Math.random() * 10)}`,
      creationDate: new Date().toISOString(),
    };
    setAiModel(newModel);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Decentralized AI and NFTs</h1>
      
      <section className="mb-12 bg-base-200 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">The Role of NFTs in Decentralized AI Ecosystems</h2>
        <p className="mb-4">
          AI models as NFTs create new layers of interaction between developers, users, and investors. 
          Here's how this fits into Casino of Life's IP valuation framework:
        </p>
        <ul className="space-y-2">
          <FeatureItem icon={<FaFingerprint className="text-primary" />} title="Uniquely Identifiable" description="AI models serialized as NFTs are uniquely identifiable." />
          <FeatureItem icon={<FaLink className="text-primary" />} title="Tangible Evidence of Existence" description="Blockchain provides a permanent, verifiable record." />
          <FeatureItem icon={<FaClock className="text-primary" />} title="Identifiable Point in Time" description="Each serialized AI model has a specific minting date." />
          <FeatureItem icon={<FaExchangeAlt className="text-primary" />} title="Legally Enforced and Transferable" description="Smart contracts ensure creator's rights are upheld." />
          <FeatureItem icon={<FaMoneyBillWave className="text-primary" />} title="Monetization and Income Streams" description="Serialized AI models can create revenue streams." />
          <FeatureItem icon={<FaTrash className="text-primary" />} title="Termination" description="NFTs can be 'burned' or terminated, similar to IP revocation." />
        </ul>
      </section>

      <section className="mb-12 bg-base-200 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Creating a Transparent and Sustainable AI Growth Path</h2>
        <p className="mb-4">
          Decentralizing AI via NFTs encourages open collaboration and sustainable growth:
        </p>
        <ul className="space-y-2">
          <FeatureItem icon={<FaGlobeAmericas className="text-secondary" />} title="Open Collaboration" description="Promotes global collaboration and accelerates AI advancements." />
          <FeatureItem icon={<FaShieldAlt className="text-secondary" />} title="Preventing Centralization of Power" description="Avoids monopolization of AI capabilities." />
          <FeatureItem icon={<FaUsers className="text-secondary" />} title="Inclusive Innovation" description="Fosters diverse perspectives for ethical and inclusive AI solutions." />
        </ul>
      </section>

      <section className="bg-base-200 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Interactive Demo: Create an AI Model NFT</h2>
        <p className="mb-4">Click the button below to simulate the creation of an AI Model NFT:</p>
        <button className="btn btn-primary" onClick={createAIModelNFT}>Create AI Model NFT</button>
        
        {aiModel.id && (
          <div className="mt-6 bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">AI Model NFT Created</h3>
            <p><strong>ID:</strong> {aiModel.id}</p>
            <p><strong>Name:</strong> {aiModel.name}</p>
            <p><strong>Version:</strong> {aiModel.version}</p>
            <p><strong>Creator:</strong> {aiModel.creator}</p>
            <p><strong>Creation Date:</strong> {aiModel.creationDate}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DecentralizedAI;