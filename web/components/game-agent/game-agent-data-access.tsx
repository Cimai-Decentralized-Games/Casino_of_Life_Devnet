'use client';

import { getNftGameAgentProgram } from '@casino-of-life-dashboard/anchor';
import { PublicKey, Keypair, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCluster } from '../cluster/cluster-data-access';
import { useAnchorProvider } from '../solana/solana-provider';
import { useTransactionToast } from '../ui/ui-layout';


const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');


const PROGRAM_ID = new PublicKey('ErQd82jnp2fgvj6h357Nj6gwpcyiNjFENP6cwQ9quaAW');

export function useNftGameAgentProgram() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const program = getNftGameAgentProgram(provider);
  const queryClient = useQueryClient();

  const getProgramAccount = useQuery({
    queryKey: ['get-nft-game-agent-program-account', { cluster }],
    queryFn: async () => {
      const accountInfo = await connection.getParsedAccountInfo(PROGRAM_ID);
      if (!accountInfo.value) {
        throw new Error('Program account not found');
      }
      return accountInfo;
    },
  });

  const collections = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      if (!program) throw new Error('Program not initialized');
      return program.account.collection.all();
    },
  });

  const createCollection = useMutation({
    mutationFn: async ({ name, symbol, strategy }: { name: string; symbol: string; strategy: string }) => {
      if (!publicKey) throw new Error('Wallet not connected');
      if (!program) throw new Error('Program not initialized');
      if (!program.programId) throw new Error('Program ID is undefined');
      
      const collectionId = Keypair.generate().publicKey;
      if (!collectionId) throw new Error('Failed to generate collection ID');
      
      const [collectionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('collection'), collectionId.toBuffer()],
        program.programId
      );
      const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('treasury')],
        program.programId
      );

      // Check if the treasury account already exists
      const treasuryAccount = await connection.getAccountInfo(treasuryPda);
      
      let tx = new Transaction();

      if (!treasuryAccount) {
        const initTreasuryIx = await program.methods.initializeTreasury()
          .accounts({
            treasury: treasuryPda,
            authority: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction();
        tx.add(initTreasuryIx);
      }

      const createCollectionIx = await program.methods.createCollection(name, symbol, strategy, collectionId)
        .accounts({
          collection: collectionPda,
          authority: publicKey,
          treasury: treasuryPda,
          systemProgram: SystemProgram.programId,
        } as any)
        .instruction();
      
      tx.add(createCollectionIx);

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);
      return signature;
    },
    onSuccess: (signature) => {
      console.log("Collection created successfully!");
      transactionToast(signature);
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
    onError: (error) => {
      console.error("Failed to create collection:", error);
      toast.error(`Failed to create collection: ${error.message}`);
    },
  });

  const agents = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      if (!program) throw new Error('Program not initialized');
      return program.account.aiAgent.all();
    },
    enabled: !!program,
  });

  const mintAgent = useMutation({
    mutationFn: async ({ 
      collectionId, 
      name, 
      symbol, 
      uri, 
      modelHash 
    }: { 
      collectionId: PublicKey; 
      name: string; 
      symbol: string; 
      uri: string; 
      modelHash: number[] 
    }) => {
      if (!program || !program.provider.publicKey) throw new Error('Program or provider not initialized');
      if (!program.programId) throw new Error('Program ID is undefined');
      
      // Fetch the collection account to ensure it exists
      const collectionAccount = await program.account.collection.fetch(collectionId);
      if (!collectionAccount) throw new Error('Collection not found');

      if (!(collectionId instanceof PublicKey)) throw new Error('collectionId must be a PublicKey');

      const [collectionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('collection'), collectionId.toBuffer()],
        program.programId
      );

      const id = Keypair.generate().publicKey;
      const [aiAgentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('ai_agent'), id.toBuffer()],
        program.programId
      );

      const mint = Keypair.generate();
      const [tokenAccountPda] = PublicKey.findProgramAddressSync(
        [program.provider.publicKey.toBuffer(), Buffer.from([6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169]), mint.publicKey.toBuffer()],
        new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
      );

      const [metadataPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('metadata'), new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(), mint.publicKey.toBuffer()],
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
      );

      const [masterEditionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('metadata'), new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(), mint.publicKey.toBuffer(), Buffer.from('edition')],
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
      );

      const ix = await program.methods.mintAiAgent(id, name, symbol, uri, modelHash, collectionId, 0) // 0 is a placeholder for collectionBump
        .accounts({
          authority: program.provider.publicKey,
          payer: program.provider.publicKey,
          aiAgent: aiAgentPda,
          mint: mint.publicKey,
          tokenAccount: tokenAccountPda,
          associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
          rent: SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          metadataProgram: new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'),
          collection: collectionPda,
          metadata: metadataPda,
          masterEdition: masterEditionPda,
        } as any)
        .instruction();

      const tx = new Transaction().add(ix);
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);
      return signature;
    },
    onSuccess: (signature, { collectionId }) => {
      console.log("Agent minted successfully!");
      transactionToast(signature);
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (error) => {
      console.error("Failed to mint agent:", error);
      toast.error(`Failed to mint agent: ${error.message}`);
    },
  });

  return {
    program,
    programId: PROGRAM_ID,
    getProgramAccount,
    collections,
    createCollection,
    agents,
    mintAgent,
  };
}