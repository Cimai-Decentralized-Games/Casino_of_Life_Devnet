'use client';

import React, { useState, useEffect } from 'react';
import { FaExchangeAlt, FaRandom, FaGamepad, FaChartLine, FaSearch, FaFilter, FaSortAmountDown } from 'react-icons/fa';
import Image from 'next/image'; // Import the Image component
import {
    Tooltip,
  } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { useDebounce } from 'use-debounce';

interface MarketItem {
    id: number;
    name: string;
    image: string; // Path or URL for the agent image
    price: number;
    type: 'NFT' | 'Token';
    rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
    trainingMethod?: 'PPO' | 'A2C' | 'DQN' | 'MLP';
    lastChange: number;
  }
  
  const initialMarketItems: MarketItem[] = [
    { id: 1, name: 'LiuKang Miladyboy Agent', image: '/images/liukang.png', price: 25000, type: 'NFT', rarity: 'Rare', trainingMethod: 'PPO', lastChange: 0.05 },
    { id: 2, name: 'SubZero Smolting Agent', image: '/images/subzero.png', price: 18000, type: 'NFT', rarity: 'Uncommon', trainingMethod: 'DQN', lastChange: -0.02 },
    { id: 3, name: 'RAPR Token', image: '/images/raprtoken.png', price: 8.05, type: 'Token', lastChange: 0.01 },
    { id: 4, name: 'Ebonic Sonic Agent', image: '/images/sonic.png', price: 20001, type: 'NFT', rarity: 'Rare', lastChange: 0.03 },
    { id: 5, name: 'FreeDumbs Token', image: '/images/freedumbs.png', price: 0.25, type: 'Token', lastChange: -0.0001 },
    { id: 6, name: 'Goonin Guile Agent', image: '/images/guile.png', price: 1200, type: 'NFT', rarity: 'Uncommon', lastChange: 0.04 },
    { id: 7, name: 'Saggot Kill Bot Agent', image: '/images/saggot.png', price: 29000, type: 'NFT', rarity: 'Legendary', lastChange: 0.1 },
    { id: 8, name: 'Kitana Waifu Agent', image: '/images/kitana.png', price: 15000, type: 'NFT', rarity: 'Uncommon', trainingMethod: 'A2C', lastChange: -0.03},
    { id: 9, name: 'Matario Agent', image: '/images/mario.png', price: 22000, type: 'NFT', rarity: 'Rare', lastChange: 0.07 },
    { id: 10, name: 'Mileena Waifu2 Agent', image: '/images/mileena.png', price: 16000, type: 'NFT', rarity: 'Uncommon', lastChange: -0.02},
    { id: 11, name: 'Baraka Obama Agent', image: '/images/baraka.png', price: 11000, type: 'NFT', rarity: 'Uncommon', lastChange: 0.02 },
    { id: 12, name: 'Scorpion Jeet Eater Agent', image: '/images/scorpionA3c.png', price: 31000, type: 'NFT', rarity: 'Legendary', lastChange: 0.12 },
  ];

const FeatureCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
  }> = ({ icon, title, description }) => (
    <div className="bg-base-200/80 backdrop-blur-lg p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center transform hover:scale-105 transition-transform">
      {icon}
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-base-content/70">{description}</p>
    </div>
  );
  
  const MarketItemCard: React.FC<{item: MarketItem }> = ({ item }) => {
    const changeClass = item.lastChange > 0 ? 'text-success' : (item.lastChange < 0 ? 'text-error' : 'text-base-content');
    const changeSymbol = item.lastChange > 0 ? '▲' : (item.lastChange < 0 ? '▼' : '');
    return (
      <div className="bg-base-200/80 backdrop-blur-lg p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col transform hover:scale-105 transition-transform">
        <div className="flex justify-center mb-2">
            <Image
                src={item.image}
                alt={item.name}
                width={80}
                height={80}
                className="rounded-md object-contain"
            />
        </div>
        <div className="px-2">
            <h3 className="text-lg font-semibold mb-1">{item.name}</h3>
            <div className="flex justify-between items-center mb-1 text-sm">
                <span>Type: {item.type}</span>
                {item.rarity && <span>Rarity: {item.rarity}</span>}
            </div>
            <div className="flex justify-between items-center">
                <span className="font-bold">Price: {item.price.toFixed(2)}</span>
                <span className={changeClass}>
                  {changeSymbol}{Math.abs(item.lastChange).toFixed(2)}
                  <Tooltip anchorSelect=".tooltip-anchor" content="Price last change" />
                </span>
            </div>
        </div>
      </div>
    );
  };
  
