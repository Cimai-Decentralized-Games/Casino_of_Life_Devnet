'use client';

import React, { useState, useCallback } from 'react';
import { useNftGameAgentProgram } from './game-agent-data-access';
import { GameAgentUI, Collection } from './game-agent-ui';
import { PublicKey } from '@solana/web3.js';
import { COLLECTION_FEE, AGENT_FEE, LAMPORTS_PER_SOL } from '../../app/utils/constants';

type Agent = {
  publicKey: PublicKey;
  account: {
    name: string;
    symbol: string;
    uri: string;
    modelHash: number[];
    collection: PublicKey;
    errorMessage: string | null;
  };
};

export function GameAgentFeature() {
  const [selectedCollection, setSelectedCollection] = useState<PublicKey | null>(null);

  const {
    collections,
    createCollection,
    agents,
    mintAgent,
    program,
  } = useNftGameAgentProgram();

  const mappedCollections = collections.data?.map(c => ({
    publicKey: c.publicKey,
    account: {
      name: String.fromCharCode(...c.account.name),
      symbol: String.fromCharCode(...c.account.symbol),
      strategy: String.fromCharCode(...c.account.strategy),
      authority: c.account.authority
    }
  })) as Collection[] | undefined;

  const mappedAgents = agents.data?.map(a => ({
    publicKey: a.publicKey,
    account: {
      name: String.fromCharCode(...a.account.name),
      symbol: String.fromCharCode(...a.account.symbol),
      uri: a.account.uri,
      modelHash: a.account.modelHash,
      collection: a.account.collection,
      errorMessage: a.account.errorMessage
    }
  })) as Agent[] | undefined;

  const handleCreateCollection = useCallback((input: { name: string; symbol: string; strategy: string }) => {
    createCollection.mutate(input, {
      onSuccess: () => console.log('Collection created successfully'),
      onError: (error) => console.error('Error creating collection:', error)
    });
  }, [createCollection]);

  const handleMintAgent = useCallback(async (input: { name: string; symbol: string; uri: string; modelHash: number[] }) => {
    if (selectedCollection && program) {
      try {
        await mintAgent.mutateAsync({ ...input, collectionId: selectedCollection });
        console.log('Agent minted successfully');
      } catch (error) {
        console.error('Error minting agent:', error);
      }
    } else {
      console.error('No collection selected or program not available');
    }
  }, [selectedCollection, program, mintAgent]);

  return (
    <GameAgentUI
      collections={mappedCollections}
      agents={mappedAgents}
      isLoadingCollections={collections.isLoading}
      isLoadingAgents={agents.isLoading}
      isCreatingCollection={createCollection.isPending}
      isMintingAgent={mintAgent.isPending}
      onCreateCollection={handleCreateCollection}
      onMintAgent={handleMintAgent}
      onSelectCollection={setSelectedCollection}
      selectedCollection={selectedCollection}
      collectionsError={collections.error}
      agentsError={agents.error}
      createCollectionError={createCollection.error}
      mintAgentError={mintAgent.error}
      collectionFee={COLLECTION_FEE / LAMPORTS_PER_SOL}
      agentFee={AGENT_FEE / LAMPORTS_PER_SOL}
    />
  );
}