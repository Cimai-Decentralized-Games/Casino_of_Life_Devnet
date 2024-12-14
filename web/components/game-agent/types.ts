import { PublicKey } from '@solana/web3.js';

export interface AgentAccount {
  id: PublicKey;
  name: number[];
  symbol: number[];
  uri: string;
  modelHash: number[];
  collection: PublicKey;
  errorMessage: string | null;
}

export interface CollectionAccount {
  collectionId: PublicKey;
  name: number[];
  symbol: number[];
  strategy: number[];
  authority: PublicKey;
}
