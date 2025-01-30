import { useCallback, useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { 
  useAppKitAccount, 
  useAppKitNetwork,
  useAppKitProvider
} from '@reown/appkit/react';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import type { Provider } from '@reown/appkit-adapter-solana/react';
import { swapSolForRapr } from '../contracts/swap';
import { depositSol } from '../contracts/deposit';
import { placeBet } from '../contracts/placeBet';
import { cashOut } from '../contracts/cashOut';
import { mintDumbsForWin } from '../contracts/mintDumbs';
import { BETTING_PROGRAM_ID, getBettingProgram } from '@casino-of-life-dashboard/anchor';
import { useBalanceManager } from './balance-manager';
import { OddsCalculator } from './odds-calculator';

// Constants
const USER_BETTING_ACCOUNT_SEED = "user-bet-account"; // Use the same seed as in the program

// Create the instance at the component level, outside of any hooks
const oddsCalculator = new OddsCalculator(2.0);

// Add TokenType type
export enum TokenType {
    DUMBS = 0,
    RAPR = 1
}

export function useSolana() {
  const { address, isConnected } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  const { chainId } = useAppKitNetwork();
  const balanceManager = useBalanceManager();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balances, setBalances] = useState({
    freeDumbs: 0,
    Rapr: 0,
    totalDumbs: 0,
    totalRapr: 0,
  });
  const [depositAmount, setDepositAmount] = useState('');
  const [swapAmount, setSwapAmount] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [odds, setOdds] = useState<number>(2.0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFightId, setActiveFightId] = useState<string | null>(null);
  const [activeFightSecureId, setActiveFightSecureId] = useState<string | null>(null);

  // Update balances when connection or address changes
  useEffect(() => {
    if (!connection || !address || !balanceManager) return;

    const updateBalances = async () => {
      try {
        const publicKey = new PublicKey(address);
        const newBalances = await balanceManager.getTotalBalances(
          publicKey,
          activeFightId || undefined,
          activeFightSecureId || undefined
        );
        setBalances(newBalances);

        const sol = await balanceManager.getBalance(publicKey);
        setSolBalance(sol);
      } catch (error) {
        console.error('Error updating balances:', error);
      }
    };

    updateBalances();
  }, [connection, address, balanceManager, activeFightId, activeFightSecureId]);

  const updateBalancesForFight = useCallback(async (fightId: string, secureFightId?: string) => {
    if (!address || !balanceManager) return;
    
    setActiveFightId(fightId);
    setActiveFightSecureId(secureFightId || null);
    
    try {
      const newBalances = await balanceManager.updateBalancesForFight(
        new PublicKey(address),
        fightId,
        secureFightId
      );
      setBalances(newBalances);
    } catch (error) {
      console.error('Error updating fight balances:', error);
    }
  }, [address, balanceManager]);

  // Update odds calculation to use the instance
  useEffect(() => {
    const totalPot = 100000000;
    const betAmountNum = parseFloat(betAmount) || 0;
    const calculatedOdds = oddsCalculator.calculateOdds(betAmountNum, totalPot);
    setOdds(calculatedOdds);
  }, [betAmount]);

  // Update the effect to include secure fight ID
  useEffect(() => {
    if (activeFightId && activeFightSecureId) {
      updateBalancesForFight(activeFightId, activeFightSecureId);
    }
  }, [activeFightId, activeFightSecureId, updateBalancesForFight]);

   const handleDeposit = useCallback(async (amount: number) => {
    setIsLoading(true);
    try {
        console.log('Initiating deposit transaction with amount:', amount);
        
        const txid = await depositSol(
            new PublicKey(BETTING_PROGRAM_ID),
            amount,
            walletProvider,
            connection
        );

        console.log('Deposit transaction sent:', txid);
        
        console.log('Fetching updated balances...');
        await updateBalancesForFight(activeFightId, activeFightSecureId);
        setDepositAmount('');
        console.log('Deposit flow completed successfully');
    } catch (error) {
        console.error('Deposit failed with error:', error);
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
        throw error;
    } finally {
        setIsLoading(false);
    }
  }, [walletProvider, connection, updateBalancesForFight, activeFightId, activeFightSecureId, setDepositAmount]);

  const handleSwap = useCallback(async () => {
    if (!walletProvider || !address || !swapAmount) {
      alert('Please ensure your wallet is connected and swap amount is provided.');
      return;
    }

    setIsLoading(true);
    try {
      await swapSolForRapr(
        BETTING_PROGRAM_ID,
        parseFloat(swapAmount),
        walletProvider,
        connection
      );
      
      await updateBalancesForFight(activeFightId, activeFightSecureId);
      setSwapAmount('');
    } catch (error) {
      console.error('RAPR swap failed:', error);
      alert(`RAPR swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [address, swapAmount, connection, walletProvider, updateBalancesForFight, activeFightId, activeFightSecureId]);

    const handlePlaceBet = useCallback(async (
      fightId: string,
      player: 'player1' | 'player2',
      amount: number,
      tokenType: TokenType,
      activeFightSecureId: string,
      programId: PublicKey = BETTING_PROGRAM_ID,
     provider: Provider = walletProvider,
     conn: Connection = connection,
  ) => {
      if (!address || !provider) {
        throw new Error('Wallet not connected');
      }

      setIsLoading(true);
      try {
         const betAmountNumber = parseFloat(amount.toString());
         if (isNaN(betAmountNumber)) {
             throw new Error('Invalid bet amount');
         }

        setActiveFightId(fightId);
        setActiveFightSecureId(activeFightSecureId);

        await placeBet(
          programId,
          fightId,
          betAmountNumber,
          odds,
          tokenType,
          provider,
          conn,
          activeFightSecureId,
       );
        
        // Force balance update with fight ID after bet
        await updateBalancesForFight(fightId, activeFightSecureId);
        setBetAmount('');
        return true;
      } catch (error) {
        console.error('Bet placement failed:', error);
        throw error;
      } finally {
         setIsLoading(false);
      }
    }, [address, odds, connection, updateBalancesForFight, walletProvider]);

    const handleCashOut = useCallback(async (activeFightSecureId: string, fightState: any) => {
        if (!address || !walletProvider || !connection) {
           throw new Error('Wallet not connected');
       }

        setIsLoading(true);
        try {
            await cashOut(
                new PublicKey(BETTING_PROGRAM_ID),
                activeFightId || "",
                walletProvider,
                connection,
                activeFightSecureId,
                fightState
            );
            
           // Clear active fight ID and force balance update
           setActiveFightId(null);
           setActiveFightSecureId(null);
            await updateBalancesForFight(activeFightId, activeFightSecureId);
        } catch (error) {
            console.error('Error in handleCashOut:', error);
            throw error;
       } finally {
           setIsLoading(false);
       }
   }, [address, connection, walletProvider, updateBalancesForFight, activeFightId, activeFightSecureId]);


    const handleMintDumbsForWin = useCallback(async (activeFightSecureId: string, fightState: any) => {
        if (!address || !walletProvider || !connection) {
           throw new Error('Wallet not connected');
       }

      setIsLoading(true);
        try {
            await mintDumbsForWin(
                BETTING_PROGRAM_ID,
                walletProvider,
                connection,
                activeFightSecureId,
                fightState
            );
    
           // Force balance update with fight ID after mint
             await updateBalancesForFight(activeFightId, activeFightSecureId);
      } catch (error) {
          console.error('Minting DUMBS failed:', error);
           if (error instanceof Error) {
                console.error('Mint Dumbs Error Details:', {
                   message: error.message,
                    stack: error.stack,
                    name: error.name
               });
          }
            throw error;
        } finally {
           setIsLoading(false);
        }
  }, [address, connection, walletProvider, updateBalancesForFight, activeFightId, activeFightSecureId]);


  return {
    solBalance,
    dumbsBalance: balances.freeDumbs,
    raprBalance: balances.Rapr,
    balances,
    depositAmount,
    setDepositAmount,
    swapAmount,
    setSwapAmount,
    betAmount,
    setBetAmount,
    odds,
    isLoading,
    handleDeposit,
    handleSwap,
    placeBet: handlePlaceBet,
    handleCashOut,
    updateBalancesForFight,
    handleMintDumbsForWin,
    connection,
    walletProvider,
  };
}

export type UseSolanaReturn = ReturnType<typeof useSolana>;