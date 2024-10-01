'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { IconRefresh } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { AppModal, ellipsify } from '../ui/ui-layout';
import RLInfoCardProps from './rl-info-card';

export function EducationPortal() {
  const [activeSection, setActiveSection] = useState('intro');

  return (
    <div className="education-portal">
      <h1 className="text-3xl font-bold mb-4">Reinforcement Learning Education Portal</h1>
      <div className="flex">
        <Sidebar setActiveSection={setActiveSection} />
        <MainContent activeSection={activeSection} />
      </div>
    </div>
  );
}

function Sidebar({ setActiveSection }: { setActiveSection: (section: string) => void }) {
  const sections = [
    { id: 'intro', title: 'Introduction to RL' },
    { id: 'basics', title: 'RL Basics' },
    { id: 'algorithms', title: 'RL Algorithms' },
    { id: 'applications', title: 'RL Applications' },
    { id: 'practice', title: 'Practice RL' },
  ];

  return (
    <div className="w-1/4 pr-4">
      <ul>
        {sections.map((section) => (
          <li key={section.id} className="mb-2">
            <button
              className="btn btn-ghost w-full text-left"
              onClick={() => setActiveSection(section.id)}
            >
              {section.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MainContent({ activeSection }: { activeSection: string }) {
  const content = {
    intro: <IntroductionContent />,
    basics: <BasicsContent />,
    algorithms: <AlgorithmsContent />,
    applications: <ApplicationsContent />,
    practice: <PracticeContent />,
  };

  return (
    <div className="w-3/4">
      {content[activeSection as keyof typeof content]}
    </div>
  );
}

function IntroductionContent() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Introduction to Reinforcement Learning</h2>
      <p>Reinforcement Learning (RL) is a type of machine learning where an agent learns to make decisions by interacting with an environment...</p>
      {/* Add more introductory content */}
    </div>
  );
}

function BasicsContent() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">RL Basics</h2>
      <p>The basic components of RL include:</p>
      <ul className="list-disc list-inside">
        <li>Agent</li>
        <li>Environment</li>
        <li>State</li>
        <li>Action</li>
        <li>Reward</li>
      </ul>
      {/* Add more content about RL basics */}
    </div>
  );
}

function AlgorithmsContent() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">RL Algorithms</h2>
      <p>Some popular RL algorithms include:</p>
      <ul className="list-disc list-inside">
        <li>Q-Learning</li>
        <li>SARSA</li>
        <li>Policy Gradient Methods</li>
        <li>Deep Q-Network (DQN)</li>
      </ul>
      {/* Add more content about RL algorithms */}
    </div>
  );
}

function ApplicationsContent() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">RL Applications</h2>
      <p>RL has various real-world applications, including:</p>
      <ul className="list-disc list-inside">
        <li>Game playing (e.g., AlphaGo)</li>
        <li>Robotics</li>
        <li>Autonomous vehicles</li>
        <li>Recommendation systems</li>
      </ul>
      {/* Add more content about RL applications */}
    </div>
  );
}

function PracticeContent() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Practice RL</h2>
      <p>Here you can practice RL concepts with interactive simulations:</p>
      {/* Add interactive RL practice components */}
    </div>
  );
}
