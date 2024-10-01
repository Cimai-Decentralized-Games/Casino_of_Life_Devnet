'use client';

import { getRewardAgentProgram } from '@casino-of-life-dashboard/anchor';
import { PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCluster } from '../cluster/cluster-data-access';
import { useAnchorProvider } from '../solana/solana-provider';
import { useTransactionToast } from '../ui/ui-layout';

const PROGRAM_ID = new PublicKey('GWnZ4YydvHmnazbi9Em3qyB6gPN8EBEDmG7fanpe5qSp');

export function useRewardAgentProgram() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const program = getRewardAgentProgram(provider);

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: async () => {
      const accountInfo = await connection.getParsedAccountInfo(PROGRAM_ID);
      if (!accountInfo.value) {
        throw new Error('Program account not found');
      }
      return accountInfo;
    },
  });

  const greet = useMutation({
    mutationKey: ['greet'],
    mutationFn: async () => {
      if (!publicKey) throw new Error('Wallet not connected');
      const ix = await program.methods.greet().accounts({}).instruction();
      const tx = new Transaction().add(ix);
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature);
      return signature;
    },
    onSuccess: (signature) => {
      console.log("Greeting succeeded!");
      transactionToast(signature);
    },
    onError: (error) => {
      console.error("Greeting failed:", error);
      toast.error(`Failed to run program: ${error.message}`);
    },
  });

  return {
    program,
    programId: PROGRAM_ID,
    getProgramAccount,
    greet,
  };
}