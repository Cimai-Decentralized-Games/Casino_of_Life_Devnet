'use client';

import React from 'react';
import { useGameAgentState } from './game-agent-state';
import { useNftGameAgentProgram } from './game-agent-data-access';
import { GameAgentUI } from './game-agent-ui';
import { toast } from 'react-hot-toast';
import { COLLECTION_FEE, AGENT_FEE, LAMPORTS_PER_SOL } from '../../app/utils/constants';
import { PublicKey } from '@solana/web3.js';
import type { MintingStep } from './game-agent-state';
import type { ModelData } from '../../utils/modelValidation';

interface GameAgentFeatureProps {
  initialModelData?: ModelData;
}

export function GameAgentFeature({ initialModelData }: GameAgentFeatureProps) {
  const {
    currentStep,
    isStepComplete,
    modelData,
    uploadedModel,
    uploadedImage,
    isModelValidated,
    validatedModelId,
    generatedUri,
    generatedModelHash,
    selectedCollection,
    setCurrentStep,
    setIsStepComplete,
    setUploadedImage,
    setSelectedCollection,
    handleModelDataChange,
    handleModelDataSubmit,
    handleUploadModel,
    handleValidateModel,
    handleGenerateUri
  } = useGameAgentState();

  const {
    collections,
    createCollection,
    agents,
    mintAgent,
  } = useNftGameAgentProgram();

  const handleCreateCollection = async (input: { name: string; symbol: string; strategy: string }) => {
    try {
      await createCollection.mutateAsync(input);
      toast.success('Collection created successfully');
    } catch (error) {
      toast.error(`Failed to create collection: ${(error as Error).message}`);
    }
  };

  const handleCollectionSelect = (collectionId: string) => {
    try {
      const collection = collections.data?.find(
        c => c.publicKey.toString() === collectionId
      );
      
      if (!collection) {
        toast.error('Selected collection not found');
        return;
      }

      setSelectedCollection(collection.account.collectionId);
      setIsStepComplete((prev: Record<MintingStep, boolean>) => ({ ...prev, collection: true }));
      setCurrentStep('mint' as MintingStep);
    } catch (error) {
      toast.error('Invalid collection selection');
    }
  };

  const handleMetadataSubmit = async (updatedModelData: ModelData) => {
    try {
      const result = await handleGenerateUri();
      if (result) {
        setIsStepComplete((prev: Record<MintingStep, boolean>) => ({ ...prev, metadata: true }));
        setCurrentStep('collection' as MintingStep);
      }
    } catch (error) {
      toast.error(`Failed to generate metadata: ${(error as Error).message}`);
    }
  };

  const handleMintAgent = async (agentName: string, agentSymbol: string) => {
    if (!selectedCollection || !generatedUri || !generatedModelHash) {
      toast.error('Missing required data for minting');
      return;
    }

    try {
      await mintAgent.mutateAsync({
        name: agentName,
        symbol: agentSymbol,
        uri: generatedUri,
        modelHash: generatedModelHash,
        collectionId: selectedCollection
      });
      toast.success('Agent minted successfully');
      setIsStepComplete((prev: Record<MintingStep, boolean>) => ({ ...prev, mint: true }));
    } catch (error) {
      toast.error(`Failed to mint agent: ${(error as Error).message}`);
    }
  };

  return (
    <GameAgentUI
      currentStep={currentStep}
      isStepComplete={isStepComplete}
      collections={collections.data || []}
      agents={agents.data || []}
      isLoadingCollections={collections.isLoading}
      isLoadingAgents={agents.isLoading}
      isCreatingCollection={createCollection.isPending}
      isMintingAgent={mintAgent.isPending}
      onCreateCollection={handleCreateCollection}
      onMintAgent={handleMintAgent}
      onSelectCollection={handleCollectionSelect}
      selectedCollection={selectedCollection}
      collectionsError={collections.error as Error}
      agentsError={agents.error as Error}
      createCollectionError={createCollection.error as Error}
      mintAgentError={mintAgent.error as Error}
      collectionFee={COLLECTION_FEE / LAMPORTS_PER_SOL}
      agentFee={AGENT_FEE / LAMPORTS_PER_SOL}
      modelData={modelData}
      uploadedModel={uploadedModel}
      uploadedImage={uploadedImage}
      onModelDataChange={handleModelDataChange}
      onModelDataSubmit={handleModelDataSubmit}
      onImageUpload={setUploadedImage}
      onUploadModel={handleUploadModel}
      onValidateModel={handleValidateModel}
      onMetadataSubmit={handleMetadataSubmit}
      onGenerateUri={handleGenerateUri}
      generatedUri={generatedUri}
      generatedModelHash={generatedModelHash}
      isModelValidated={isModelValidated}
    />
  );
}
