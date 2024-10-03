'use client';

import React, { useState, useEffect } from 'react';
import { useAnchorWallet, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { FaFingerprint, FaLink, FaDatabase, FaRobot, FaMoneyBillWave, FaGlobeAmericas, FaShieldAlt, FaUsers } from 'react-icons/fa';
import { sha256 } from 'js-sha256';

import { getNftGameAgentProgram } from '@casino-of-life-dashboard/anchor';
import { connectToGunPeers, storeModelDataInGun } from 'web/app/api/proof-of-gun/db/gunUtils.mjs';

interface AIModel {
  id: string;
  name: string;
  version: string;
  creator: string;
  creationDate: string;
  modelHash: number[];
  gunReference: string;
  symbol: string;
  description: string;
  attributes: { trait_type: string; value: string }[];
  reinforcementLearning: {
    strategy: string;
    totalEpisodes: number;
    rewardThreshold: number;
    modelHash: string;
  };
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
  const [aiModel, setAiModel] = useState<AIModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const anchorWallet = useAnchorWallet();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [gun, setGun] = useState<any>(null);

  useEffect(() => {
    const gunInstance = connectToGunPeers();
    setGun(gunInstance);
  }, []);

  const createAIModelNFT = async () => {
    if (!wallet.publicKey || !wallet.signTransaction || !gun) {
      setError("Wallet not connected, doesn't support signing, or Gun not initialized");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const modelHash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));
      const newModel: AIModel = {
        id: new PublicKey(Math.random() * 1000000).toString(),
        name: `AI Model ${Math.floor(Math.random() * 100)}`,
        version: `1.0.${Math.floor(Math.random() * 10)}`,
        creator: wallet.publicKey.toString(),
        creationDate: new Date().toISOString(),
        modelHash: modelHash,
        gunReference: '',
        symbol: "AI",
        description: `AI Model created by ${wallet.publicKey.toString()}`,
        attributes: [
          { trait_type: "Version", value: `1.0.${Math.floor(Math.random() * 10)}` },
          { trait_type: "Creator", value: wallet.publicKey.toString() },
          { trait_type: "Creation Date", value: new Date().toISOString() },
        ],
        reinforcementLearning: {
          strategy: "Q-learning",
          totalEpisodes: 5000,
          rewardThreshold: 100,
          modelHash: sha256(modelHash.join(''))
        }
      };

      // Store data in Gun
      const gunRef = await storeModelDataInGun({
        ...newModel,
        attributes: JSON.stringify(newModel.attributes),
        modelHash: newModel.modelHash.join(','),
      });
      newModel.gunReference = gunRef;

      // Get the transaction from the server
      const response = await fetch('/api/agent-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createCollection',
          wallet: wallet.publicKey.toString(),
          name: 'AI Collection',
          symbol: 'AIC',
          strategy: 'Reinforcement Learning'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
      }

      const { transaction: serializedTransaction, collectionId } = await response.json();

      // Deserialize and sign the transaction
      const transaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'));
      const signedTransaction = await wallet.signTransaction(transaction);

      // Send the signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('Collection created with signature:', signature);

      // Mint AI agent
      const mintResponse = await fetch('/api/agent-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mintAIAgent',
          wallet: wallet.publicKey.toString(),
          collectionId: collectionId,
          name: newModel.name,
          symbol: 'AI',
          uri: `gun://${gunRef}`,
          modelHash: newModel.modelHash
        })
      });

      if (!mintResponse.ok) {
        const errorData = await mintResponse.json();
        throw new Error(`HTTP error! status: ${mintResponse.status}, message: ${errorData.error || 'Unknown error'}`);
      }

      const { transaction: serializedMintTransaction, agentId } = await mintResponse.json();

      // Deserialize and sign the mint transaction
      const mintTransaction = Transaction.from(Buffer.from(serializedMintTransaction, 'base64'));
      const signedMintTransaction = await wallet.signTransaction(mintTransaction);

      // Send the signed mint transaction
      const mintSignature = await connection.sendRawTransaction(signedMintTransaction.serialize());
      await connection.confirmTransaction(mintSignature, 'confirmed');

      console.log('AI Agent minted with signature:', mintSignature);

      newModel.id = agentId;
      setAiModel(newModel);
    } catch (err) {
      console.error('Error in createAIModelNFT:', err);
      setError(`Failed to create AI Model NFT: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Decentralized AI and NFTs</h1>
      
      <section className="mb-12 bg-base-200 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Key Concepts</h2>
        <ul className="space-y-2">
          <FeatureItem icon={<FaFingerprint className="text-primary" />} title="Unique Identification" description="Each AI model is uniquely identifiable as an NFT on the Solana blockchain." />
          <FeatureItem icon={<FaLink className="text-primary" />} title="Blockchain Verification" description="The Solana blockchain provides a permanent, verifiable record of each AI model." />
          <FeatureItem icon={<FaDatabase className="text-primary" />} title="Decentralized Storage" description="Gun.js is used for decentralized, off-chain storage of AI model data." />
          <FeatureItem icon={<FaRobot className="text-primary" />} title="AI Agent Collections" description="AI models are organized into collections, allowing for structured management." />
          <FeatureItem icon={<FaMoneyBillWave className="text-primary" />} title="Tokenization" description="AI models become tradable assets through NFT representation." />
        </ul>
      </section>

      <section className="mb-12 bg-base-200 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Benefits of Decentralized AI</h2>
        <ul className="space-y-2">
          <FeatureItem icon={<FaGlobeAmericas className="text-secondary" />} title="Global Collaboration" description="Enables worldwide cooperation on AI development." />
          <FeatureItem icon={<FaShieldAlt className="text-secondary" />} title="Decentralized Control" description="Prevents monopolization of AI capabilities by distributing ownership." />
          <FeatureItem icon={<FaUsers className="text-secondary" />} title="Community-Driven Innovation" description="Fosters diverse perspectives for ethical and inclusive AI solutions." />
        </ul>
      </section>

      <section className="bg-base-200 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Interactive Demo: Create an AI Model NFT</h2>
        <p className="mb-4">Experience the process of creating an AI Model NFT using Solana and Gun.js:</p>
        {!connected ? (
          <div className="mb-4">
            <p className="mb-2">Connect your wallet to create an AI Model NFT:</p>
            <WalletMultiButton />
          </div>
        ) : (
          <button 
            className={`btn btn-primary ${isLoading ? 'loading' : ''}`} 
            onClick={createAIModelNFT}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create AI Model NFT'}
          </button>
        )}
        
        {error && (
          <div className="mt-4 text-error">{error}</div>
        )}
        
        {aiModel && (
          <div className="mt-6 bg-base-100 p-4 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">AI Model NFT Created</h3>
            <p><strong>ID:</strong> {aiModel.id}</p>
            <p><strong>Name:</strong> {aiModel.name}</p>
            <p><strong>Version:</strong> {aiModel.version}</p>
            <p><strong>Creator:</strong> {aiModel.creator}</p>
            <p><strong>Creation Date:</strong> {aiModel.creationDate}</p>
            <p><strong>Model Hash:</strong> {aiModel.modelHash.join('')}</p>
            <p><strong>Gun Reference:</strong> {aiModel.gunReference}</p>
          </div>
        )}
      </section>

      <section className="mt-12 bg-base-200 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>An AI model is created and its metadata is generated.</li>
          <li>The model data is stored in a decentralized database using Gun.js.</li>
          <li>A collection for AI models is created on the Solana blockchain.</li>
          <li>An NFT representing the AI model is minted and added to the collection.</li>
          <li>The NFT links to the off-chain data stored in Gun.js, creating a hybrid on-chain/off-chain solution.</li>
        </ol>
      </section>
    </div>
  );
};

export default DecentralizedAI;