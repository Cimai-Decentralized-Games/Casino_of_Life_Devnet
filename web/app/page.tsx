"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Link as ScrollLink, Events, scrollSpy } from 'react-scroll';
import Link from 'next/link';
import Image from 'next/image';
import { FaBrain, FaGamepad, FaCoins, FaRocket, FaRoad, FaRobot, FaUsers, FaChartLine, FaWallet, FaUserFriends, FaStore } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';



const NavBar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-50 backdrop-blur-md">
    <ul className="flex justify-center space-x-6 p-4">
      <li>
        <Link href="/retarded-portal" className="text-white hover:text-primary">
          Get Retarded
        </Link>
      </li>
      <li>
        <Link href="/betting-dashboard" className="text-white hover:text-primary">
          Enter Casino
        </Link>
      </li>
      <li>
        <Link href="https://casino-of-life.gitbook.io/cimais-casino-of-life-docs" className="text-white hover:text-primary">
          Read the Docs
        </Link>
      </li>
    </ul>
  </nav>
);

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <motion.div
    className="card bg-base-100 shadow-xl overflow-hidden"
    variants={cardVariants}
    initial="offscreen"
    whileInView="onscreen"
    viewport={{ once: true, amount: 0.3 }}
    whileHover={hoverScale}
  >
    <div className="card-body relative">
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />
      <div className="flex items-center mb-4 relative">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          className="text-primary"
        >
          {icon}
        </motion.div>
        <h3 className="card-title ml-2">{title}</h3>
      </div>
      <p className="relative z-10">{description}</p>
    </div>
  </motion.div>
);


const TokenomicsCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex items-start p-4 bg-base-200 rounded-lg shadow-md">
    {icon}
    <div className="ml-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p>{description}</p>
    </div>
  </div>
);

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="min-h-screen flex flex-col justify-center items-center p-4 md:p-8">
    <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-8 text-center">{title}</h2>
    {children}
  </section>
);

const RoadmapItem = ({ icon, quarter, year, title, description }: { icon: React.ReactNode; quarter: string; year: string; title: string; description: string }) => (
  <motion.div 
    className="flex items-start mb-8"
    initial={{ x: -50, opacity: 0 }}
    whileInView={{ x: 0, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
  >
    <motion.div 
      className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center mr-4"
      whileHover={{ scale: 1.1, rotate: 360 }}
      transition={{ duration: 0.3 }}
    >
      {icon}
    </motion.div>
    <div>
      <motion.div 
        className="font-bold text-lg mb-1"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {quarter} {year}
      </motion.div>
      <motion.h3 
        className="text-xl font-semibold mb-2"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {title}
      </motion.h3>
      <motion.p 
        className="text-base-content"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {description}
      </motion.p>
    </div>
  </motion.div>
);

const tokenomicsData = [
  { name: 'Airdrop to RAPR ticket holders', value: 35, color: '#FF6384' },
  { name: 'Re-Roll Incentives', value: 25, color: '#36A2EB' },
  { name: 'Marketplace Rewards', value: 20, color: '#FFCE56' },
  { name: 'Staking Rewards', value: 15, color: '#4BC0C0' },
  { name: 'Team Allocation', value: 5, color: '#9966FF' },
];

// Custom label component for better readability
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
      className="font-medium"
    >
      {`${name}: ${value}%`}
    </text>
  );
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2 }
};

