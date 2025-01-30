import React, { useState, useEffect } from 'react';
import { 
  FaCoins, 
  FaChartLine, 
  FaHandHoldingUsd, 
  FaRobot, 
  FaGamepad,
  FaTrophy,
  FaGem,
  FaLock,
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
      <div className="flex items-start p-6 bg-base-200 rounded-xl hover:shadow-xl transition-shadow group hover:bg-base-300">
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

const EarningOpportunities = () => {
  return (
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
  );
};

export default EarningOpportunities;