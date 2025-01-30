import React, { useState, useEffect } from 'react';
import { 
  FaCoins, 
  FaChartLine, 
  FaHandHoldingUsd, 
  FaRobot, 
  FaUserFriends,
  FaTheaterMasks,
  FaGem,
  FaLock,
  FaTrophy,
  FaArrowRight,
  FaGamepad,
  FaExchangeAlt
} from 'react-icons/fa';

const StrategyItem = ({ icon, title, description, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <li className={`transform transition-all duration-700 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
    }`}>
      <div className="flex items-start p-6 bg-base-200/80 backdrop-blur-lg rounded-xl hover:shadow-xl transition-shadow group hover:bg-base-300 transform hover:scale-105 transition-transform">
        <div className="mr-4 p-3 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
          {React.cloneElement(icon, { className: "text-3xl text-primary" })}
        </div>
        <div>
          <strong className="block mb-2 text-xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {title}
          </strong>
          <span className="text-base-content/80 leading-relaxed">{description}</span>
        </div>
      </div>
    </li>
  );
};

const BenefitCard = ({ title, items, icon }) => (
  <div className="bg-base-200/80 backdrop-blur-lg p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 transform hover:scale-105 transition-transform">
    <div className="flex items-center mb-4">
      {React.cloneElement(icon, { className: "text-3xl text-primary mr-3" })}
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-center group">
          <FaArrowRight className="mr-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const RetardAIStrategy = () => {
  const [activeTab, setActiveTab] = useState('freedumbs');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-300 to-base-100">
      {/* Enhanced Hero Section */}
      <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
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
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            FreeDUMBS & RAPR
          </h1>
          <p className="text-2xl mb-12 max-w-3xl mx-auto leading-relaxed">
            Unlock the full potential of our ecosystem with advanced AI strategies and exclusive rewards
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Earning Opportunities */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Earning Opportunities
          </h2>
          <ul className="space-y-6">
            <StrategyItem
              icon={<FaCoins />}
              title="Casino of Life Staking"
              description="Stake your FreeDUMBS tokens in our secure pools to earn continuous rewards from casino operations, platform fees, and ecosystem growth. Earn higher rewards with longer staking periods."
              delay={100}
            />
            
            <StrategyItem
              icon={<FaRobot />}
              title="AI Agent Training & Deployment"
              description="Create and train your own AI gaming agents using our intuitive interface. Deploy them to compete in various casino games and earn rewards based on their performance. No technical knowledge required!"
              delay={200}
            />
            
            <StrategyItem
              icon={<FaGamepad />}
              title="Gaming Tournaments"
              description="Enter your trained agents in competitive tournaments for additional prizes. Compete against other players' agents and earn rewards based on your ranking and performance."
              delay={300}
            />
            
            <StrategyItem
              icon={<FaExchangeAlt />}
              title="NFT Minting & Trading"
              description="Convert your successful AI agents into tradeable NFTs. Stake them in specialized pools or trade them on the marketplace. Each agent's unique training and performance history adds to its value."
              delay={400}
            />
            
            <StrategyItem
              icon={<FaTrophy />}
              title="Performance Rewards"
              description="Earn additional rewards when your agents achieve exceptional results. Top-performing agents receive bonus multipliers and exclusive access to premium tournaments and features."
              delay={500}
            />
            
            <StrategyItem
              icon={<FaGem />}
              title="Premium Features Access"
              description="RAPR token holders get priority access to new features, enhanced reward multipliers, and exclusive staking pools. Unlock advanced training options and premium tournament entries."
              delay={600}
            />
            
            <StrategyItem
              icon={<FaLock />}
              title="Liquidity Provision"
              description="Provide liquidity to our ecosystem pools and earn additional rewards. Participate in automated market making and earn fees from platform transactions."
              delay={700}
            />
            
            <StrategyItem
              icon={<FaChartLine />}
              title="Ecosystem Growth Benefits"
              description="Benefit from the ecosystem's growth as each new game and agent adds to our liquidity pools. Early participants receive bonus rewards and special access to new features."
              delay={800}
            />
          </ul>
        </section>

        {/* Token Benefits Tabs */}
        <section className="mb-16">
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg p-1 bg-base-200">
              <button
                className={`px-6 py-2 rounded-lg transition-all ${
                  activeTab === 'freedumbs' ? 'bg-primary text-white' : ''
                }`}
                onClick={() => setActiveTab('freedumbs')}
              >
                FreeDUMBS
              </button>
              <button
                className={`px-6 py-2 rounded-lg transition-all ${
                  activeTab === 'rapr' ? 'bg-primary text-white' : ''
                }`}
                onClick={() => setActiveTab('rapr')}
              >
                RAPR
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {activeTab === 'freedumbs' ? (
              <BenefitCard
                title="FreeDUMBS Benefits"
                icon={<FaGem />}
                items={[
                  "Liquidity provision rewards",
                  "Governance voting rights",
                  "Performance-based rewards",
                  "Priority staking pools",
                  "Enhanced yield multipliers",
                  "Early access to new games"
                ]}
              />
            ) : (
              <BenefitCard
                title="RAPR Benefits"
                icon={<FaTrophy />}
                items={[
                  "Box Office launch benefits",
                  "Enhanced staking multipliers",
                  "Community rewards program",
                  "Exclusive features access",
                  "Premium tournament entry",
                  "Advanced agent training options"
                ]}
              />
            )}
          </div>
        </section>

        {/* Box Office Integration */}
        <section className="mb-16">
          <div className="bg-base-200/80 backdrop-blur-lg p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
            <h2 className="text-3xl font-bold mb-6 relative">Box Office Launch Benefits</h2>
            <div className="grid md:grid-cols-2 gap-8 relative">
              <div className="space-y-4">
                <p className="text-lg">
                  Launching on RetardedAPI&apos; Box Office provides unique advantages for both FreeDUMBS and RAPR communities.
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => alert('Coming soon!')}
                >
                  Learn More
                </button>
              </div>
              <ul className="space-y-3">
                {[
                  "Early access to new features",
                  "Exclusive staking pools",
                  "Cross-platform benefits",
                  "Priority access to agents",
                  "Enhanced reward multipliers"
                ].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <FaArrowRight className="mr-2 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-16">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Ready to Join?
          </h2>
          <p className="text-xl mb-8 text-base-content/80">
            Be part of the next evolution in AI-powered gaming and earning
          </p>
          <button 
            className="btn btn-primary btn-lg group relative overflow-hidden"
            onClick={() => alert('Coming soon!')}
          >
            <span className="relative z-10">Join Now</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </section>
      </div>
    </div>
  );
};

export default RetardAIStrategy;