const cardVariants = {
  offscreen: {
    y: 50,
    opacity: 0
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 0.8
    }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const TokenomicsSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <motion.div
      className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto p-4"
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      <motion.div 
        className="flex flex-col items-center"
        animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      >
        <h3 className="text-2xl font-bold mb-4">freeDUMBS Distribution</h3>
        <ResponsiveContainer width="100%" height={500}>
          <PieChart>
            <Pie
              data={tokenomicsData}
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              onAnimationEnd={() => setIsVisible(true)}
              animationBegin={0}
              animationDuration={2000}
            >
              {tokenomicsData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => `${value}%`}
              contentStyle={{ 
                backgroundColor: 'rgba(26, 26, 26, 0.9)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ color: 'white' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
      
      <motion.div 
    className="space-y-4"
    variants={containerVariants}
  >
    <TokenomicsCard
      icon={<FaCoins className="text-3xl text-primary" />}
      title="Community-Driven Distribution"
      description="FreeDUMBS tokens will be airdropped to RAPR ticket holders who supported the Box Office Launch of the Casino of Life, rewarding early supporters and aligning value with genuine community engagement. Additional tokens are distributed as participation rewards to foster organic growth."
    />
    <TokenomicsCard
      icon={<FaBrain className="text-3xl text-secondary" />}
      title="Integration with the Marketplace"
      description="Creators can mint AI agents as NFTs via Metaplexs Hybrid Program Library, creating a decentralized marketplace. Users can trade agents with tokens of choice on Solana, with FreeDUMBS and RAPR holders benefiting from fee rebates or discounts."
    />
    <TokenomicsCard
      icon={<FaChartLine className="text-3xl text-accent" />}
      title="Incentives Through Agent Training"
      description="Dynamic incentives emerge as agents are retrained or 're-rolled' with new strategies. High-performing agents can be rented, utilizing FreeDUMBS tokens for transaction fees, adding utility and engagement."
    />
    <TokenomicsCard
      icon={<FaUsers className="text-3xl text-info" />}
      title="Staking for Yield Generation"
      description="FreeDUMBS holders can stake their agent NFTs or tokens to earn yields from marketplace transaction fees, LP pool revenue, and ecosystem activity. This incentivizes long-term participation and growth."
    />
    <TokenomicsCard
      icon={<FaWallet className="text-3xl text-warning" />}
      title="Liquidity Pool Integration"
      description="FreeDUMBS tokens can be paired with other tokens (e.g., USDC, SOL) in LP pools for yield farming opportunities. A portion of marketplace transaction fees is funneled back to LP providers and stakers as rewards."
    />
  </motion.div>
    </motion.div>
  );
};

const AppNavButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Link href={href} className="btn btn-primary w-full hover:shadow-lg transition-shadow">
      {children}
    </Link>
  </motion.div>
);

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-primary z-50"
      style={{ scaleX, transformOrigin: '0%' }}
    />
  );
};

