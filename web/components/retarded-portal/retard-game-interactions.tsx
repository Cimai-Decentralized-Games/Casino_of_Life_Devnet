'use client'

import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaUser } from 'react-icons/fa';
import Image from 'next/image';

interface Message {
  sender: 'user' | 'agent';
  text: string;
  suggestions?: string[];
}

interface RLGameInteractionsProps {
  onModelTrained: (modelFile: File, modelData: any) => void;
}

// MK2 Fighters (for training, not LLM characters)
const MK2_FIGHTERS = [
  { id: 'liukang', name: 'Liu Kang' },
  { id: 'kunglao', name: 'Kung Lao' },
  { id: 'cage', name: 'Johnny Cage' },
  { id: 'reptile', name: 'Reptile' },
  { id: 'subzero', name: 'Sub-Zero' },
  { id: 'shang', name: 'Shang Tsung' },
  { id: 'kitana', name: 'Kitana' },
  { id: 'jax', name: 'Jax' },
  { id: 'mileena', name: 'Mileena' },
  { id: 'baraka', name: 'Baraka' },
  { id: 'scorpion', name: 'Scorpion' },
  { id: 'raiden', name: 'Raiden' }
];

// Save States for training
const SAVE_STATES = [
  { id: 'state1', name: 'Level1.LiuKangVsJax.state' },
  { id: 'state2', name: 'LiuKangVsSubZero_VeryHard_07.state' },
  { id: 'state3', name: 'LiuKangVsShangTsung_VeryHard_13.state' },
  { id: 'state4', name: 'LiuKangVsShaoKahn_VeryHard_15.state' }
];

// Add new interfaces for training context
interface TrainingContext {
  character?: string;
  strategy?: 'aggressive' | 'defensive' | 'balanced';
  policy?: 'PPO' | 'MLP' | 'A2C' | 'DQN';
  save_state?: string;
  learning_rate?: number;
  batch_size?: number;
  timesteps?: number;
}

interface TrainingState {
  currentPhase: 'initial' | 'strategy' | 'policy' | 'save_state' | 'confirmation';
  context: TrainingContext;
}

// Add training status interface
interface TrainingStatus {
  progress: number;
  currentReward: number;
  episodeCount: number;
}

// Add component interfaces
interface FighterSelectionProps {
  selectedFighter: string;
  onSelect: (id: string) => void;
}

interface SaveStateSelectionProps {
  selectedState: string;
  onSelect: (id: string) => void;
}

interface TrainingOptionsProps {
  strategy?: string;
  policy?: string;
  onStrategySelect: (strategy: 'aggressive' | 'defensive' | 'balanced') => void;
  onPolicySelect: (policy: 'PPO' | 'MLP' | 'A2C' | 'DQN') => void;
}

// Add component definitions
const FighterSelection: React.FC<FighterSelectionProps> = ({ selectedFighter, onSelect }) => (
  <div className="mb-4">
    <h3 className="font-bold mb-2">Select Fighter:</h3>
    <select 
      value={selectedFighter}
      onChange={(e) => onSelect(e.target.value)}
      className="select select-bordered w-full bg-base-200"
    >
      <option value="">Choose a fighter</option>
      {MK2_FIGHTERS.map(fighter => (
        <option key={fighter.id} value={fighter.id}>
          {fighter.name}
        </option>
      ))}
    </select>
  </div>
);

const SaveStateSelection: React.FC<SaveStateSelectionProps> = ({ selectedState, onSelect }) => (
  <div className="mb-4">
    <h3 className="font-bold mb-2">Select Training Scenario:</h3>
    <select 
      value={selectedState}
      onChange={(e) => onSelect(e.target.value)}
      className="select select-bordered w-full bg-base-200"
    >
      <option value="">Choose a scenario</option>
      {SAVE_STATES.map(state => (
        <option key={state.id} value={state.id}>
          {state.name}
        </option>
      ))}
    </select>
  </div>
);

