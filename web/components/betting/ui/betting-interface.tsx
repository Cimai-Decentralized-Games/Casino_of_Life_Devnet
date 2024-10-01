import React from 'react';

interface BettingInterfaceProps {
  balance: number;
  betAmount: string;
  setBetAmount: React.Dispatch<React.SetStateAction<string>>;
  onPlaceBet: (player: 'player1' | 'player2') => void;
  isLoading: boolean;
}

const BettingInterface: React.FC<BettingInterfaceProps> = ({
  balance,
  betAmount,
  setBetAmount,
  onPlaceBet,
  isLoading
}) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-2">Place Your Bet</h2>
      <input
        type="number"
        min="10"
        max={balance}
        step="10"
        value={betAmount}
        onChange={(e) => setBetAmount(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
      />
      <span className="block text-center mb-2">Bet Amount: {betAmount} DUMBS</span>
      <div className="flex justify-between">
        <button
          className={`bg-blue-500 text-white px-4 py-2 w-1/2 mr-2 rounded hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => onPlaceBet('player1')}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Bet on Player 1'}
        </button>
        <button
          className={`bg-red-500 text-white px-4 py-2 w-1/2 ml-2 rounded hover:bg-red-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => onPlaceBet('player2')}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Bet on Player 2'}
        </button>
      </div>
    </div>
  );
};

export default BettingInterface;