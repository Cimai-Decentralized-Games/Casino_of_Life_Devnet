import React, { useEffect, useState } from 'react';

interface BettingInterfaceProps {
  balance: number;  // This should be in DUMBS (UI amount)
  betAmount: string;
  setBetAmount: React.Dispatch<React.SetStateAction<string>>;
  onPlaceBet: (player: 'player1' | 'player2') => void;
  isLoading: boolean;
  maxBet?: number;  // Optional max bet limit from betting state
  minBet?: number;  // Optional min bet amount
}

const BettingInterface: React.FC<BettingInterfaceProps> = ({
  balance,
  betAmount,
  setBetAmount,
  onPlaceBet,
  isLoading,
  maxBet = 1000000, // Default max bet in DUMBS
  minBet = 10 // Default min bet in DUMBS
}) => {
  const [error, setError] = useState<string | null>(null);

  // Validate bet amount whenever it changes
  useEffect(() => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount)) {
      setError('Please enter a valid number');
    } else if (amount < minBet) {
      setError(`Minimum bet is ${minBet} DUMBS`);
    } else if (amount > maxBet) {
      setError(`Maximum bet is ${maxBet} DUMBS`);
    } else if (amount > balance) {
      setError(`Insufficient balance. You have ${balance} DUMBS`);
    } else {
      setError(null);
    }
  }, [betAmount, balance, minBet, maxBet]);

  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers only
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBetAmount(value);
    }
  };

  const handlePlaceBet = (player: 'player1' | 'player2') => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < minBet || amount > maxBet || amount > balance) {
      return; // Don't place bet if validation fails
    }
    onPlaceBet(player);
  };

  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-2">Place Your Bet</h2>
      
      <div className="mb-2">
        <input
          type="number"
          min={minBet}
          max={Math.min(maxBet, balance)}
          step="1"
          value={betAmount}
          onChange={handleBetAmountChange}
          className={`w-full p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
          placeholder={`Min: ${minBet} DUMBS`}
        />
        
        <div className="mt-1 text-sm">
          {error ? (
            <span className="text-red-500">{error}</span>
          ) : (
            <span className="text-gray-500">
              Balance: {balance} DUMBS | Max Bet: {maxBet} DUMBS
            </span>
          )}
        </div>
      </div>

      <span className="block text-center mb-2 font-medium">
        Bet Amount: {betAmount || '0'} DUMBS
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