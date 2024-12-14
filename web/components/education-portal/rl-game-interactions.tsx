import React, { useState, useEffect, useRef } from "react";
import { FaPlay, FaPause, FaRobot, FaInfoCircle, FaUserAlt, FaGamepad, FaCubes, FaClock } from 'react-icons/fa';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useSolana } from '../betting/services/useSolana';
import { BETTING_PROGRAM_ID } from '@casino-of-life-dashboard/anchor';

interface RLGameInteractionProps {
  game: "Mortal Kombat II";
  onModelTrained?: (modelFile: File, modelData: any) => void;
}

export const RLGameInteraction: React.FC<RLGameInteractionProps> = ({ game, onModelTrained }) => {
  // Training states
  const [numEnv, setNumEnv] = useState<number>(4);
  const [numTimesteps, setNumTimesteps] = useState<number>(1000000);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("LiuKang");
  const [selectedState, setSelectedState] = useState<string>("Level1.LiuKangVsJax.state");
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [modelPaths, setModelPaths] = useState<{torch: string | null, onnx: string | null}>({
    torch: null, 
    onnx: null
  });
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Character and state options
  const characters = ["LiuKang", "Jax", "SubZero", "Baraka", "Rayden"];
  const states = [
    "Level1.JaxVsLiuKang.state",
    "Level1.JaxVsBaraka.state",
    "Level1.LiuKangVsJax.state",
    "Level1.SubZeroVsRyden.state"
  ];

  // Solana integration
  const wallet = useWallet();
  const { connection } = useConnection();
  const { 
    solBalance, 
    dumbsBalance, 
    depositAmount, 
    setDepositAmount,
    isLoading,
    handleDeposit 
  } = useSolana();

  // Calculate training cost based on parameters
  const calculateTrainingCost = (timesteps: number, envCount: number): number => {
    const baseStepCost = 0.001; // DUMBS per timestep
    const envMultiplier = 1.5; // Cost multiplier per environment
    return (timesteps * baseStepCost) * (envCount * envMultiplier);
  };

  const [trainingCost, setTrainingCost] = useState<number>(0);
  const [canTrain, setCanTrain] = useState<boolean>(false);

  // Update training cost and check if user can train
  useEffect(() => {
    const cost = calculateTrainingCost(numTimesteps, numEnv);
    setTrainingCost(cost);
    setCanTrain(dumbsBalance !== null && dumbsBalance >= cost);
  }, [numTimesteps, numEnv, dumbsBalance]);

  const startTraining = async () => {
    if (!wallet.publicKey || !canTrain) {
      console.log('Training blocked:', { hasWallet: !!wallet.publicKey, canTrain });
      return;
    }

    try {
      console.log('Starting training with params:', {
        character: selectedCharacter,
        state: selectedState,
        numTimesteps,
        numEnv,
        wallet: wallet.publicKey.toString()
      });

      setIsTraining(true);
      setTrainingProgress(0);
      setTrainingLogs([]);

      // Start training and get training ID
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: selectedCharacter,
          state: selectedState,
          num_timesteps: numTimesteps,
          num_env: numEnv,
          wallet: wallet.publicKey.toString()
        })
      });

      if (!response.ok) {
        throw new Error('Training failed to start');
      }

      const result = await response.json();
      
      if (!result.success || !result.trainingId) {
        throw new Error('Training failed to initialize');
      }

      // Start polling for training progress using training ID
      const pollInterval = setInterval(async () => {
        try {
          const progressResponse = await fetch(
            `https://cimai.biz/training-status.php?character=${selectedCharacter}&state=${selectedState}&trainingId=${result.trainingId}`
          );

          if (!progressResponse.ok) {
            throw new Error(`HTTP error! status: ${progressResponse.status}`);
          }

          const progressData = await progressResponse.json();

          if (progressData.status === 'error') {
            clearInterval(pollInterval);
            setIsTraining(false);
            console.error('Training error occurred');
            return;
          }

          setTrainingProgress(progressData.progress || 0);
          if (progressData.latestStep) {
            setTrainingLogs(prev => [...prev, progressData.latestStep]);
          }

          if (progressData.modelPaths) {
            setModelPaths(progressData.modelPaths);
          }

          // Training complete
          if (progressData.status === 'complete') {
            clearInterval(pollInterval);
            setIsTraining(false);
          }
        } catch (error) {
          console.error('Error checking training status:', error);
        }
      }, 60000); // Poll every 60 seconds

    } catch (error) {
      console.error("Error in training process:", error);
      setIsTraining(false);
    }
  };

  const startPlaying = async () => {
    if (!modelPaths.onnx) {
      console.error("ONNX model path is not available");
      return;
    }

    setIsPlaying(true);
    try {
      const response = await fetch('/api/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: selectedCharacter,
          state: selectedState,
          load_model: modelPaths.onnx,
          play: true,
          stream: true
        }),
      });

      const data = await response.json();
      if (data.success) {
        setStreamUrl(data.streamUrl);
      } else {
        console.error("Error starting playback:", data.error);
      }
    } catch (error) {
      console.error("Error playing agent:", error);
    }
  };

  useEffect(() => {
    if (streamUrl) {
      const eventSource = new EventSource(streamUrl);
      eventSource.onmessage = (event) => {
        const imgElement = new Image();
        imgElement.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && ctx) {
            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
          }
        };
        imgElement.src = event.data;
      };
      return () => eventSource.close();
    }
  }, [streamUrl]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Wallet and Balance Section */}
      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <h3 className="text-2xl font-semibold mb-4 flex items-center">
          <FaRobot className="mr-2" /> Training Resources
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p>SOL Balance: {solBalance !== null ? `${solBalance} SOL` : 'Connect wallet'}</p>
              <p>DUMBS Balance: {dumbsBalance !== null ? `${dumbsBalance} DUMBS` : 'Connect wallet'}</p>
              <p>Training Cost: {trainingCost} DUMBS</p>
            </div>
            {wallet.publicKey && (
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="input input-bordered w-24"
                  min="0.1"
                  step="0.1"
                  placeholder="SOL"
                />
                <button 
                  className="btn btn-primary"
                  onClick={handleDeposit}
                  disabled={isLoading || !depositAmount}
                >
                  {isLoading ? "Processing..." : "Deposit SOL"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Training Parameters */}
      <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8">
        <h3 className="text-2xl font-semibold mb-4">Training Parameters</h3>
        <div className="space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Character</span>
            </label>
            <select 
              value={selectedCharacter}
              onChange={(e) => setSelectedCharacter(e.target.value)}
              className="select select-bordered w-full"
            >
              {characters.map(char => (
                <option key={char} value={char}>{char}</option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Game State</span>
            </label>
            <select 
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="select select-bordered w-full"
            >
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Number of Environments: {numEnv}</span>
            </label>
            <input
              type="range"
              min="1"
              max="16"
              value={numEnv}
              onChange={(e) => setNumEnv(Number(e.target.value))}
              className="range range-primary"
            />
            <div className="text-sm text-gray-500 mt-1">
              More environments = faster training but higher cost
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Number of Timesteps: {numTimesteps.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min="100000"
              max="10000000"
              step="100000"
              value={numTimesteps}
              onChange={(e) => setNumTimesteps(Number(e.target.value))}
              className="range range-primary"
            />
            <div className="text-sm text-gray-500 mt-1">
              More timesteps = better training but higher cost
            </div>
          </div>
        </div>
      </div>

      {/* Training Button */}
      <button 
        className="btn btn-primary w-full mt-6"
        onClick={startTraining}
        disabled={isLoading || !canTrain || isTraining || !wallet.publicKey}
      >
        {!wallet.publicKey ? "Connect Wallet" :
         !canTrain ? "Insufficient DUMBS Balance" :
         isTraining ? "Training..." : 
         "Start Training"}
      </button>

      {/* Play Button */}
      <button 
        className="btn btn-secondary w-full mt-6"
        onClick={startPlaying}
        disabled={isPlaying || !modelPaths.onnx}
      >
        {isPlaying ? "Playing..." : "Start Playing"}
      </button>

      {/* Training Progress */}
      {isTraining && (
        <div className="mt-6 bg-base-200 p-6 rounded-lg shadow-lg">
          <h4 className="text-xl font-semibold mb-4">Training Progress</h4>
          <progress 
            className="progress progress-primary w-full" 
            value={trainingProgress} 
            max="100"
          />
          <div className="mt-4 h-48 overflow-y-auto">
            {trainingLogs.map((log, index) => (
              <p key={index} className="text-sm">{log}</p>
            ))}
          </div>
        </div>
      )}

      {/* Canvas for Streaming */}
      <div className="mt-6">
        <canvas 
          ref={canvasRef} 
          className="w-full h-64 bg-black rounded-lg"
          width={320}
          height={240}
        />
      </div>

      {/* How It Works Section */}
      <div className="mt-12 bg-base-200 p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 flex items-center">
          <FaInfoCircle className="mr-2" /> How It Works
        </h3>
        <p className="mb-4">
          This system uses Stable-Retro to create a reinforcement learning environment for {game}.
          The agent is trained using the PPO algorithm from Stable-Baselines3.
        </p>
        <ul className="space-y-2">
          <li className="flex items-center"><FaUserAlt className="mr-2" /> Character: Choose your agent&apos;s character.</li>
          <li className="flex items-center"><FaGamepad className="mr-2" /> Game State: Select the initial training state.</li>
          <li className="flex items-center"><FaCubes className="mr-2" /> Environments: More environments = faster training.</li>
          <li className="flex items-center"><FaClock className="mr-2" /> Timesteps: More timesteps = better performance.</li>
          <li className="flex items-center"><FaRobot className="mr-2" /> Mint your trained agent as an NFT to use in battles!</li>
        </ul>
      </div>
    </div>
  );
};

export default RLGameInteraction;