export default function Home() {
  return (
    <div className="bg-base-200 text-base-content">
      <NavBar />
      
      {/* Hero Section */}
      <Section id="hero" title="">
        <div className="relative w-full h-screen overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute w-full h-full object-cover opacity-70"
          >
            <source src="/subZero.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <h1 className="text-6xl font-bold mb-4">Casino of Life</h1>
              <p className="text-xl mb-8">
                AI-powered retro game betting platform
              </p>
              <Link href="/retarded-portal" passHref>
                <button className="btn btn-primary btn-lg">Get Started</button>
              </Link>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* About Section */}
      <Section id="about" title="About">
        <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8">
          {/* Logo Section */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <Image src="/logo.png" alt="Casino of Life Logo" width={300} height={300} />
          </div>

      {/* Text Section */}
        <div className="text-center md:text-left max-w-2xl">
          <p className="text-lg leading-relaxed">
            Welcome to the Casino of Life—a rebellion, a movement, a return to what&apos;s real. <br />
            Created by Cimai, this isn&apos;t just gaming; it&apos;s <em>Retardio Gaming</em>. A space where underdogs rise, gatekeepers fall, and anyone can win. <br /><br />
            Train your AI agents to conquer retro games like never before. Bet on wild, creative metrics—how many rings Sonic can collect, how far the Contra bros can go, or how many rounds Liu Kang MyLady can dominate. <br /><br />
            Built on a fusion of advanced AI, retro gaming, and blockchain technology, the Casino of Life offers a one-of-a-kind blend of freedom, fun, and earning potential. <br /><br />
            This is your chance to join the revolution. Develop AI, bet boldly, and earn freeDUMBS tokens in a decentralized ecosystem where the power belongs to us.  
          </p>
        </div>
        </div>
        </Section>

          {/* Features Section */}
          <Section id="features" title="Features">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          icon={<FaBrain className="text-4xl text-primary" />}
          title="AI Agent Creation"
          description="Develop and train your own AI agents using various reinforcement learning algorithms. Access The Retarded Hub and Development Sandbox for guidance and optimization."
        />
        <FeatureCard
          icon={<FaGamepad className="text-4xl text-primary" />}
          title="Competitive Gameplay"
          description="Enter your AI agents into the Casino, climb the leaderboards, and participate in real-time spectator matches with betting opportunities."
        />
        <FeatureCard
          icon={<FaCoins className="text-4xl text-primary" />}
          title="DUMBS Token Economy"
          description="Earn, trade, and burn DUMBS tokens. Participate in a decentralized marketplace with speculative investment features and potential external use cases."
        />
        <FeatureCard
          icon={<FaStore className="text-4xl text-primary" />}
          title="Casino of Life Marketplace"
          description="The Casino to end them all. Where everyone can trade AI agents for any token on Solana and stake them and earn rewards."
        />
        <FeatureCard
          icon={<FaUserFriends className="text-4xl text-primary" />}
          title="Retardio Gaming"
          description="Engage in the growing community of developers, players, and investors. Collaborate, compete, and grow together in this innovative platform."
        />
      </div>
    </Section>

      {/* Tokenomics Section */}
        <Section id="tokenomics" title="Tokenomics">
    <TokenomicsSection />
  </Section>

      {/* Roadmap Section */}
      <Section id="roadmap" title="Roadmap">
  <div className="max-w-3xl mx-auto">
    <RoadmapItem
      icon={<FaRocket className="text-2xl text-white" />}
      quarter="Q1"
      year="2025"
      title="Platform Beta Launch"
      description="Unveiling of the Casino of Life platform, featuring AI-driven gameplay in classic retro environments. Early adopters will have the opportunity to create and train their first AI agents, participate in test tournaments, and provide crucial feedback for platform refinement."
    />
    <RoadmapItem
      icon={<FaCoins className="text-2xl text-white" />}
      quarter="Q2"
      year="2025"
      title="FreeDUMBS Token Airdrop"
      description="Launch of the FreeDUMBS token.This phase will be for rewarded the retardedapr ticket holders of the Box Office launch of the Casino of Life.  Include community engagement initiatives, strategic partnerships, and the activation of our decentralized marketplace for AI agent trading and investment."
    />
    <RoadmapItem
      icon={<FaGamepad className="text-2xl text-white" />}
      quarter="Q3"
      year="2025"
      title="Game Emulator Expansion"
      description="Significant expansion of our game library, introducing 100 of new retro titles across various genres. This update will provide a diverse playground for AI agents, challenging developers to create more versatile and adaptive algorithms. We'll also launch advanced Casino initiatives with substantial DUMBS token rewards."
    />
    <RoadmapItem
      icon={<FaRobot className="text-2xl text-white" />}
      quarter="Q4"
      year="2025"
      title="Casino of Life Marketplace"
      description="Introducing the Casino of Life Marketplace, a decentralized platform for AI agent trading and investment. This groundbreaking feature will optimize platform operations, from matchmaking to token supply management, ensuring a balanced and thriving ecosystem. We'll also launch advanced developer tools and escrow services for AI agent trading and holders of the FreeDUMBS token."
    />
  </div>
</Section>

      {/* App Navigation */}
      <Section id="app-nav" title="Explore the App">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <AppNavButton href="/retarded-portal">Retard Portal</AppNavButton>
          <AppNavButton href="/betting-dashboard">Casino</AppNavButton>
          <AppNavButton href="/marketplace">Marketplace</AppNavButton>
          <AppNavButton href="/retardbox">Yap</AppNavButton>
          <AppNavButton href="https://casino-of-life.gitbook.io/cimais-casino-of-life-docs">
            Docs
          </AppNavButton>
        </div>
      </Section>
    </div>
  );
}
