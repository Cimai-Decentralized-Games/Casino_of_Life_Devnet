"use client"

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useFight } from './services/useFight';
import { useSolana } from './services/useSolana';
import { LiveStream } from './liveStream';
import { FightStatus } from './fightStatus';
import DepositInterface from './ui/deposit-interface';
import BettingInterface from './ui/betting-interface';
import CashoutInterface from './ui/cashout-interface';
import FightInfo from './ui/fightinfo-interface';
import ChatBox from '../chatbox/chatbox';

const BettingDashboard: React.FC = () => {
  const {
    fightState,
    initializeFightForBetting,
    placeBet,
    startFightAfterBetting,
    fetchAndUpdateFightStatus,
  } = useFight();

  const {
    solBalance,
    dumbsBalance,
    depositAmount,
    setDepositAmount,
    betAmount,
    setBetAmount,
    odds,
    isLoading,
    handleDeposit,
    handleCashOut,
  } = useSolana();

  const wallet = useWallet();
  const { connection } = useConnection();

  const [fightHistory, setFightHistory] = useState<Array<typeof fightState.currentState>>([]);

  useEffect(() => {
    if (fightState.currentState) {
      setFightHistory(prevHistory => [...prevHistory, fightState.currentState]);
    }
  }, [fightState.currentState]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (fightState.status !== 'no_fight') {
        console.log('Fetching fight status update');
        fetchAndUpdateFightStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fightState.status, fetchAndUpdateFightStatus]);


  const handleInitializeFightForBetting = () => {
    console.log('Initializing fight for betting');
    initializeFightForBetting();
  };

  const handlePlaceBet = (player: 'player1' | 'player2') => {
    if (fightState.activeFightId) {
      const amount = parseFloat(betAmount);
      if (isNaN(amount)) {
        console.error('Invalid bet amount');
        alert('Please enter a valid bet amount.');
        return;
      }
      console.log(`Placing bet for ${player} with amount ${amount} and odds ${odds}`);
      placeBet(player, amount);
    } else {
      console.error('No active fight to place a bet on');
      alert('No active fight to place a bet on.');
    }
  };

  const handleStartFight = () => {
    if (fightState.status === 'betting_open') {
      console.log('Starting fight after betting');
      startFightAfterBetting();
    } else {
      console.error('Cannot start fight. Betting is not open.');
      alert('Cannot start fight. Betting is not open.');
    }
  };

  useEffect(() => {
    console.log('Fight state updated:', fightState);
  }, [fightState]);

  useEffect(() => {
    console.log('Rendering LiveStream with:', { 
      activeFightId: fightState.activeFightId, 
      streamUrl: fightState.streamUrl 
    });
  }, [fightState.activeFightId, fightState.streamUrl]);

  return (
    <div className="betting-dashboard min-h-screen bg-base-200 text-base-content p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Sell your SOL for freeDUMBS</h1>
      <h2 className="text-xl mb-6 text-center">Gamble on the Machine in Mortal Kombat II</h2>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
        <LiveStream 
            fightId={fightState.activeFightId} 
            streamUrl={fightState.streamUrl || null} 
          />
        </div>
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title mb-4">Casino of Life Troll Box</h2>
            <ChatBox />
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Betting Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>SOL Balance: <span className="font-semibold">{solBalance !== null ? `${solBalance.toFixed(2)} SOL` : 'Loading...'}</span></div>
              <div>DUMBS Balance: <span className="font-semibold">{dumbsBalance !== null ? `${dumbsBalance.toFixed(2)} DUMBS` : 'Loading...'}</span></div>
            </div>
            <div className="text-center mb-4">Current Odds: <span className="font-semibold">{odds.toFixed(2)}x</span></div>
            
            <DepositInterface
              depositAmount={depositAmount}
              setDepositAmount={setDepositAmount}
              onDeposit={handleDeposit}
              isLoading={isLoading}
            />
            
            {fightState.status === 'betting_open' && (
              <BettingInterface
                betAmount={betAmount}
                setBetAmount={setBetAmount}
                onPlaceBet={(player) => handlePlaceBet(player)}
                isLoading={isLoading}
                balance={dumbsBalance || 0}
              />
            )}
            
            <CashoutInterface
              onCashOut={handleCashOut}
              isLoading={isLoading}
            />

            <FightInfo
              fightData={{
                currentState: fightState.currentState,
                status: fightState.status,
                winner: fightState.winner,
              }}
              fightHistory={fightHistory}
            />

            <FightStatus fightState={fightState} />

            {fightState.status === 'no_fight' && (
              <button 
                onClick={handleInitializeFightForBetting}
                className="btn btn-primary mt-4"
                disabled={isLoading}
              >
                Initialize New Fight for Betting
              </button>
            )}

            {fightState.status === 'betting_open' && (
              <button 
                onClick={handleStartFight}
                className="btn btn-primary mt-4"
                disabled={isLoading}
              >
                Start Fight
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BettingDashboard;