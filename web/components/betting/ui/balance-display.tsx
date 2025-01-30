interface BalanceDisplayProps {
  solBalance: number | null;
  balances: {
    freeDumbs: number;
    Rapr: number;
  };
  odds: number;
  raprMultiplier: number;
}

export const BalanceDisplay = ({ solBalance, balances, odds, raprMultiplier }: BalanceDisplayProps) => {
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      {/* SOL Balance */}
      <div className="bg-base-200 rounded-lg p-2">
        <div className="text-xs opacity-70">SOL Balance</div>
        <div className="text-lg font-bold text-primary">
          {solBalance !== null ? `${solBalance.toFixed(2)}` : '...'}
        </div>
      </div>
      
      {/* Free DUMBS */}
      <div className="bg-base-200 rounded-lg p-2">
        <div className="text-xs opacity-70">FreeDUMBS</div>
        <div className="text-lg font-bold text-secondary">
          {Math.floor(balances.freeDumbs)}
        </div>
      </div>
      
      {/* RetardedRAPR */}
      <div className="bg-base-200 rounded-lg p-2">
        <div className="text-xs opacity-70">RAPR</div>
        <div className="text-lg font-bold text-accent">
          {Math.floor(balances.Rapr)}
        </div>
        <div className="text-xs text-success">
          {raprMultiplier}x Bonus
        </div>
      </div>
      
      {/* Current Bets */}
      <div className="bg-base-200 rounded-lg p-2">
        <div className="text-xs opacity-70">Current Bets</div>
        <div className="text-sm font-semibold">
        </div>
        <div className="text-sm font-semibold">
        </div>
      </div>
      
      {/* Current Odds */}
      <div className="bg-base-200 rounded-lg p-2 col-span-2">
        <div className="text-xs opacity-70">Current Odds</div>
        <div className="text-lg font-bold">
          {odds.toFixed(2)}x
        </div>
      </div>
    </div>
  );
}; 