import React from 'react';

interface CashoutInterfaceProps {
  onCashOut: () => void;
  isLoading: boolean;
}

const CashoutInterface: React.FC<CashoutInterfaceProps> = ({
  onCashOut,
  isLoading
}) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-2">Cash Out</h2>
      <button
        className={`bg-red-500 text-white px-4 py-2 w-full rounded hover:bg-red-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={onCashOut}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Cash Out'}
      </button>
    </div>
  );
};

export default CashoutInterface;
