'use client';

import React, { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { FaRobot, FaLayerGroup, FaUpload, FaCheckCircle, FaEdit, FaList, FaCoins } from 'react-icons/fa';
import { ModelDataForm } from './model-data-form';
import { type ModelData } from '../../utils/modelValidation';
import type { MintingStep } from './game-agent-state';
import { ProgramAccount } from '@coral-xyz/anchor';
import type { AgentAccount, CollectionAccount } from './types';

interface GameAgentUIProps {
  currentStep: MintingStep;
  isStepComplete: Record<MintingStep, boolean>;
  collections: ProgramAccount<CollectionAccount>[];
  agents: ProgramAccount<AgentAccount>[];
  isLoadingCollections: boolean;
  isLoadingAgents: boolean;
  isCreatingCollection: boolean;
  isMintingAgent: boolean;
  onCreateCollection: (input: { name: string; symbol: string; strategy: string }) => Promise<void>;
  onMintAgent: (agentName: string, agentSymbol: string) => Promise<void>;
  onSelectCollection: (collectionId: string) => void;
  selectedCollection: PublicKey | null;
  collectionsError: Error | null;
  agentsError: Error | null;
  createCollectionError: Error | null;
  mintAgentError: Error | null;
  collectionFee: number;
  agentFee: number;
  modelData: ModelData;
  uploadedModel: File | null;
  uploadedImage: File | null;
  onModelDataChange: (name: string, value: string | number) => void;
  onModelDataSubmit: (modelData: ModelData) => Promise<void>;
  onImageUpload: (file: File) => void;
  onUploadModel: (file: File) => Promise<void>;
  onValidateModel: () => Promise<boolean>;
  onMetadataSubmit: (modelData: ModelData) => Promise<void>;
  onGenerateUri: () => Promise<{ uri: string; modelHash: number[]; key: string; }>;
  generatedUri: string | null;
  generatedModelHash: number[] | null;
  isModelValidated: boolean;
}

// Helper function to convert number arrays to strings
function numberArrayToString(arr: number[]): string {
  return String.fromCharCode(...arr).trim();
}

// Helper function to render collections table
function renderCollectionsTable(
  collections: ProgramAccount<CollectionAccount>[],
  onSelectCollection: (collectionId: string) => void
) {
  if (!collections?.length) {
    return <p>No collections found</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Symbol</th>
            <th>Strategy</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((collection) => (
            <tr key={collection.publicKey.toString()}>
              <td>{numberArrayToString(collection.account.name)}</td>
              <td>{numberArrayToString(collection.account.symbol)}</td>
              <td>{numberArrayToString(collection.account.strategy)}</td>
              <td>
                <button
                  onClick={() => onSelectCollection(collection.publicKey.toString())}
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
  );
}

export function GameAgentUI({
  currentStep,
  isStepComplete,
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
  modelData,
  uploadedModel,
  uploadedImage,
  onModelDataChange,
  onModelDataSubmit,
  onImageUpload,
  onUploadModel,
  onValidateModel,
  onMetadataSubmit,
  onGenerateUri,
  generatedUri,
  generatedModelHash,
  isModelValidated
}: GameAgentUIProps) {
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionSymbol, setNewCollectionSymbol] = useState('');
  const [newCollectionStrategy, setNewCollectionStrategy] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentSymbol, setAgentSymbol] = useState('');

  const renderStep = (step: MintingStep) => {
    switch (step) {
      case 'upload':
        return (
          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <FaUpload className="mr-2" /> Upload AI Model
            </h3>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Select Model File (.pt)</span>
              </label>
              <input 
                type="file" 
                accept=".pt"
                onChange={(e) => e.target.files?.[0] && onUploadModel(e.target.files[0])}
                className="file-input file-input-bordered w-full" 
              />
            </div>
            {uploadedModel && (
              <div className="alert alert-success mt-4">
                <FaCheckCircle className="mr-2" />
                <span>Model uploaded: {uploadedModel.name}</span>
              </div>
            )}
          </div>
        );

      case 'form':
        return (
          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <FaEdit className="mr-2" /> Model Details
            </h3>
            <ModelDataForm
              initialData={modelData}
              onSubmit={onModelDataSubmit}
              onImageUpload={onImageUpload}
              uploadedImage={uploadedImage}
            />
          </div>
        );

      case 'validate':
        return (
          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <FaCheckCircle className="mr-2" /> Validate Model
            </h3>
            <button 
              onClick={() => onValidateModel()}
              disabled={!uploadedModel || isStepComplete.validate}
              className="btn btn-primary w-full"
            >
              {isStepComplete.validate ? 'Model Validated' : 'Validate Model'}
            </button>
          </div>
        );

      case 'metadata':
        return (
          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <FaEdit className="mr-2" /> Generate Metadata
            </h3>
            <button 
              onClick={() => onMetadataSubmit(modelData)}
              disabled={!isModelValidated}
              className="btn btn-primary w-full"
            >
              Generate Metadata
            </button>
          </div>
        );

      case 'collection':
        return (
          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <FaList className="mr-2" /> Select Collection
            </h3>
            {isLoadingCollections ? (
              <p>Loading collections...</p>
            ) : (
              <>
                {renderCollectionsTable(collections, onSelectCollection)}
                {renderCreateCollection()}
              </>
            )}
          </div>
        );

      case 'mint':
        return (
          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center">
              <FaCoins className="mr-2" /> Mint Agent
            </h3>
            {selectedCollection && (
              <div className="alert alert-info mb-4">
                Selected Collection: {selectedCollection.toString()}
              </div>
            )}
            <form onSubmit={(e) => {
              e.preventDefault();
              onMintAgent(agentName, agentSymbol);
            }}>
              <div className="form-control">
                <label className="label">Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="input input-bordered"
                  required
                />
              </div>
              <div className="form-control mt-4">
                <label className="label">Agent Symbol</label>
                <input
                  type="text"
                  value={agentSymbol}
                  onChange={(e) => setAgentSymbol(e.target.value)}
                  className="input input-bordered"
                  required
                />
              </div>
              {generatedUri && (
                <div className="alert alert-success mt-4">
                  Generated URI: {generatedUri}
                </div>
              )}
              {generatedModelHash && (
                <div className="alert alert-success mt-2">
                  Model Hash: {generatedModelHash.join(', ')}
                </div>
              )}
              <button
                type="submit"
                disabled={isMintingAgent || !selectedCollection}
                className="btn btn-primary mt-6 w-full"
              >
                {isMintingAgent ? 'Minting...' : 'Mint Agent'}
              </button>
            </form>
          </div>
        );
    }
  };

  // Add Collection Creation UI
  const renderCreateCollection = () => (
    <div className="bg-base-200 p-6 rounded-lg shadow-lg mt-4">
      <h3 className="text-xl font-semibold mb-4">Create New Collection</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        onCreateCollection({
          name: newCollectionName,
          symbol: newCollectionSymbol,
          strategy: newCollectionStrategy
        });
      }}>
        <div className="form-control">
          <label className="label">Collection Name</label>
          <input
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>
        <div className="form-control mt-2">
          <label className="label">Collection Symbol</label>
          <input
            type="text"
            value={newCollectionSymbol}
            onChange={(e) => setNewCollectionSymbol(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>
        <div className="form-control mt-2">
          <label className="label">Strategy</label>
          <input
            type="text"
            value={newCollectionStrategy}
            onChange={(e) => setNewCollectionStrategy(e.target.value)}
            className="input input-bordered"
            required
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary mt-4"
          disabled={isCreatingCollection}
        >
          {isCreatingCollection ? 'Creating...' : 'Create Collection'}
        </button>
      </form>
    </div>
  );

  // Add Agents List UI
  const renderAgentsList = () => {
    if (isLoadingAgents) {
      return <p>Loading agents...</p>;
    }

    if (!agents?.length) {
      return <p>No agents found</p>;
    }

    return (
      <div className="mt-8">
        <h3 className="text-2xl font-semibold mb-4 flex items-center">
          <FaRobot className="mr-2" /> Your Agents
        </h3>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Symbol</th>
                <th>Collection</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.publicKey.toString()}>
                  <td>{numberArrayToString(agent.account.name)}</td>
                  <td>{numberArrayToString(agent.account.symbol)}</td>
                  <td>{agent.account.collection.toString()}</td>
                  <td>
                    <span className="badge badge-success">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Game Agent Dashboard</h1>
      
      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <ul className="steps steps-horizontal">
          {['upload', 'form', 'validate', 'metadata', 'collection', 'mint'].map((step) => (
            <li 
              key={step}
              className={`step ${currentStep === step ? 'step-primary' : ''} 
                         ${isStepComplete[step as MintingStep] ? 'step-success' : ''}`}
            >
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </li>
          ))}
        </ul>
      </div>

      {/* Error Display */}
      {(collectionsError || agentsError || createCollectionError || mintAgentError) && (
        <div className="alert alert-error mb-8">
          <span>{(collectionsError || agentsError || createCollectionError || mintAgentError)?.message}</span>
        </div>
      )}

      {/* Current Step Content */}
      {renderStep(currentStep)}

      {/* Agents List */}
      {renderAgentsList()}
    </div>
  );
}
