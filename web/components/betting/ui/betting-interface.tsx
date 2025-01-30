import React, { useEffect, useState } from 'react';
import { TokenType } from '../services/useSolana';

interface BettingInterfaceProps {
  balances: {
    freeDumbs: number;
    Rapr: number;
  };
  betAmount: string;
  setBetAmount: (amount: string) => void;
  onPlaceBet: (player: 'player1' | 'player2', tokenType: TokenType) => Promise<void>;
  isLoading: boolean;
  maxBetDumbs: number;
  minBetDumbs: number;
  maxBetRapr: number;
  minBetRapr: number;
  raprMultiplier: number;
}

const BettingInterface: React.FC<BettingInterfaceProps> = ({
  balances,
  betAmount,
  setBetAmount,
  onPlaceBet,
  isLoading,
  maxBetDumbs = 1000000, // Default max bet in DUMBS
  minBetDumbs = 100, // Default min bet in DUMBS
  maxBetRapr = 1000, // Default max bet in Rapr
  minBetRapr = 1 // Default min bet in Rapr
}) => {
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<'dumbs' | 'rapr'>('dumbs');

  // Validate bet amount whenever it changes
  useEffect(() => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount)) {
      setError('Please enter a valid number');
    } else if (amount < minBetDumbs) {
      setError(`Minimum bet is ${minBetDumbs} DUMBS`);
    } else if (amount < minBetRapr) {
      setError(`Minimum bet is ${minBetRapr} Rapr`);
    } else if (amount > maxBetDumbs) {
      setError(`Maximum bet is ${maxBetDumbs} DUMBS`);
    } else if (amount > maxBetRapr) {
      setError(`Maximum bet is ${maxBetRapr} Rapr`);
    } else if (amount > balances.freeDumbs) {
      setError(`Insufficient balance. You have ${balances.freeDumbs} DUMBS`);
    } else {
      setError(null);
    }
  }, [betAmount, balances.freeDumbs, minBetDumbs, maxBetDumbs, minBetRapr, maxBetRapr]);

  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers only
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBetAmount(value);
    }
  };

  const handlePlaceBet = (player: 'player1' | 'player2') => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < minBetDumbs || amount > maxBetDumbs || amount > balances.freeDumbs || amount < minBetRapr || amount > maxBetRapr) {
      return; // Don't place bet if validation fails
    }
    
    // Create the correct TokenType based on selection
    const tokenType: TokenType = selectedToken === 'dumbs' 
      ? TokenType.DUMBS
      : TokenType.RAPR;

    onPlaceBet(player, tokenType);
  };

  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-2">Place Your Bet</h2>
      
      <div className="mb-2">
        <input
          type="number"
          min={minBetDumbs || minBetRapr}
          max={Math.min(maxBetDumbs, balances.freeDumbs || maxBetRapr, balances.Rapr)}
          step="1"
          value={betAmount}
          onChange={handleBetAmountChange}
          className={`w-full p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
          placeholder={`Min: ${minBetDumbs} DUMBS | Min: ${minBetRapr} Rapr`}
        />
        
        <div className="mt-1 text-sm">
          {error ? (
            <span className="text-red-500">{error}</span>
          ) : (
            <span className="text-gray-500">
              Balance: {balances.freeDumbs} DUMBS | Max Bet: {maxBetDumbs} DUMBS | Max Bet: {maxBetRapr} Rapr
            </span>
          )}
        </div>
      </div>

      <span className="block text-center mb-2 font-medium">
        Bet Amount: {betAmount || '0'} DUMBS | {betAmount || '0'} Rapr
      </span>

      <div className="flex justify-between">
        <button
          className={`bg-blue-500 text-white px-4 py-2 w-1/2 mr-2 rounded hover:bg-blue-600 
            ${(isLoading || !!error) ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handlePlaceBet('player1')}
          disabled={isLoading || !!error}
        >
          {isLoading ? 'Processing...' : 'Bet on Player 1'}
        </button>
        <button
          className={`bg-red-500 text-white px-4 py-2 w-1/2 ml-2 rounded hover:bg-red-600 
            ${(isLoading || !!error) ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handlePlaceBet('player2')}
          disabled={isLoading || !!error}
        >
          {isLoading ? 'Processing...' : 'Bet on Player 2'}
        </button>
      </div>
    </div>
  );
};

export default BettingInterface;