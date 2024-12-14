// useSolana.ts
import { useCallback, useEffect, useState, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { depositSol } from '../contracts/deposit';
import { placeBet } from '../contracts/placeBet';
import { cashOut } from '../contracts/cashOut';
import { BETTING_PROGRAM_ID } from '@casino-of-life-dashboard/anchor';
import { BalanceManager } from './balance-manager';
import { OddsCalculator } from './odds-calculator';

// Create the instance at the component level, outside of any hooks
const oddsCalculator = new OddsCalculator(2.0);

export function useSolana() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [balances, setBalances] = useState({
    freeDumbs: 0,
    betDumbs: 0,
    totalDumbs: 0
  });
  const [depositAmount, setDepositAmount] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [odds, setOdds] = useState<number>(2.0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use refs to maintain stable instances
  const balanceManagerRef = useRef<BalanceManager>();
  const activeFightIdRef = useRef<string | null>(null);
  const activeFightSecureIdRef = useRef<string | null>(null);

  // Initialize balanceManager only once
  useEffect(() => {
    if (connection) {
      balanceManagerRef.current = new BalanceManager(connection);
    }
  }, [connection]);

  const fetchBalances = useCallback(async (fightId?: string, secureFightId?: string) => {
    if (!publicKey || !balanceManagerRef.current) return;

    try {
      console.log('Fetching balances for fight:', fightId, 'secure ID:', secureFightId);
      
      // Get SOL balance
      const solBal = await balanceManagerRef.current.getBalance(publicKey);
      setSolBalance(solBal);

      // Force a fresh balance fetch with confirmed commitment
      const dumbsBalances = await balanceManagerRef.current.updateBalancesForFight(
        publicKey,
        fightId || '',
        secureFightId 
      );
      
      console.log('Updated DUMBS balances:', {
        free: dumbsBalances.freeDumbs,
        bet: dumbsBalances.betDumbs,
        total: dumbsBalances.totalDumbs
      });
      setBalances(dumbsBalances);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  }, [publicKey]);

  // Remove periodic refresh, only update at key moments
  useEffect(() => {
    if (publicKey) {
      fetchBalances();
    }
  }, [publicKey, fetchBalances]);

  // Update odds calculation to use the instance
  useEffect(() => {
    const totalPot = 10000000;
    const betAmountNum = parseFloat(betAmount) || 0;
    const calculatedOdds = oddsCalculator.calculateOdds(betAmountNum, totalPot);
    setOdds(calculatedOdds);
  }, [betAmount]);

  // Update the effect to include secure fight ID
  useEffect(() => {
    if (activeFightIdRef.current && activeFightSecureIdRef.current) {
      fetchBalances(activeFightIdRef.current, activeFightSecureIdRef.current);
    }
  }, [activeFightIdRef.current, activeFightSecureIdRef.current, fetchBalances]);

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
      // Force balance update after deposit
      await fetchBalances();
      setDepositAmount('');
    } catch (error) {
      console.error('Deposit failed:', error);
      alert(`Deposit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, depositAmount, connection, fetchBalances, signTransaction]);

  const handlePlaceBet = useCallback(async (fightId: string, activeFightSecureId: string) => {
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

      activeFightIdRef.current = fightId;
      activeFightSecureIdRef.current = activeFightSecureId;
      
      await placeBet(
        BETTING_PROGRAM_ID,
        fightId,
        betAmountNumber,
        odds,
        { publicKey, signTransaction },
        connection,
        activeFightSecureId
      );
      
      // Force balance update with fight ID after bet
      await fetchBalances(fightId, activeFightSecureId);
      setBetAmount('');
    } catch (error) {
      console.error('Bet placement failed:', error);
      alert(`Bet placement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, betAmount, odds, connection, fetchBalances, signTransaction]);

  const placeSolanaBet = useCallback(async (
    fightId: string, 
    player: 'player1' | 'player2', 
    amount: number,
    activeFightSecureId: string
  ) => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }
    setIsLoading(true);
    try {
      activeFightIdRef.current = fightId;
      
      await placeBet(
        BETTING_PROGRAM_ID,
        fightId,
        amount,
        odds,
        { publicKey, signTransaction },
        connection,
        activeFightSecureId
      );
      
      // Force balance update with fight ID after bet
      await fetchBalances(fightId);
      return true;
    } catch (error) {
      console.error('FreeDUMBS bet placement failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, odds, connection, fetchBalances, signTransaction]);

  const handleCashOut = useCallback(async (activeFightSecureId: string, fightState: any) => {
    if (!publicKey || !signTransaction || !connection) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    try {
      await cashOut(
        connection,
        { publicKey, signTransaction },
        activeFightSecureId,
        fightState
      );
      
      // Clear active fight ID and force balance update
      activeFightIdRef.current = null;
      await fetchBalances();
    } catch (error) {
      console.error('Error in handleCashOut:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, signTransaction, fetchBalances]);

  return {
    solBalance,
    dumbsBalance: balances.freeDumbs,
    balances,
    depositAmount,
    setDepositAmount,
    betAmount,
    setBetAmount,
    odds,
    isLoading,
    handleDeposit,
    handlePlaceBet,
    placeSolanaBet,
    handleCashOut,
    fetchBalances, // Expose for manual refresh if needed
  };
}

export type UseSolanaReturn = ReturnType<typeof useSolana>;