const TrainingOptions: React.FC<TrainingOptionsProps> = ({ 
  strategy, 
  policy,
  onStrategySelect,
  onPolicySelect 
}) => (
  <div className="grid grid-cols-2 gap-4">
    <div>
      <h3 className="font-bold mb-2">Fighting Strategy:</h3>
      <select 
        value={strategy || ''}
        onChange={(e) => onStrategySelect(e.target.value as 'aggressive' | 'defensive' | 'balanced')}
        className="select select-bordered w-full bg-base-200"
      >
        <option value="">Choose strategy</option>
        {['aggressive', 'defensive', 'balanced'].map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
    </div>
    <div>
      <h3 className="font-bold mb-2">Learning Policy:</h3>
      <select 
        value={policy || ''}
        onChange={(e) => onPolicySelect(e.target.value as 'PPO' | 'MLP' | 'A2C' | 'DQN')}
        className="select select-bordered w-full bg-base-200"
      >
        <option value="">Choose policy</option>
        {['PPO', 'MLP', 'A2C', 'DQN'].map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  </div>
);

const TrainingControls: React.FC<{
  canStartTraining: boolean;
  onStartTraining: () => void;
  isTraining: boolean;
  selectedFighter: string;
  selectedState: string;
  strategy?: string;
  policy?: string;
}> = ({ 
  canStartTraining, 
  onStartTraining, 
  isTraining, 
  selectedFighter, 
  selectedState,
  strategy,
  policy 
}) => (
  <div className="mt-4 p-4 bg-base-200 rounded-lg shadow-lg">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h3 className="text-lg font-bold mb-2">Training Configuration</h3>
        <ul className="space-y-1">
          <li>Fighter: {selectedFighter ? MK2_FIGHTERS.find(f => f.id === selectedFighter)?.name : 'Not selected'}</li>
          <li>Scenario: {selectedState ? SAVE_STATES.find(s => s.id === selectedState)?.name : 'Not selected'}</li>
          <li>Strategy: {strategy || 'Not selected'}</li>
          <li>Policy: {policy || 'Not selected'}</li>
        </ul>
      </div>
      <button 
        onClick={onStartTraining}
        disabled={!canStartTraining || isTraining}
        className={`btn btn-primary btn-lg group relative overflow-hidden ${!canStartTraining ? 'btn-disabled' : ''}`}
      >
          <span className="relative z-10">
          {isTraining ? (
            <>
              <span className="loading loading-spinner"></span>
              Training...
            </>
          ) : (
            'Start Training'
          )}
        </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />

      </button>
    </div>
  </div>
);

const RLGameInteractions: React.FC<RLGameInteractionsProps> = ({ onModelTrained }) => {
  const [selectedFighter, setSelectedFighter] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [roomId] = useState(() => `room_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [trainingState, setTrainingState] = useState<TrainingState>({
    currentPhase: 'initial',
    context: {}
  });
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
    const pollingInterval = useRef<NodeJS.Timeout>();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      setIsVisible(true);
    }, []);


    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }
        };
    }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Initial greeting from CaballoLoko
  useEffect(() => {
    setMessages([{
      sender: 'agent',
      text: "¡Hola! I'm CaballoLoko, I run the Casino of Life and can help as your MK2 training expert. Select a fighter and save state, then let's discuss how you want to train them. I can help you understand different training approaches and strategies and how to earn FreeDUMBS for the Casino."
    }]);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { 
      sender: 'user', 
      text: input 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/educhatbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Chat error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const botMessage: Message = { 
        sender: 'agent', 
        text: data.response || 'Could not process response'
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error in communication:', error);
      const errorMessage: Message = { 
        sender: 'agent', 
        text: error instanceof Error ? error.message : 'Sorry, I encountered an error processing your request.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startStatusPolling = () => {
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await fetch('/api/training-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: roomId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch training status');
        }

        const data = await response.json();
        
        setTrainingStatus(data);

        if (data.progress === 100) {
          clearInterval(pollingInterval.current);
          setIsTraining(false);
        }
      } catch (error) {
        console.error('Error polling training status:', error);
        clearInterval(pollingInterval.current);
        setIsTraining(false);
      }
    }, 1000);
  };

  const startTraining = async () => {
    if (!trainingState.context.character || !trainingState.context.save_state) {
      setMessages(prev => [...prev, {
        sender: 'agent',
        text: 'Please complete the training configuration first.'
      }]);
      return;
    }

    // Get the last message from CaballoLoko
    const lastAgentMessage = messages
      .filter(m => m.sender === 'agent')
      .pop();

    if (!lastAgentMessage) {
      setMessages(prev => [...prev, {
        sender: 'agent',
        text: 'Please discuss your training plan with me first!'
      }]);
      return;
    }

    try {
      setIsTraining(true);
      
      const selectedStateObj = SAVE_STATES.find(s => s.id === trainingState.context.save_state);
      
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "train",
          message: lastAgentMessage.text,
          fighter: trainingState.context.character,
          state: selectedStateObj?.name || "Level1.LiuKangVsJax.state",
          policy: trainingState.context.policy,
          strategy: trainingState.context.strategy,
          save_state: "MortalKombatII-Genesis"
        })
      });

      // Start polling even if we get a timeout
      startStatusPolling();

      // Add message about training start
      setMessages(prev => [...prev, {
        sender: 'agent',
        text: 'Training has started! I will keep you updated on the progress.'
      }]);

      // Try to parse response, but don't fail if we can't
      try {
        const data = await response.json();
        if (data.error && !data.error.includes('504 Gateway Time-out')) {
          throw new Error(data.error);
        }
      } catch (e) {
        console.log('Response parsing error (expected during long training):', e);
      }

    } catch (error) {
      console.error('Training error:', error);
      setMessages(prev => [...prev, {
        sender: 'agent',
        text: 'There was an issue starting the training. Please try again.'
      }]);
      setIsTraining(false);
    }
  };

  const renderTrainingStatus = () => {
    if (!isTraining || !trainingStatus) return null;

    return (
      <div className="bg-base-200 p-4 rounded-lg mb-4 shadow-lg">
        <h3 className="font-bold mb-2">Training Progress:</h3>
        <div className="flex flex-col gap-2">
          <progress 
            className="progress progress-primary" 
            value={trainingStatus.progress} 
            max="100"
          />
          <p>Episodes: {trainingStatus.episodeCount}</p>
          <p>Current Reward: {trainingStatus.currentReward.toFixed(2)}</p>
        </div>
      </div>
    );
  };

  const handleFighterSelect = (fighterId: string) => {
    setSelectedFighter(fighterId);
    setTrainingState(prev => ({
      ...prev,
      context: { ...prev.context, character: fighterId }
    }));
  };

  const handleStateSelect = (stateId: string) => {
    setSelectedState(stateId);
    setTrainingState(prev => ({
      ...prev,
      context: { ...prev.context, save_state: stateId }
    }));
  };

  const handleStrategySelect = (strategy: 'aggressive' | 'defensive' | 'balanced') => {
    setTrainingState(prev => ({
      ...prev,
      context: { ...prev.context, strategy }
    }));
  };

  const handlePolicySelect = (policy: 'PPO' | 'MLP' | 'A2C' | 'DQN') => {
    setTrainingState(prev => ({
      ...prev,
      context: { ...prev.context, policy }
    }));
  };

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
      <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Train Your AI Agent
        </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <div className="bg-base-200/80 backdrop-blur-lg p-4 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Training Setup</h2>
            <div className="grid grid-cols-2 gap-4">
              <FighterSelection 
                selectedFighter={selectedFighter} 
                onSelect={handleFighterSelect} 
              />
              <SaveStateSelection 
                selectedState={selectedState} 
                onSelect={handleStateSelect} 
              />
            </div>
            <TrainingOptions 
              strategy={trainingState.context.strategy}
              policy={trainingState.context.policy}
              onStrategySelect={handleStrategySelect}
              onPolicySelect={handlePolicySelect}
            />
            <TrainingControls 
              canStartTraining={!!(selectedFighter && selectedState && 
                trainingState.context.strategy && trainingState.context.policy)}
              onStartTraining={startTraining}
              isTraining={isTraining}
              selectedFighter={selectedFighter}
              selectedState={selectedState}
              strategy={trainingState.context.strategy}
              policy={trainingState.context.policy}
            />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          {isTraining && renderTrainingStatus()}
          <div className="flex flex-col h-full">
            <div className="messages flex-grow overflow-y-auto mb-4 p-4 bg-base-100/80 backdrop-blur-lg rounded-xl shadow-lg">
              {messages.map((message, index) => (
                <div key={index} className={`chat ${message.sender === 'user' ? 'chat-end' : 'chat-start'} mb-4`}>
                  <div className="chat-image avatar">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      {message.sender === 'agent' ? (
                        <Image
                          src="/images/caballoloko.png"
                          alt="CaballoLoko"
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-10 rounded-full bg-primary flex items-center justify-center">
                          <FaUser />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`chat-bubble ${message.sender === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}`}>
                    {message.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-section flex p-4 bg-base-200/80 backdrop-blur-lg rounded-xl shadow-lg">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask CaballoLoko about training strategies..."
                className="input input-bordered flex-grow mr-2 bg-base-200"
                disabled={isLoading || isTraining}
              />
              <button 
                onClick={handleSend} 
                disabled={isLoading || isTraining} 
                className="btn btn-primary group relative overflow-hidden"
              >
                <span className="relative z-10">
                  {isLoading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    'Send'
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default RLGameInteractions;