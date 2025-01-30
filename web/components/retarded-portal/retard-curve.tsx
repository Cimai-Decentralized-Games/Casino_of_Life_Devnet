'use client';

import React, { useState } from 'react';
import { FaGamepad, FaCoins, FaChartLine, FaExchangeAlt, FaWater, FaPercentage, FaDollarSign } from 'react-icons/fa';
import Area from '../../components/charts/area';
import LiquidityPoolCard from './liquidity-pool-card'; // Custom component for liquidity pools

interface YieldDataPoint {
  [key: string]: string | number;
  time: string;
  apy: number;
  games: number;
  agents: number;
  volume: number;
  liquidity: number;
}

interface LiquidityPool {
  id: string;
  name: string;
  pair: string;
  apy: number;
  volume24h: number;
  liquidity: number;
  fees24h: number;
  composition: { asset: string; percentage: number }[];
}

const RetardCurve: React.FC = () => {
  const [timeframe, setTimeframe] = useState('year');

  // Simulate growing APY based on games and activity
  const generateYieldData = (): YieldDataPoint[] => {
    const baseAPY = 8; // Start with 8% base APY
    const raprMultiplier = 1.25; // 25% boost from RAPR integration
    const gameMultiplier = 0.5; // Each game adds 0.5% potential
    const agentMultiplier = 0.001; // Small increment per agent pool
    
    return Array.from({ length: 12 }, (_, month) => {
      const games = Math.min(3 + Math.floor(2.5 * month), 30);
      const agentsPerGame = 50 + Math.floor(month * 25);
      const totalAgents = games * agentsPerGame;
      
      const gameBonus = games * gameMultiplier * (1 + month * 0.05);
      const agentBonus = (totalAgents * agentMultiplier) * (1 + month * 0.02);
      const raprBonus = baseAPY * raprMultiplier * (1 + month * 0.05);
      
      const totalAPY = baseAPY + raprBonus + gameBonus + agentBonus;
      
      const volume = 250000 * Math.pow(1.2, month);
      const liquidity = 500000 * Math.pow(1.15, month);
      
      return {
        time: `Month ${month + 1}`,
        apy: Math.min(totalAPY, 100),
        games,
        agents: totalAgents,
        volume,
        liquidity
      };
    });
  };

  // Simulate liquidity pool data
  const generateLiquidityPools = (): LiquidityPool[] => {
    return [
      {
        id: 'dumbs-rapr',
        name: 'DUMBS/RAPR Pool',
        pair: 'DUMBS/RAPR',
        apy: 45.7,
        volume24h: 1200000,
        liquidity: 4500000,
        fees24h: 12000,
        composition: [
          { asset: 'DUMBS', percentage: 50 },
          { asset: 'RAPR', percentage: 50 }
        ]
      },
      {
        id: 'dumbs-usdc',
        name: 'DUMBS/USDC Pool',
        pair: 'DUMBS/USDC',
        apy: 38.2,
        volume24h: 950000,
        liquidity: 3200000,
        fees24h: 9500,
        composition: [
          { asset: 'DUMBS', percentage: 40 },
          { asset: 'USDC', percentage: 60 }
        ]
      },
      {
        id: 'nft-agents-usdt',
        name: 'NFT Agents/USDT Pool',
        pair: 'NFT Agents/USDT',
        apy: 52.3,
        volume24h: 1800000,
        liquidity: 6000000,
        fees24h: 18000,
        composition: [
          { asset: 'NFT Agents', percentage: 30 },
          { asset: 'USDT', percentage: 70 }
        ]
      }
    ];
  };

  const yieldData = generateYieldData();
  const liquidityPools = generateLiquidityPools();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8 rounded-lg shadow-lg mb-8">
        <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          DUMBS Yield Curve
        </h2>
        <p className="text-lg mb-6 text-base-content/80">
          Experience growing yields through the synergy of RAPR integration and Casino expansion.
          Each new game and agent type increases potential returns for DUMBS stakers.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat bg-base-100/80 backdrop-blur-lg p-4 rounded-lg hover:shadow-lg transition-shadow">
            <div className="stat-figure text-primary">
              <FaCoins className="text-3xl" />
            </div>
            <div className="stat-title">Base APY</div>
            <div className="stat-value">{yieldData[0].apy.toFixed(1)}%</div>
            <div className="stat-desc">Starting yield</div>
          </div>

          <div className="stat bg-base-100/80 backdrop-blur-lg p-4 rounded-lg hover:shadow-lg transition-shadow">
            <div className="stat-figure text-secondary">
              <FaGamepad className="text-3xl" />
            </div>
            <div className="stat-title">Games</div>
            <div className="stat-value">{yieldData[11].games}</div>
            <div className="stat-desc">Projected in 12 months</div>
          </div>

          <div className="stat bg-base-100/80 backdrop-blur-lg p-4 rounded-lg hover:shadow-lg transition-shadow">
            <div className="stat-figure text-accent">
              <FaChartLine className="text-3xl" />
            </div>
            <div className="stat-title">Max APY</div>
            <div className="stat-value">{yieldData[11].apy.toFixed(1)}%</div>
            <div className="stat-desc">With full ecosystem</div>
          </div>

          <div className="stat bg-base-100/80 backdrop-blur-lg p-4 rounded-lg hover:shadow-lg transition-shadow">
            <div className="stat-figure text-info">
              <FaExchangeAlt className="text-3xl" />
            </div>
            <div className="stat-title">Agent Types</div>
            <div className="stat-value">{yieldData[11].agents}</div>
            <div className="stat-desc">Diversity bonus</div>
          </div>
        </div>

        {/* Yield Growth Chart */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Projected Yield Growth</h3>
          <Area
            data={yieldData}
            series={[
              { dataKey: 'apy', name: 'APY %', color: '#8884d8' }
            ]}
            height={300}
          />
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-base-100/80 backdrop-blur-lg p-6 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-3">RAPR Integration Benefits</h3>
            <ul className="space-y-2">
              <li>• Enhanced base yield multiplier</li>
              <li>• Priority access to new game pools</li>
              <li>• Bonus rewards from marketplace fees</li>
              <li>• Reduced agent training costs</li>
            </ul>
          </div>

          <div className="bg-base-100/80 backdrop-blur-lg p-6 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-3">Ecosystem Growth Factors</h3>
            <ul className="space-y-2">
              <li>• New game launches increase yield</li>
              <li>• Agent diversity multipliers</li>
              <li>• Growing liquidity pools</li>
              <li>• Marketplace transaction fees</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Liquidity Pools Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8 rounded-lg shadow-lg mb-8">
        <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Liquidity Pools
        </h2>
        <p className="text-lg mb-6 text-base-content/80">
          Explore and participate in our decentralized liquidity pools to earn rewards.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liquidityPools.map((pool) => (
            <LiquidityPoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center">
        <p className="text-sm text-base-content/70">
          * Projected yields are simulated and actual returns may vary based on market conditions and ecosystem growth
        </p>
      </div>
    </div>
  );
};

export default RetardCurve;