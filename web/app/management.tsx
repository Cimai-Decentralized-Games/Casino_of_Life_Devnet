import { useState, useEffect } from 'react';
import Gun from 'gun';
import { toast } from 'react-toastify';

// The Gun peer URL
const GUN_PEER_URL = 'http://localhost:8765/gun';

// The backend API URL
const API_URL = 'http://localhost:6001';

// Initialize Gun with the peer URL
const gun = Gun(GUN_PEER_URL);

export default function Management() {
  const [roms, setRoms] = useState<string[]>([]);
  const [saveStates, setSaveStates] = useState<{[key: string]: any}>({});
  const [config, setConfig] = useState<any>({});
  const [performance, setPerformance] = useState<any>({});
  const [gameIntervals, setGameIntervals] = useState<any>({});
  const [ownerDecisions, setOwnerDecisions] = useState<any>({});
  const [currentFight, setCurrentFight] = useState<any>(null);

  useEffect(() => {
    // Fetch ROMs
    gun.get('roms').on((data: any) => {
      if (data) {
        setRoms(Object.keys(data).filter(key => key !== '_'));
      }
    });

    // Fetch save states
    gun.get('saveStates').on((data: any) => {
      if (data) {
        setSaveStates(data);
      }
    });

    // Fetch config
    gun.get('config').on((data: any) => {
      if (data) {
        setConfig(data);
      }
    });

    // Fetch performance data
    gun.get('gamePerformance').on((data: any) => {
      if (data) {
        setPerformance(data);
      }
    });

    // Fetch game intervals
    gun.get('gameIntervals').on((data: any) => {
      if (data) {
        setGameIntervals(data);
      }
    });

    // Fetch owner decisions
    gun.get('ownerDecisions').on((data: any) => {
      if (data) {
        setOwnerDecisions(data);
      }
    });

    // Listen for current fight updates
    gun.get('currentFight').on((data: any) => {
      if (data) {
        setCurrentFight(data);
      }
    });

    // Listen for notifications
    gun.get('notifications').on((data: any) => {
      if (data) {
        toast(data.message, { type: data.type });
      }
    });
  }, []);

  const uploadRom = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        gun.get('roms').get(file.name).put(content);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const updateConfig = (key: string, value: string) => {
    gun.get('config').get(key).put(value);
  };

  const distributeTokens = async (agentId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/distribute-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      });
      const data = await response.json();
      toast.success(data.message);
    } catch (error) {
      toast.error('Failed to distribute tokens');
    }
  };

  const burnTokens = async (agentId: string) => {
    const amount = prompt('Enter amount of tokens to burn:');
    if (!amount) return;
    try {
      const response = await fetch(`${API_URL}/api/burn-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, amount: Number(amount) })
      });
      const data = await response.json();
      toast.success(data.message);
    } catch (error) {
      toast.error('Failed to burn tokens');
    }
  };

  const startGame = async (gameId: string) => {
    const initialState = { gameId, timestamp: Date.now() };
    gun.get('commands').get('startGame').put({ gameId, initialState });
    toast.info('Start game command sent');
  };

  const getCurrentFight = async () => {
    gun.get('commands').get('getCurrentFight').put(true);
    toast.info('Fetching current fight');
  };

  const stopGame = async () => {
    gun.get('commands').get('stopGame').put(true);
    toast.info('Stop game command sent');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Management Console</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">ROMs</h2>
        <input type="file" onChange={uploadRom} className="mb-2" />
        <ul>
          {roms.map(rom => (
            <li key={rom}>{rom}</li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Save States</h2>
        <ul>
          {Object.entries(saveStates).map(([gameId, state]) => (
            <li key={gameId}>
              {gameId}: {JSON.stringify(state)}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Configuration</h2>
        {Object.entries(config).map(([key, value]) => (
          <div key={key} className="mb-2">
            <label className="mr-2">{key}:</label>
            <input 
              type="text" 
              value={value as string} 
              onChange={(e) => updateConfig(key, e.target.value)}
              className="border p-1"
            />
          </div>
        ))}
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Game Performance</h2>
        <ul>
          {Object.entries(performance).map(([agentId, data]) => (
            <li key={agentId}>
              {agentId}: {JSON.stringify(data)}
              <button onClick={() => distributeTokens(agentId)} className="ml-2 bg-blue-500 text-white px-2 py-1 rounded">
                Distribute Tokens
              </button>
              <button onClick={() => burnTokens(agentId)} className="ml-2 bg-red-500 text-white px-2 py-1 rounded">
                Burn Tokens
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Game Intervals</h2>
        <ul>
          {Object.entries(gameIntervals).map(([gameId, interval]) => (
            <li key={gameId}>{gameId}: {JSON.stringify(interval)}</li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Owner Decisions</h2>
        <ul>
          {Object.entries(ownerDecisions).map(([gameId, decision]) => (
            <li key={gameId}>{gameId}: {JSON.stringify(decision)}</li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Current Fight</h2>
        {currentFight ? (
          <pre>{JSON.stringify(currentFight, null, 2)}</pre>
        ) : (
          <p>No active fight</p>
        )}
      </section>

      <button onClick={() => startGame('MortalKombatII')} className="bg-green-500 text-white px-2 py-1 rounded">
        Start New Fight
      </button>
      <button onClick={getCurrentFight} className="bg-blue-500 text-white px-2 py-1 rounded ml-2">
        Get Current Fight
      </button>
      <button onClick={stopGame} className="bg-red-500 text-white px-2 py-1 rounded ml-2">
        Stop Game
      </button>
    </div>
  );
}
