'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNftGameAgentProgram } from '../game-agent/game-agent-data-access';
import { AppHero } from '../ui/ui-layout';
import { useQuery } from '@tanstack/react-query';
import { PublicKey } from '@solana/web3.js';
import { FaRobot, FaLayerGroup } from 'react-icons/fa';

type Collection = {
  publicKey: PublicKey;
  account: {
    collectionId: PublicKey;
    name: number[];
    symbol: number[];
    strategy: number[];
    authority: PublicKey;
  };
};

type Agent = {
  publicKey: PublicKey;
  account: {
    id: PublicKey;
    name: number[];
    symbol: number[];
    uri: string;
    modelHash: number[];
    collection: PublicKey;
    errorMessage: string | null;
    strategy: string;
    rarity: number;
    performance: number;
  };
};

export default function RetardistryFeature() {
  const { publicKey: walletPublicKey } = useWallet();
  const { program, programId } = useNftGameAgentProgram();

  const { data: collections, isLoading: isLoadingCollections, error: collectionsError } = useQuery<Collection[], Error>({
    queryKey: ['collections', programId?.toString()],
    queryFn: async (): Promise<Collection[]> => {
      if (!program) throw new Error('Program not initialized');
      const collections = await program.account.collection.all();
      return collections;
    },
    enabled: !!program && !!programId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });

  const { data: agents, isLoading: isLoadingAgents, error: agentsError } = useQuery<Agent[], Error>({
    queryKey: ['agents', collections],
    queryFn: async (): Promise<Agent[]> => {
      if (!program || !collections) return [];
      const collectionIds = collections.map(c => c.account.collectionId.toBase58());
      const allAgents = await Promise.all(
        collectionIds.map((collectionId: string) =>
          program.account.aiAgent.all([
            {
              memcmp: { 
                offset: 8, // Adjust this offset if needed
                bytes: collectionId,
              },
            },
          ])
        )
      );
      return allAgents.flat().map(({ publicKey, account }: { publicKey: PublicKey; account: any }) => ({
        publicKey,
        account: {
          ...account,
          strategy: new TextDecoder().decode(new Uint8Array(account.strategy)),
          rarity: account.rarity || 0,
          performance: account.performance || 0,
        },
      }));
    },
    enabled: !!program && !!collections,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });

  if (!walletPublicKey) return <div className="text-center py-8">Please connect your wallet</div>;
  if (isLoadingCollections || isLoadingAgents) return <div className="text-center py-8">Loading...</div>;
  if (collectionsError) return <div className="text-error text-center py-8">Error loading collections: {collectionsError.message}</div>;
  if (agentsError) return <div className="text-error text-center py-8">Error loading agents: {agentsError.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <AppHero title="AI Agent NFT Collections" subtitle="Explore your Reinforcement Learning agents" />
      <div className="grid grid-cols-1 gap-8">
        {collections?.map((collection) => (
          <div key={collection.publicKey.toString()} className="bg-base-200 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <FaLayerGroup className="mr-2" />
              {new TextDecoder().decode(new Uint8Array(collection.account.name))}
            </h2>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="bg-base-300">Name</th>
                    <th className="bg-base-300">Strategy</th>
                    <th className="bg-base-300">Rarity</th>
                    <th className="bg-base-300">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {agents?.filter(agent => agent.account.collection.equals(collection.account.collectionId)).map((agent) => (
                    <tr key={agent.publicKey.toString()}>
                      <td className="font-medium">
                        <div className="flex items-center">
                          <FaRobot className="mr-2" />
                          {new TextDecoder().decode(new Uint8Array(agent.account.name))}
                        </div>
                      </td>
                      <td>{agent.account.strategy}</td>
                      <td>{agent.account.rarity}</td>
                      <td>
                        <div className="flex items-center">
                          <div className="mr-2">{agent.account.performance}%</div>
                          <progress 
                            className="progress progress-primary w-20" 
                            value={agent.account.performance} 
                            max="100"
                          ></progress>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}