export default function MarketplacePage() {
    const [isVisible, setIsVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
    const [filterType, setFilterType] = useState<'All' | 'NFT' | 'Token'>('All');
    const [sortOption, setSortOption] = useState<'PriceAsc' | 'PriceDesc' | 'NameAsc' | 'NameDesc'>('PriceAsc');
    const [marketItems, setMarketItems] = useState<MarketItem[]>(initialMarketItems);

    useEffect(() => {
      setIsVisible(true);
    }, []);

    useEffect(() => {
      let filteredItems = initialMarketItems;
      
      if(debouncedSearchQuery) {
          const query = debouncedSearchQuery.toLowerCase();
        filteredItems = filteredItems.filter(item => item.name.toLowerCase().includes(query));
      }
      
      if(filterType !== 'All') {
        filteredItems = filteredItems.filter(item => item.type === filterType);
      }
      
      const sortedItems = [...filteredItems]; 
      switch(sortOption) {
          case 'PriceAsc':
            sortedItems.sort((a, b) => a.price - b.price);
            break;
          case 'PriceDesc':
            sortedItems.sort((a, b) => b.price - a.price);
            break;
          case 'NameAsc':
              sortedItems.sort((a,b) => a.name.localeCompare(b.name));
              break;
          case 'NameDesc':
              sortedItems.sort((a,b) => b.name.localeCompare(a.name));
              break;
        }
      setMarketItems(sortedItems);
      
    }, [debouncedSearchQuery, filterType, sortOption]);
  

  const features = [
    {
        icon: <FaExchangeAlt className="text-4xl text-primary mb-4" />,
        title: "Hybrid Asset Trading",
        description: "Seamlessly swap between NFT agents and fungible tokens using Metaplex's MPL-Hybrid protocol, enabling true DeFi liquidity for AI gaming assets."
      },
      {
        icon: <FaRandom className="text-4xl text-secondary mb-4" />,
        title: "Dynamic Re-rolling",
        description: "Experience unique agent evolution through our implementation of MPL-Hybrid's re-rolling feature. Each swap can modify your AI agent's traits and strategies."
      },
      {
        icon: <FaGamepad className="text-4xl text-accent mb-4" />,
        title: "Gaming Integration",
        description: "Trade and transform your AI agents between fungible and non-fungible states while maintaining their learned behaviors and performance metrics."
      },
      {
        icon: <FaChartLine className="text-4xl text-info mb-4" />,
        title: "DeFi Opportunities",
        description: "Access innovative DeFi mechanics including liquidity pools, yield farming, and staking - all powered by hybrid AI gaming assets."
      }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-300 to-base-100 relative overflow-hidden">
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
    <div className={`relative z-10 container mx-auto px-4 py-12 max-w-6xl transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Casino of Life DeFi Marketplace</h1>
          <p className="text-xl max-w-3xl mx-auto text-base-content/80 leading-relaxed">
            Coming Soon: Revolutionary hybrid marketplace combining AI gaming agents with DeFi mechanics. 
            Powered by Metaplex&apos;s MPL-Hybrid protocol, enabling seamless swaps between NFTs and tokens 
            while preserving agent intelligence.
          </p>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
            />
          ))}
        </div>
  
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="input input-bordered bg-base-200 rounded-md mr-2"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                   <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 pointer-events-none" />
                </div>
                  
              </div>
          <div className="flex items-center">
                <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost btn-sm rounded-btn">
                    <FaFilter className="mr-2"/> Filter
                </label>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-40">
                    <li><button onClick={()=> setFilterType('All')}>All</button></li>
                    <li><button onClick={()=> setFilterType('NFT')}>NFT</button></li>
                    <li><button onClick={()=> setFilterType('Token')}>Token</button></li>
                </ul>
                </div>
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm rounded-btn">
                        <FaSortAmountDown className="mr-2"/> Sort
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-40">
                        <li><button onClick={() => setSortOption('PriceAsc')}>Price Asc</button></li>
                        <li><button onClick={() => setSortOption('PriceDesc')}>Price Desc</button></li>
                        <li><button onClick={() => setSortOption('NameAsc')}>Name Asc</button></li>
                        <li><button onClick={() => setSortOption('NameDesc')}>Name Desc</button></li>
                    </ul>
                </div>
          </div>
        </div>
    
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {marketItems.map((item) => (
                <MarketItemCard key={item.id} item={item} />
            ))}
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          <div className="bg-base-200/80 backdrop-blur-lg p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-6">For Traders</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                Access liquid markets for AI gaming assets
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                Participate in yield farming with hybrid tokens
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                Stake assets in performance-based pools
              </li>
            </ul>
          </div>
  
          <div className="bg-base-200/80 backdrop-blur-lg p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-6">For Gamers</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                Train and evolve AI agents through gameplay
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                Convert high-performing agents to fungible tokens
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                Access exclusive re-roll opportunities
              </li>
            </ul>
          </div>
        </div>
  
        <div className="mt-16 text-center">
          <div className="bg-base-200/80 backdrop-blur-lg p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Join the Casino of Life Retardio Revolution</h2>
            <p className="text-lg mb-8">
              Be among the first to experience the fusion of AI gaming and DeFi. 
              Our marketplace will redefine how gaming assets are traded and valued.
            </p>
            <button 
              className="btn btn-primary btn-lg group relative overflow-hidden"
              onClick={() => alert('Marketplace launching soon!')}
            >
                <span className="relative z-10">
                  Coming Soon
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}