import React, { useState } from 'react';
import { FightState } from '../services/fightReducer';

interface CashoutInterfaceProps {
  onCashOut: (secureId: string, fightState: any) => Promise<void>;
  isLoading: boolean;
  activeFight: any;
  walletAddress?: string;
}

export const CashoutInterface: React.FC<CashoutInterfaceProps> = ({ 
  onCashOut, 
  isLoading,
  activeFight,
  walletAddress 
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const canCashOut = activeFight?.status === 'completed' && 
                     activeFight.winner && 
                     walletAddress;

  const handleCashOut = async () => {
    if (!activeFight.activeFightSecureId) {
      setError('Invalid fight ID');
      return;
    }

    try {
      setError(null);
      setSuccess(false);
      await onCashOut(activeFight.activeFightSecureId, activeFight);
      setSuccess(true);
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Cashout error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to process cashout. Please try again.');
      }
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const getStatusMessage = () => {
    if (!walletAddress) return 'Please connect your wallet';
    if (!activeFight?.status) return 'No active fight found';
    if (activeFight.status !== 'completed') return 'Fight is not completed yet';
    if (!activeFight.winner) return 'Winner has not been determined';
    return 'No winning bets to cash out';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Cash Out</h3>
      
      {error && (
        <div className="alert alert-error text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Successfully cashed out!</span>
        </div>
      )}

      {canCashOut ? (
        <div className="p-4 border rounded-lg bg-base-200">
          <div className="space-y-2">
            <p className="text-sm mb-2">Secure ID: {activeFight.activeFightSecureId}</p>
            {activeFight.winner && (
              <p className="text-sm text-success">
                Winner: {activeFight.winner === 'player1' ? 'Player 1' : 'Player 2'}
              </p>
            )}
            <button
              onClick={handleCashOut}
              className={`btn btn-secondary w-full ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Cash Out Winnings'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center p-4 bg-base-200 rounded-lg">
          <p className="text-sm text-gray-500">
            {getStatusMessage()}
          </p>
        </div>
      )}
    </div>
  );
};

export default CashoutInterface;