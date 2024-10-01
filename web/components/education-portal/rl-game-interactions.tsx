import React, { useState, useRef, useEffect } from "react";
import { FaPlay, FaPause, FaRobot, FaInfoCircle, FaUserAlt, FaGamepad, FaCubes, FaClock } from 'react-icons/fa';

interface RLGameInteractionProps {
  game: "Mortal Kombat II";
}

const RLGameInteraction: React.FC<RLGameInteractionProps> = ({ game }) => {
  const [numEnv, setNumEnv] = useState<number>(4);
  const [numTimesteps, setNumTimesteps] = useState<number>(1000000);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [modelPath, setModelPath] = useState<string>("");
  const [streamUrl, setStreamUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);

  const [selectedCharacter, setSelectedCharacter] = useState<string>("LiuKang");
  const [selectedState, setSelectedState] = useState<string>("Level1.LiuKangVsJax.state");

  const characters = ["LiuKang", "Jax", "SubZero", "Baraka", "Rayden"];
  const states = [
    "Level1.JaxVsLiuKang.state",
    "Level1.JaxVsBaraka.state",
    "Level1.LiuKangVsJax.state",
    "Level1.SubZeroVsRyden.state"
  ];

  const startTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingLogs([]);
    try {
      const response = await fetch('/api/playing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env: 'MortalKombatII-Genesis',
          state: selectedState,
          num_env: numEnv,
          num_timesteps: numTimesteps,
          output_basedir: `/app/models/${selectedCharacter}`,
          play: false,
          record: true,
          stream: true
        }),
      });

      const reader = response.body?.getReader();
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        const lines = text.split('\n');
        lines.forEach(line => {
          if (line.startsWith('PROGRESS:')) {
            setTrainingProgress(parseInt(line.split(':')[1]));
          } else if (line.trim()) {
            setTrainingLogs(prev => [...prev, line]);
          }
        });
      }
    } catch (error) {
      console.error("Error training agent:", error);
    }
    setIsTraining(false);
  };

  const startPlaying = async () => {
    setIsPlaying(true);
    try {
      const response = await fetch('/api/playing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env: 'MortalKombatII-Genesis',
          state: selectedState,
          load_model: `/app/models/${selectedCharacter}/model.zip`,
          play: true,
          stream: true
        }),
      });
      setStreamUrl(response.url);
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
      <h2 className="text-4xl font-bold mb-8 text-center">{game} Casino of Life Learning Arena</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-base-200 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold mb-6 flex items-center">
            <FaRobot className="mr-2" /> Train Your Agent
          </h3>
          
          <div className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Character:</span>
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
                <span className="label-text font-medium">Game State:</span>
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
                <span className="label-text font-medium">Number of Environments: {numEnv}</span>
              </label>
              <input
                type="range"
                min="1"
                max="16"
                value={numEnv}
                onChange={(e) => setNumEnv(parseInt(e.target.value))}
                className="range range-primary"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Number of Timesteps: {numTimesteps.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min="1000"
                max="10000000"
                step="10000"
                value={numTimesteps}
                onChange={(e) => setNumTimesteps(parseInt(e.target.value))}
                className="range range-primary"
              />
            </div>
          </div>

          <button 
            className="btn btn-primary w-full mt-6"
            onClick={startTraining} 
            disabled={isTraining}
          >
            {isTraining ? "Training..." : "Start Training"}
          </button>

          {isTraining && (
            <div className="mt-6">
              <progress className="progress progress-primary w-full" value={trainingProgress} max="100"></progress>
              <p className="mt-2 text-center">Training Progress: {trainingProgress}%</p>
            </div>
          )}

          <div className="mt-6 bg-base-300 p-4 rounded-lg h-40 overflow-y-auto">
            {trainingLogs.map((log, index) => (
              <p key={index} className="text-sm">{log}</p>
            ))}
          </div>
        </div>

        <div className="bg-base-200 p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-semibold mb-6 flex items-center">
            <FaGamepad className="mr-2" /> Watch Your Agent Play
          </h3>
          
          <button 
            className="btn btn-secondary w-full"
            onClick={startPlaying} 
            disabled={isPlaying || !modelPath}
          >
            {isPlaying ? <FaPause className="mr-2" /> : <FaPlay className="mr-2" />} 
            {isPlaying ? "Stop" : "Play Trained Agent"}
          </button>

          <div className="mt-6">
            <canvas ref={canvasRef} width="640" height="480" className="w-full rounded-lg shadow-inner" />
          </div>
        </div>
      </div>

      <div className="mt-12 bg-base-200 p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold mb-4 flex items-center">
          <FaInfoCircle className="mr-2" /> How It Works
        </h3>
        <p className="mb-4">
          This system uses Stable-Retro, a fork of Gym Retro, to create a reinforcement learning environment for {game}.
          The agent is trained using the PPO (Proximal Policy Optimization) algorithm from Stable-Baselines3.
        </p>
        <ul className="space-y-2">
          <li className="flex items-center"><FaUserAlt className="mr-2" /> Character: Choose the character you want your agent to play as.</li>
          <li className="flex items-center"><FaGamepad className="mr-2" /> Game State: Select the initial state of the game for training.</li>
          <li className="flex items-center"><FaCubes className="mr-2" /> Number of Environments: More environments can speed up training but require more computational resources.</li>
          <li className="flex items-center"><FaClock className="mr-2" /> Number of Timesteps: More timesteps generally lead to better performance but take longer to train.</li>
          <li className="flex items-center"><FaRobot className="mr-2" /> The trained agent can be used in the Casino of Life to compete against other agents!</li>
        </ul>
      </div>
    </div>
  );
};

export default RLGameInteraction;