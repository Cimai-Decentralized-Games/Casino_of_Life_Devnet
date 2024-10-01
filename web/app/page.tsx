"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link as ScrollLink } from 'react-scroll';
import Link from 'next/link';
import Image from 'next/image';
import { FaBrain, FaGamepad, FaCoins, FaRocket, FaRoad, FaRobot, FaUsers, FaChartLine, FaServer, FaUserFriends } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const sections = [
  { id: 'hero', title: 'Casino of Life' },
  { id: 'about', title: 'About' },
  { id: 'features', title: 'Features' },
  { id: 'tokenomics', title: 'Tokenomics' },
  { id: 'roadmap', title: 'Roadmap' },
];

const NavBar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-50 backdrop-blur-md">
    <ul className="flex justify-center space-x-6 p-4">
      {sections.map((section) => (
        <li key={section.id}>
          <ScrollLink
            to={section.id}
            smooth={true}
            duration={500}
            className="text-white hover:text-primary cursor-pointer"
          >
            {section.title}
          </ScrollLink>
        </li>
      ))}
      <li>
        <Link href="/betting-dashboard" className="text-white hover:text-primary">
          Enter App
        </Link>
      </li>
    </ul>
  </nav>
);

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="card bg-base-100 shadow-xl">
    <div className="card-body">
      <div className="flex items-center mb-4">
        {icon}
        <h3 className="card-title ml-2">{title}</h3>
      </div>
      <p>{description}</p>
    </div>
  </div>
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
  <section id={id} className="min-h-screen flex flex-col justify-center items-center p-8">
    <h2 className="text-4xl font-bold mb-8">{title}</h2>
    {children}
  </section>
);

const RoadmapItem = ({ icon, quarter, year, title, description }: { icon: React.ReactNode; quarter: string; year: string; title: string; description: string }) => (
  <div className="flex items-start mb-8">
    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center mr-4">
      {icon}
    </div>
    <div>
      <div className="font-bold text-lg mb-1">{quarter} {year}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-base-content">{description}</p>
    </div>
  </div>
);

const tokenomicsData = [
  { name: 'Bonding Curve', value: 50, color: '#FF6384' },
  { name: 'Beta Rewards', value: 20, color: '#36A2EB' },
  { name: 'Investor Pool', value: 15, color: '#FFCE56' },
  { name: 'Team & Advisors', value: 10, color: '#4BC0C0' },
  { name: 'Community Initiatives', value: 5, color: '#9966FF' },
];

export default function Home() {
  return (
    <div className="bg-base-200 text-base-content">
      <NavBar />

      {/* Hero Section */}
      <Section id="hero" title="">
        {/* Container for background video */}
        <div className="relative w-full h-screen overflow-hidden">
          {/* Background video */}
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

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <h1 className="text-6xl font-bold mb-4">Casino of Life</h1>
              <p className="text-xl mb-8">
                AI-powered retro fighting game betting platform
              </p>
              <Link href="/education-portal" passHref>
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
              Casino of Life by Cimai is a groundbreaking platform that fuses retro gaming with advanced AI. <br />
              It's an innovative esports ecosystem where players create, train, and battle AI agents in classic game environments. <br /><br />
              Leveraging reinforcement learning and blockchain technology, we offer a unique blend of entertainment, education, and economic opportunity. <br /><br />
              Join us to develop AI, compete in tournaments, and earn freeDUMBS tokens in a decentralized gaming revolution.
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
          description="Develop and train your own AI agents using various reinforcement learning algorithms. Access our Learning Hub and Development Sandbox for guidance and optimization."
        />
        <FeatureCard
          icon={<FaGamepad className="text-4xl text-primary" />}
          title="Competitive Gameplay"
          description="Enter your AI agents into tournaments, climb the leaderboards, and participate in real-time spectator matches with betting opportunities."
        />
        <FeatureCard
          icon={<FaCoins className="text-4xl text-primary" />}
          title="DUMBS Token Economy"
          description="Earn, trade, and burn DUMBS tokens. Participate in a decentralized marketplace with speculative investment features and potential external use cases."
        />
        <FeatureCard
          icon={<FaServer className="text-4xl text-primary" />}
          title="FreeDumbs Network"
          description="Leverage our decentralized storage and computation solution. Contribute resources to earn rewards and fund your AI development."
        />
        <FeatureCard
          icon={<FaUserFriends className="text-4xl text-primary" />}
          title="Community-Driven Ecosystem"
          description="Engage in a vibrant community of developers, players, and investors. Collaborate, compete, and grow together in this innovative platform."
        />
      </div>
    </Section>

      {/* Tokenomics Section */}
        <Section id="tokenomics" title="Tokenomics">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      <div>
        <h3 className="text-2xl font-bold mb-4">freeDUMBS Token Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={tokenomicsData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {tokenomicsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-4">
        <TokenomicsCard
          icon={<FaCoins className="text-3xl text-primary" />}
          title="Dynamic Supply"
          description="Utilizes a bonding curve mechanism for minting and burning tokens, ensuring liquidity and controlled growth."
        />
        <TokenomicsCard
          icon={<FaChartLine className="text-3xl text-secondary" />}
          title="Beta Rewards"
          description="Early adopters receive tokens for platform engagement and milestones, with a vesting schedule to align long-term interests."
        />
        <TokenomicsCard
          icon={<FaUsers className="text-3xl text-accent" />}
          title="Community Focused"
          description="Allocation for community initiatives and investor pool to drive platform adoption and development."
        />
        <TokenomicsCard
          icon={<FaRocket className="text-3xl text-info" />}
          title="Sustainable Growth"
          description="PID controller regulates token supply post-launch, balancing liquidity and managing price dynamics."
        />
      </div>
    </div>
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
      title="DUMBS Token Public Sale"
      description="Launch of the DUMBS token, introducing our innovative tokenomics model with the bonding curve mechanism. This phase will include community engagement initiatives, strategic partnerships, and the activation of our decentralized marketplace for AI agent trading and investment."
    />
    <RoadmapItem
      icon={<FaGamepad className="text-2xl text-white" />}
      quarter="Q3"
      year="2025"
      title="Game Emulator Expansion"
      description="Significant expansion of our game library, introducing thousands of new retro titles across various genres. This update will provide a diverse playground for AI agents, challenging developers to create more versatile and adaptive algorithms. We'll also launch advanced tournaments with substantial DUMBS token rewards."
    />
    <RoadmapItem
      icon={<FaRobot className="text-2xl text-white" />}
      quarter="Q4"
      year="2025"
      title="Autonomous Protocol Implementation"
      description="Introduction of our fully autonomous, self-driving protocol powered by a sophisticated PID controller. This groundbreaking feature will optimize platform operations, from matchmaking to token supply management, ensuring a balanced and thriving ecosystem. We'll also launch advanced developer tools and AI agent marketplaces."
    />
  </div>
</Section>

      {/* App Navigation */}
      <Section id="app-nav" title="Explore the App">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Link href="/education-portal" className="btn btn-primary w-full">Education Portal</Link>
          <Link href="/betting-dashboard" className="btn btn-primary w-full">Casino</Link>
          <Link href="/game-agent" className="btn btn-primary w-full">Dashboard</Link>
          <Link href="/registry" className="btn btn-primary w-full sm:col-span-2 md:col-span-1">Registry</Link>
          <Link href="/educhatbox" className="btn btn-primary w-full sm:col-span-2 md:col-span-1 md:col-start-2">RL Chat</Link>
        </div>
      </Section>
    </div>
  );
}
