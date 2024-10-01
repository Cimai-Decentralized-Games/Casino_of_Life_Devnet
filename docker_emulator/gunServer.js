const express = require('express');
const Gun = require('gun');
const { fightProcessManager } = require('./fightProcess');
const { fightManager } = require('./fightManager');
const app = express();
const port = process.env.GUN_PORT || 8765;

app.use(Gun.serve);

let server;
let gun;

function startServer() {
  return new Promise((resolve, reject) => {
    server = app.listen(port, () => {
      console.log(`Gun server running on port ${port}`);
      resolve();
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Retrying in 5 seconds...`);
        setTimeout(() => {
          server.close();
          server.listen(port);
        }, 5000);
      } else {
        reject(error);
      }
    });
  });
}

async function initializeGun() {
  try {
    await startServer();
    gun = Gun({ web: server, file: 'radata', radisk: false });
  } catch (error) {
    if (error.code === 'EEXIST') {
      console.warn('radata directory already exists, continuing...');
      gun = Gun({ web: server, file: 'radata', radisk: false });
    } else {
      console.error('Failed to initialize Gun:', error);
      process.exit(1);
    }
  }

  // Set up error handling for gun
  gun.on('error', (error) => {
    console.error('Gun error:', error);
  });

  setupGunListeners();
}

function setupGunListeners() {
  // Listen for fight start commands
  gun.get('commands').get('startFight').on((data) => {
    if (data && data.fightId && data.initialState) {
      console.log(`Starting fight for: ${data.fightId}`);
      try {
        // Start a new fight using fightManager
        const newFight = fightManager.startNewFight(data.initialState);
        console.log('New fight created:', newFight);

        // Save the new fight to Gun database
        gun.get('fights').get(newFight.id).put(newFight);

        // Start the fight process
        const fightStarted = fightProcessManager.startFight(newFight.id, newFight.secureId);

        // Notify about successful fight start
        gun.get('notifications').set({
          type: 'fightStart',
          message: `New fight started. Fight ID: ${newFight.id}. Fight process ${fightStarted ? 'started' : 'failed to start'}.`,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error starting fight:', error);
        // Notify about the error
        gun.get('notifications').set({
          type: 'error',
          message: `Failed to start fight: ${error.message}`,
          timestamp: Date.now()
        });
      }
    }
  });

  // Listen for stop fight commands
  gun.get('commands').get('stopFight').on(() => {
    console.log('Stop fight requested');
    const stopped = fightProcessManager.stopFight();
    gun.get('notifications').set({
      type: 'fightStop',
      message: stopped ? 'Fight stopped successfully' : 'No fight was running',
      timestamp: Date.now()
    });
  });

  // Listen for fight status requests
  gun.get('commands').get('fightStatus').on(() => {
    console.log('Fight status requested');
    const isRunning = fightProcessManager.isFightRunning();
    gun.get('fightStatus').put({ isRunning });
  });

  // Listen for ROM uploads
  gun.get('roms').on((data, key) => {
    if (data && key !== '_') {
      console.log(`New ROM uploaded: ${key}`);
      // Implement logic to handle new ROM
    }
  });

  // Listen for config updates
  gun.get('config').on((data, key) => {
    if (data) {
      console.log(`Config updated: ${key} = ${data}`);
      // Implement logic to handle config changes
    }
  });

  // Listen for token distribution commands
  gun.get('commands').get('distributeTokens').on((data) => {
    if (data) {
      console.log(`Distribute tokens to agent: ${data.agentId}`);
      // Implement token distribution logic
    }
  });

  // Listen for token burn commands
  gun.get('commands').get('burnTokens').on((data) => {
    if (data) {
      console.log(`Burn tokens for agent: ${data.agentId}, amount: ${data.amount}`);
      // Implement token burning logic
    }
  });

  // Listen for current fight requests
  gun.get('commands').get('getCurrentFight').on(() => {
    console.log('Get current fight requested');
    const currentFight = fightManager.getCurrentFight();
    if (currentFight) {
      gun.get('currentFight').put(currentFight);
    } else {
      gun.get('currentFight').put({ message: 'No active fight' });
    }
  });

  // Listen for close betting commands
  gun.get('commands').get('closeBetting').on(() => {
    console.log('Close betting requested');
    fightManager.closeBetting();
    const currentFight = fightManager.getCurrentFight();
    if (currentFight) {
      gun.get('fights').get(currentFight.id).put(currentFight);
    }
  });

  // Listen for update fight state commands
  gun.get('commands').get('updateFightState').on((newState) => {
    if (newState) {
      console.log('Update fight state requested');
      fightManager.updateFightState(newState);
      const currentFight = fightManager.getCurrentFight();
      if (currentFight) {
        gun.get('fights').get(currentFight.id).put(currentFight);
      }
    }
  });

  // Listen for set fight result commands
  gun.get('commands').get('setFightResult').on((result) => {
    if (result) {
      console.log(`Set fight result requested: ${result}`);
      fightManager.setFightResult(result);
      const currentFight = fightManager.getCurrentFight();
      if (currentFight) {
        gun.get('fights').get(currentFight.id).put(currentFight);
      }
    }
  });

  // Add a shutdown listener
  process.on('SIGINT', () => {
    console.log('Shutting down Gun server...');
    if (server) {
      server.close(() => {
        console.log('Gun server closed.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
}

initializeGun().catch((error) => {
  console.error('Failed to start Gun server:', error);
  process.exit(1);
});