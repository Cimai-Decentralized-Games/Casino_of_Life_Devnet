import React from 'react';

interface SwapInterfaceProps {
  solBalance: number;
  depositAmount: string;
  setDepositAmount: React.Dispatch<React.SetStateAction<string>>;
  swapAmount: string;
  setSwapAmount: React.Dispatch<React.SetStateAction<string>>;
  onDeposit: (amount: number) => void;
  onSwap: () => void;
  isLoading: boolean;
  solDumbsRate: number;
  solRaprRate: number;
  minDepositAmount: number;
  maxDepositAmount: number;
}

const SwapInterface: React.FC<SwapInterfaceProps> = ({
  solBalance,
  depositAmount,
  setDepositAmount,
  swapAmount,
  setSwapAmount,
  onDeposit,
  onSwap,
  isLoading,
  solDumbsRate,
  solRaprRate,
  minDepositAmount,
  maxDepositAmount,
}) => {
  const getEstimatedDumbs = () => {
    const sol = parseFloat(depositAmount) || 0;
    return (sol * solDumbsRate).toFixed(0);
  };

  const getEstimatedRapr = () => {
    const sol = parseFloat(swapAmount) || 0;
    return (sol * solRaprRate).toFixed(0);
  };

  const isValidDepositAmount = () => {
    const amount = parseFloat(depositAmount) || 0;
    return amount >= minDepositAmount && 
           amount <= maxDepositAmount && 
           amount <= solBalance;
  };

  const isValidSwapAmount = () => {
    const amount = parseFloat(swapAmount) || 0;
    return amount >= minDepositAmount && 
           amount <= maxDepositAmount && 
           amount <= solBalance;
  };

  const handleDeposit = () => {
    console.log('Deposit button clicked with amount:', depositAmount);
    onDeposit(parseFloat(depositAmount));
  };

  return (
    <div className="space-y-8">
      {/* Deposit Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Deposit SOL for DUMBS</h2>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Deposit Amount</span>
            <span className="label-text-alt">
              Balance: {solBalance.toFixed(2)} SOL
            </span>
          </label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="input input-bordered w-full"
            placeholder={`${minDepositAmount} - ${maxDepositAmount} SOL`}
            min={minDepositAmount}
            max={maxDepositAmount}
          />
        </div>

        <div className="bg-base-200 p-4 rounded-lg">
          <div className="text-sm opacity-70">You will receive:</div>
          <div className="text-xl font-bold">
            {getEstimatedDumbs()} DUMBS
          </div>
          <div className="text-xs opacity-50">
            Rate: 1 SOL = {solDumbsRate} DUMBS
          </div>
        </div>

        <button
          className="btn btn-primary w-full"
          onClick={handleDeposit}
          disabled={isLoading || !isValidDepositAmount()}
        >
          {isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            'Deposit for DUMBS'
          )}
        </button>
      </div>

      {/* RAPR Swap Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Swap SOL for RAPR</h2>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Swap Amount</span>
            <span className="label-text-alt">
              Balance: {solBalance.toFixed(2)} SOL
            </span>
          </label>
          <input
            type="number"
            value={swapAmount}
            onChange={(e) => setSwapAmount(e.target.value)}
            className="input input-bordered w-full"
            placeholder={`${minDepositAmount} - ${maxDepositAmount} SOL`}
            min={minDepositAmount}
            max={maxDepositAmount}
          />
        </div>

        <div className="bg-base-200 p-4 rounded-lg">
          <div className="text-sm opacity-70">You will receive:</div>
          <div className="text-xl font-bold">
            {getEstimatedRapr()} RAPR
          </div>
          <div className="text-xs opacity-50">
            Rate: 1 SOL = {solRaprRate} RAPR
          </div>
        </div>

        <button
          className="btn btn-primary w-full"
          onClick={onSwap}
          disabled={isLoading || !isValidSwapAmount()}
        >
          {isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            'Swap for RAPR'
          )}
        </button>

        <div className="text-xs opacity-70 text-center">
          <div className="text-success">
            RAPR tokens give you a bonus multiplier on winnings!
          </div>
          <div>
            Min: {minDepositAmount} SOL | Max: {maxDepositAmount} SOL
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapInterface;