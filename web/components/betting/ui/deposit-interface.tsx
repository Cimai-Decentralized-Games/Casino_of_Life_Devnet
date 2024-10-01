import React from 'react';

interface DepositInterfaceProps {
  depositAmount: string;
  setDepositAmount: React.Dispatch<React.SetStateAction<string>>;
  onDeposit: () => void;
  isLoading: boolean;
}

const DepositInterface: React.FC<DepositInterfaceProps> = ({
  depositAmount,
  setDepositAmount,
  onDeposit,
  isLoading
}) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-2">Deposit SOL</h2>
      <input
        type="text"
        value={depositAmount}
        onChange={(e) => setDepositAmount(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
        placeholder="Enter deposit amount"
      />
      <button
        className={`bg-blue-500 text-white px-4 py-2 w-full rounded hover:bg-blue-600 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={onDeposit}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Deposit SOL'}
      </button>
    </div>
  );
};

export default DepositInterface;