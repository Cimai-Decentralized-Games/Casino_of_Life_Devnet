import React from 'react';
import { FaWater, FaPercentage, FaDollarSign } from 'react-icons/fa';

interface LiquidityPoolCardProps {
  pool: {
    id: string;
    name: string;
    pair: string;
    apy: number;
    volume24h: number;
    liquidity: number;
    fees24h: number;
    composition: { asset: string; percentage: number }[];
  };
}

const LiquidityPoolCard: React.FC<LiquidityPoolCardProps> = ({ pool }) => {
  return (
    <div className="bg-base-100/80 backdrop-blur-lg p-6 rounded-lg hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold mb-4">{pool.name}</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-base-content/70">APY</span>
          <span className="text-primary font-semibold">{pool.apy.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base-content/70">24h Volume</span>
          <span className="text-secondary font-semibold">${pool.volume24h.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base-content/70">Liquidity</span>
          <span className="text-accent font-semibold">${pool.liquidity.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base-content/70">24h Fees</span>
          <span className="text-info font-semibold">${pool.fees24h.toLocaleString()}</span>
        </div>
        <div className="mt-4">
          <h4 className="text-lg font-semibold mb-2">Pool Composition</h4>
          <div className="space-y-2">
            {pool.composition.map((asset, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-base-content/70">{asset.asset}</span>
                <span className="font-semibold">{asset.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidityPoolCard;