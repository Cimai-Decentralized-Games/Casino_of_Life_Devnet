import React from 'react';
import { PublicKey } from '@solana/web3.js';
import { FaRobot, FaLayerGroup, FaPlus, FaGitSquare } from 'react-icons/fa';

export type Collection = {
  publicKey: PublicKey;
  account: {
    name: string;
    symbol: string;
    strategy: string;
  };
};

interface Agent {
  publicKey: PublicKey;
  account: {
    name: string;
    symbol: string;
    uri: string;
    modelHash: number[];
    collection: PublicKey;
  };
}

interface GameAgentUIProps {
  collections: Collection[] | undefined;
  agents: Agent[] | undefined;
  isLoadingCollections: boolean;
  isLoadingAgents: boolean;
  isCreatingCollection: boolean;
  isMintingAgent: boolean;
  onCreateCollection: (input: { name: string; symbol: string; strategy: string }) => void;
  onMintAgent: (input: { name: string; symbol: string; uri: string; modelHash: number[] }) => void;
  onSelectCollection: (collectionId: PublicKey) => void;
  selectedCollection: PublicKey | null;
  collectionsError: Error | null;
  agentsError: Error | null;
  createCollectionError: Error | null;
  mintAgentError: Error | null;
  collectionFee: number;
  agentFee: number;
}

export function GameAgentUI({
  collections,
  agents,
  isLoadingCollections,
  isLoadingAgents,
  isCreatingCollection,
  isMintingAgent,
  onCreateCollection,
  onMintAgent,
  onSelectCollection,
  selectedCollection,
  collectionsError,
  agentsError,
  createCollectionError,
  mintAgentError,
  collectionFee,
  agentFee,
}: GameAgentUIProps) {
  const [newCollectionName, setNewCollectionName] = React.useState('');
  const [newCollectionSymbol, setNewCollectionSymbol] = React.useState('');
  const [newCollectionStrategy, setNewCollectionStrategy] = React.useState('');

  const [newAgentName, setNewAgentName] = React.useState('');
  const [newAgentSymbol, setNewAgentSymbol] = React.useState('');
  const [newAgentUri, setNewAgentUri] = React.useState('');

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateCollection({ name: newCollectionName, symbol: newCollectionSymbol, strategy: newCollectionStrategy });
    setNewCollectionName('');
    setNewCollectionSymbol('');
    setNewCollectionStrategy('');
  };

  const handleMintAgent = (e: React.FormEvent) => {
    e.preventDefault();
    onMintAgent({ name: newAgentName, symbol: newAgentSymbol, uri: newAgentUri, modelHash: [] });
    setNewAgentName('');
    setNewAgentSymbol('');
    setNewAgentUri('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Game Agent Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Collections Section */}
        <div className="bg-base-200 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <FaLayerGroup className="mr-2" /> Collections
          </h2>
          {isLoadingCollections ? (
            <p className="text-center">Loading collections...</p>
          ) : collectionsError ? (
            <p className="text-error">Error loading collections: {collectionsError.message}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Symbol</th>
                    <th>Strategy</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collections?.map((collection) => (
                    <tr key={collection.publicKey.toString()}>
                      <td>{collection.account.name}</td>
                      <td>{collection.account.symbol}</td>
                      <td>{collection.account.strategy}</td>
                      <td>
                        <button
                          onClick={() => onSelectCollection(collection.publicKey)}
                          className="btn btn-sm btn-primary"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Create Collection Form */}
          <form onSubmit={handleCreateCollection} className="mt-6">
            <h3 className="text-xl font-semibold mb-2 flex items-center">
              <FaPlus className="mr-2" /> Create New Collection
            </h3>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Collection Name</span>
              </label>
              <input
                type="text"
                placeholder="Collection Name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control mt-2">
              <label className="label">
                <span className="label-text">Collection Symbol</span>
              </label>
              <input
                type="text"
                placeholder="Collection Symbol"
                value={newCollectionSymbol}
                onChange={(e) => setNewCollectionSymbol(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control mt-2">
              <label className="label">
                <span className="label-text">RL Strategy</span>
              </label>
              <input
                type="text"
                placeholder="RL Strategy"
                value={newCollectionStrategy}
                onChange={(e) => setNewCollectionStrategy(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            <button
              type="submit"
              disabled={isCreatingCollection}
              className="btn btn-primary mt-4 w-full"
            >
              {isCreatingCollection ? 'Creating...' : 'Create Collection'}
            </button>
          </form>
          {createCollectionError && (
            <p className="text-error mt-2">Error creating collection: {createCollectionError.message}</p>
          )}
          <p className="mt-2">Fee for creating collection: {collectionFee} SOL</p>
        </div>

        {/* Agents Section */}
        <div className="bg-base-200 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <FaRobot className="mr-2" /> Agents
          </h2>
          {isLoadingAgents ? (
            <p className="text-center">Loading agents...</p>
          ) : agentsError ? (
            <p className="text-error">Error loading agents: {agentsError.message}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Symbol</th>
                    <th>URI</th>
                    <th>Win Rate</th>
                    <th>Learning Score</th>
                  </tr>
                </thead>
                <tbody>
                  {agents?.map((agent) => (
                    <tr key={agent.publicKey.toString()}>
                      <td>{agent.account.name}</td>
                      <td>{agent.account.symbol}</td>
                      <td>{agent.account.uri}</td>
                      <td>N/A</td>
                      <td>N/A</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mint Agent Form */}
          {selectedCollection && (
            <form onSubmit={handleMintAgent} className="mt-6">
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <FaGitSquare className="mr-2" /> Mint New Agent
              </h3>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Agent Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Agent Name"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
              <div className="form-control mt-2">
                <label className="label">
                  <span className="label-text">Agent Symbol</span>
                </label>
                <input
                  type="text"
                  placeholder="Agent Symbol"
                  value={newAgentSymbol}
                  onChange={(e) => setNewAgentSymbol(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
              <div className="form-control mt-2">
                <label className="label">
                  <span className="label-text">Agent URI</span>
                </label>
                <input
                  type="text"
                  placeholder="Agent URI"
                  value={newAgentUri}
                  onChange={(e) => setNewAgentUri(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
              <button
                type="submit"
                disabled={isMintingAgent}
                className="btn btn-primary mt-4 w-full"
              >
                {isMintingAgent ? 'Minting...' : 'Mint Agent'}
              </button>
            </form>
          )}
          {mintAgentError && (
            <p className="text-error mt-2">Error minting agent: {mintAgentError.message}</p>
          )}
          <p className="mt-2">Fee for minting AI Agent: {agentFee} SOL</p>
        </div>
      </div>
    </div>
  );
}