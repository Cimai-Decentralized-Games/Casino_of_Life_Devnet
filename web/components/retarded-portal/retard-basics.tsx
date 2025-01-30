import React, { useEffect, useState } from 'react';
import { 
  FaCoins, 
  FaGamepad, 
  FaRobot, 
  FaLock, 
  FaTrophy, 
  FaExchangeAlt,
  FaChartLine,
  FaUsers
} from 'react-icons/fa';

const RetardBasics = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-300 to-base-100">
      {/* Enhanced Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-primary/20 animate-gradient" />
          <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-10" />
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            >
              <div className="w-4 h-4 bg-primary/20 rounded-full blur-sm" />
            </div>
          ))}
        </div>

        {/* Main Hero Content */}
        <div className={`relative z-10 max-w-6xl mx-auto px-4 text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Casino of Life Retarded Gaming
          </h1>
          
          <p className="text-2xl mb-12 max-w-3xl mx-auto leading-relaxed">
            Train AI agents, compete in games, and earn rewards in the next retardio of gaming
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-base-200/80 backdrop-blur-lg p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
              <FaRobot className="text-5xl text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Train AI Agents</h3>
              <p>Create and customize your own AI gaming agents</p>
            </div>

            <div className="bg-base-200/80 backdrop-blur-lg p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
              <FaGamepad className="text-5xl text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Compete & Win</h3>
              <p>Enter tournaments and earn rewards</p>
            </div>

            <div className="bg-base-200/80 backdrop-blur-lg p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
              <FaCoins className="text-5xl text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
              <p>Stake your NFTs and earn passive income</p>
            </div>
          </div>

          {/* CTA Button */}
          <button 
            className="btn btn-primary btn-lg group relative overflow-hidden"
            onClick={() => alert('Casino of Life is coming soon! Stay tuned for our launch.')}
          >
            <span className="relative z-10">Join the Revolution</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      {/* Rest of the content remains the same but with enhanced styling */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Core Steps */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            How It Works
          </h2>
          <div className="grid gap-8">
          {/* Step 1 */}
          <div className="bg-base-200 p-6 rounded-lg shadow-lg flex items-center">
            <FaCoins className="text-4xl text-primary mr-6" />
            <div>
              <h3 className="text-xl font-semibold mb-2">1. Hold RAPR or DUMBS</h3>
              <p>Start your journey by holding these ecosystem tokens. These are your keys to participating in the Casino of Life and earning rewards.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-base-200 p-6 rounded-lg shadow-lg flex items-center">
            <FaRobot className="text-4xl text-primary mr-6" />
            <div>
              <h3 className="text-xl font-semibold mb-2">2. Train Your Agent</h3>
              <p>Use our simple interface to train AI agents for different casino games. We handle all the complexity - you just choose how you want your agent to play!</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-base-200 p-6 rounded-lg shadow-lg flex items-center">
            <FaExchangeAlt className="text-4xl text-primary mr-6" />
            <div>
              <h3 className="text-xl font-semibold mb-2">3. Mint NFT & Stake</h3>
              <p>Convert your trained agent into an NFT and stake it in our pools. Earn passive rewards while your agent competes in the casino.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-base-200 p-6 rounded-lg shadow-lg flex items-center">
            <FaGamepad className="text-4xl text-primary mr-6" />
            <div>
              <h3 className="text-xl font-semibold mb-2">4. Play & Earn</h3>
              <p>Your agents compete in various casino games, earning rewards for successful plays. Each new game adds more earning opportunities!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ecosystem Benefits */}
      <div className="mb-16">
        <h2 className="text-3xl font-semibold mb-8 text-center">Ecosystem Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <FaTrophy className="text-3xl text-secondary mr-4" />
              <h3 className="text-xl font-semibold">Tournaments</h3>
            </div>
            <p>Enter your agents in competitive tournaments for additional prizes and rewards.</p>
          </div>

          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <FaChartLine className="text-3xl text-secondary mr-4" />
              <h3 className="text-xl font-semibold">Growing Liquidity</h3>
            </div>
            <p>Each new game and agent adds to our ecosystem&apos;s liquidity pools, increasing rewards for everyone.</p>
          </div>

          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <FaLock className="text-3xl text-secondary mr-4" />
              <h3 className="text-xl font-semibold">Staking Rewards</h3>
            </div>
            <p>Earn passive income by staking your tokens and NFT agents in various reward pools.</p>
          </div>

          <div className="bg-base-200 p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <FaUsers className="text-3xl text-secondary mr-4" />
              <h3 className="text-xl font-semibold">Community Growth</h3>
            </div>
            <p>Be part of a growing ecosystem where every new addition increases value for all participants.</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-base-200 p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-3xl font-semibold mb-4">Ready to Join?</h2>
        <p className="text-lg mb-6">
          Get ready to be part of the next evolution in gaming and earning.
        </p>
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => alert('Casino of Life is coming soon! Stay tuned for our launch.')}
        >
          Coming Soon
        </button>
      </div>
    </div>
  </div>
  );
};

export default RetardBasics;
