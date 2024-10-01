import express from 'express';
import Gun from 'gun';
import cors from 'cors';
import { fightProcessManager } from './fightProcess.mjs';
import { FightManager } from '../../../../components/betting/services/fight-manager';

const app = express();
const port = process.env.BACKEND_PORT || 6001;
const fightProcessUrl = `http://localhost:${port}`;

app.use(cors());
app.use(express.json());
app.use(Gun.serve);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

let server = null;
let fightManagerInstance = null;

function startServer() {
  if (server) {
    console.log('Server is already running');
    return;
  }

  server = app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
    console.log(`Server details: ${JSON.stringify(server.address())}`);
  });

  server.on('error', (e) => {
    console.error(`Server error: ${e.message}`);
  });

  Gun({ web: server });
}

const gun = Gun({
  peers: ['http://localhost:8765/gun'],
  file: 'data.json',
});

gun.on('hi', peer => {
  console.log('Peer connected', peer);
});

gun.on('error', function(error) {
  console.error('Gun encountered an error:', error);
});

async function getFightManager() {
  if (!fightManagerInstance) {
    console.log('Fight manager not initialized, initializing now...');
    fightManagerInstance = new FightManager(gun);
  }
  return fightManagerInstance;
}

app.route('/api/fight/update')
  .get(async (req, res) => {
    try {
      const fightManager = await getFightManager();
      const activeFight = await fightManager.getActiveFight();
      if (!activeFight) {
        return res.status(404).json({ message: 'No active fight found' });
      }
      res.json(activeFight);
    } catch (error) {
      console.error('Error in GET /api/fight/update:', error);
      res.status(500).json({ message: 'Failed to fetch fight state', error: error.message });
    }
  })
  .post(async (req, res) => {
    try {
      const { fightId, secureId, status, currentState } = req.body;
      if (!fightId || !secureId || !status) {
        return res.status(400).json({ message: 'Missing required fields in request body' });
      }
      const fightManager = await getFightManager();
      await fightManager.updateFightStatus(fightId, secureId, status, currentState);
      res.json({ message: 'Fight state updated', currentState, status });
    } catch (error) {
      console.error('Error in POST /api/fight/update:', error);
      res.status(500).json({ message: 'Failed to update fight state', error: error.message });
    }
  });

app.post('/api/betting/place-bet', async (req, res) => {
  const { fightId, player, amount } = req.body;
  console.log(`Received bet: Fight ID: ${fightId}, Player: ${player}, Amount: ${amount}`);
  try {
    await fightProcessManager.placeBet(fightId, player, amount);
    res.json({ success: true, message: 'Bet placed successfully' });
  } catch (error) {
    console.error('Error placing bet:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function initializeGunListeners() {
  gun.get('commands').get('startFight').on((data, key) => {
    if (data && data.fightId && !data._) {
      console.log('Received command to start fight:', data);
      fightProcessManager.startFightAfterBetting(data.fightId)
        .then(fightStarted => {
          console.log('Fight process started:', fightStarted);
          if (fightStarted) {
            gun.get('fightStatus').get(data.fightId).put({
              status: 'active',
              currentState: {
                round: 1,
                p1_health: 100,
                p2_health: 100,
                timestamp: Date.now()
              }
            });
          } else {
            throw new Error('Failed to start fight process');
          }
        })
        .catch(error => {
          console.error('Error starting fight process:', error);
          gun.get('fightStatus').get(data.fightId).put({
            status: 'failed',
            error: error.message
          });
        });
    }
  });

  gun.get('commands').get('fightStatus').on((data, key) => {
    if (data && data.fightId && data.status && !data._) {
      console.log('Received command to update fight status:', data);
      getFightManager().then(fightManager => {
        fightManager.updateFightStatus(data.fightId, data.secureId, data.status, data.currentState)
          .then(() => {
            console.log('Fight status updated:', data);
          })
          .catch(error => {
            console.error('Error updating fight status:', error);
            gun.get('fightStatus').get(data.fightId).put({
              status: 'failed',
              error: error.message
            });
          });
      }).catch(error => {
        console.error('Error getting fight manager:', error);
      });
    }
  });
}

initializeGunListeners();

app.use((req, res) => {
  console.log(`Unhandled ${req.method} request to ${req.url}`);
  res.status(404).send('Not Found');
});

startServer();

export { app, gun, startServer, port, fightProcessUrl, getFightManager, initializeGunListeners };