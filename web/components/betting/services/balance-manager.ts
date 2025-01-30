import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import {  getBettingProgram } from '@casino-of-life-dashboard/anchor';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';

// Constants
// const USER_BETTING_ACCOUNT_SEED = "user-bet-account"; // Use the same seed as in the program
const DUMBS_MINT_KEY = new PublicKey("7rgsHwax9ZP7nSeY2PdyyEdW4oDeoPug3XPXidRCDC1K");
const RAPR_MINT_KEY = new PublicKey("RAPRz9fd87y9qcBGj1VVqUbbUM6DaBggSDA58zc3N2b");


export function useBalanceManager() {
  const { connection } = useAppKitConnection();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('solana');

  const anchorWallet = useMemo(() => {
    if (!walletProvider) return null;
    const solanaWallet = walletProvider as WalletContextState;
    
    if (!solanaWallet.publicKey) return null;
    
    return {
      publicKey: solanaWallet.publicKey,
      signTransaction: solanaWallet.signTransaction,
      signAllTransactions: solanaWallet.signAllTransactions,
    } as Wallet;
  }, [walletProvider]);

  const balanceManager = useMemo(() => {
    if (!connection || !isConnected || !anchorWallet) {
      return null;
    }

    return {
      async getBalance(publicKey: PublicKey): Promise<number> {
        const balance = await connection.getBalance(publicKey);
        return balance / 1e9;
      },

      async getFreeDumbsBalance(publicKey: PublicKey): Promise<number> {

        const userFreeDumbsAccount = await getAssociatedTokenAddress(
          DUMBS_MINT_KEY,
          publicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        );
      
        try {
          // Check if the ATA exists
          const accountInfo = await connection.getAccountInfo(userFreeDumbsAccount, {
            commitment: 'confirmed',
          });
      
          if (!accountInfo) {
            console.log('DUMBS ATA does not exist yet.');
            return 0;
          }
      
          // Fetch the token account balance
          const tokenAccountInfo = await connection.getTokenAccountBalance(userFreeDumbsAccount);
          console.log('Raw DUMBS account info:', tokenAccountInfo);      
      
          // Convert the balance from lamports to DUMBs
          if (tokenAccountInfo.value) {
            const amountInLamports = tokenAccountInfo.value.amount;
            const amountInDumbs = Number(amountInLamports) / 1_000_000_000; // 1 DUMB = 1,000,000,000 lamports
            return amountInDumbs;
          }
      
          return 0;
        } catch (error) {
          console.error('Error fetching free DUMBS balance:', error);
          return 0;
        }
      },

      async getRaprBalance(publicKey: PublicKey): Promise<number> {

        const userRaprAccount = await getAssociatedTokenAddress(
          RAPR_MINT_KEY,
          publicKey,
          false,
          TOKEN_2022_PROGRAM_ID
        );
        
        try {
          const tokenAccountInfo = await connection.getTokenAccountBalance(userRaprAccount);
          console.log('Raw RAPR account info:', tokenAccountInfo);
          return tokenAccountInfo.value.uiAmount || 0;
        } catch (error) {
          console.error('Error fetching free RAPR balance:', error);
          return 0;
        }
      },


      async getTotalBalances(
            publicKey: PublicKey, 
            activeFightId?: string,
            secureFightId?: string
        ) {
        try {
          const [freeDumbs, freeRapr] = await Promise.all([
            this.getFreeDumbsBalance(publicKey),
            this.getRaprBalance(publicKey),
          ]);
        
            return {
                freeDumbs: Math.floor(freeDumbs),
                Rapr: Math.floor(freeRapr),
                totalDumbs: Math.floor(freeDumbs),
                totalRapr: Math.floor(freeRapr),
            };
      
        } catch (error) {
          console.error('Error getting total balances:', error);
           return {
                freeDumbs: 0,
                Rapr: 0,
                totalDumbs: 0,
                totalRapr: 0,
            };
        }
      },

      async updateBalancesForFight(
        publicKey: PublicKey, 
        fightId: string,
        secureFightId?: string
      ) {
        console.log('Updating balances for fight:', fightId, 'secure ID:', secureFightId);
        return this.getTotalBalances(publicKey, fightId, secureFightId);
      }
    };
  }, [connection, isConnected, anchorWallet]);

  return balanceManager;
}