// useSolana.ts
import { useCallback, useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { depositSol } from '../contracts/deposit';
import { placeBet } from '../contracts/placeBet';
import { cashOut } from '../contracts/cashOut';
import { BETTING_PROGRAM_ID } from '@casino-of-life-dashboard/anchor';
import { BalanceManager } from './balance-manager';
import { OddsCalculator } from './odds-calculator';

const balanceManager = new BalanceManager(new Connection(process.env.devnet || 'https://api.devnet.solana.com'));
const oddsCalculator = new OddsCalculator(2.0);

export function useSolana() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [dumbsBalance, setDumbsBalance] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [odds, setOdds] = useState<number>(2.0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (publicKey) {
      try {
        const solBalance = await balanceManager.getBalance(publicKey);
        setSolBalance(solBalance);
        const freedumbsBalance = await balanceManager.getFreeDumbsBalance(publicKey);
        setDumbsBalance(freedumbsBalance);
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    }
  }, [publicKey]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  useEffect(() => {
    const totalPot = 1000000; // This should be fetched from your game state
    const calculatedOdds = oddsCalculator.calculateOdds(parseFloat(betAmount), totalPot);
    console.log('Calculated odds:', calculatedOdds);
    setOdds(calculatedOdds);
  }, [betAmount]);

  const handleDeposit = useCallback(async () => {
    if (!publicKey || !depositAmount || !signTransaction) {
      alert('Please ensure your wallet is connected and deposit amount is provided.');
      return;
    }
    setIsLoading(true);
    try {
      await depositSol(
        BETTING_PROGRAM_ID,
        parseFloat(depositAmount),
        { publicKey, signTransaction },
        connection
      );
      await fetchBalances();
      alert('Deposit successful! DUMBS tokens minted.');
    } catch (error) {
      console.error('Deposit failed:', error);
      alert(`Deposit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, depositAmount, connection, fetchBalances, signTransaction]);

  const handlePlaceBet = useCallback(async (fightId: string) => {
    if (!publicKey || !betAmount || !signTransaction) {
      alert('Please ensure your wallet is connected and bet amount is provided.');
      return;
    }
    setIsLoading(true);
    try {
      const betAmountNumber = parseFloat(betAmount);
      if (isNaN(betAmountNumber)) {
        throw new Error('Invalid bet amount');
      }

      await placeBet(
        BETTING_PROGRAM_ID,
        fightId,
        betAmountNumber,
        odds,
        { publicKey, signTransaction },
        connection
      );
      await fetchBalances();
      alert('Bet placed successfully!');
    } catch (error) {
      console.error('Bet placement failed:', error);
      alert(`Bet placement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, betAmount, odds, connection, fetchBalances, signTransaction]);

  const placeSolanaBet = useCallback(async (fightId: string, player: 'player1' | 'player2', amount: number) => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }
    setIsLoading(true);
    try {
      console.log('Attempting to place bet with amount:', amount);
      console.log('Current odds before placing bet:', odds); 
      await placeBet(
        BETTING_PROGRAM_ID,
        fightId,
        amount,
        odds,
        { publicKey, signTransaction },
        connection
      );
      await fetchBalances();
      return true;
    } catch (error) {
      console.error('Solana bet placement failed:', error);
      if (error instanceof Error) {
        alert(`Failed to place bet: ${error.message}`);
      } else {
        alert('An unknown error occurred while placing the bet');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, odds, connection, fetchBalances, signTransaction]);

  const handleCashOut = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      alert('Please ensure your wallet is connected.');
      return;
    }
    setIsLoading(true);
    try {
      await cashOut(
        BETTING_PROGRAM_ID,
        { publicKey, signTransaction },
        connection
      );
      await fetchBalances();
      alert('Cash out successful!');
    } catch (error) {
      console.error('Cash out failed:', error);
      alert(`Cash out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, fetchBalances, signTransaction]);

  return {
    solBalance,
    dumbsBalance,
    depositAmount,
    setDepositAmount,
    betAmount,
    setBetAmount,
    odds,
    isLoading,
    handleDeposit,
    handlePlaceBet,
    handleCashOut,
    placeSolanaBet,
  };
}

// Define the type for the return value of useSolana
export type UseSolanaReturn = ReturnType<typeof useSolana>;