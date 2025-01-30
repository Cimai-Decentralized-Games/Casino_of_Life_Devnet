'use client';

import { AppHero } from '../ui/ui-layout';

// Mock data for AI agent NFTs
const aiAgents = [
  { id: 1, name: 'DeepQ Explorer', strategy: 'Deep Q-Learning', rarity: 'Rare', performance: 85 },
  { id: 2, name: 'PolicyGrad Pro', strategy: 'Policy Gradient', rarity: 'Uncommon', performance: 78 },
  { id: 3, name: 'A3C Master', strategy: 'Asynchronous Advantage Actor-Critic', rarity: 'Epic', performance: 92 },
  { id: 4, name: 'TRPO Tactician', strategy: 'Trust Region Policy Optimization', rarity: 'Legendary', performance: 95 },
  { id: 5, name: 'PPO Prodigy', strategy: 'Proximal Policy Optimization', rarity: 'Rare', performance: 88 },
];

export default function DashboardFeature() {
  return (
    <div>
      <AppHero title="AI Agent NFT Collection" subtitle="Explore your Reinforcement Learning agents" />
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strategy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rarity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {aiAgents.map((agent) => (
                <tr key={agent.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agent.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.strategy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.rarity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.performance}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}