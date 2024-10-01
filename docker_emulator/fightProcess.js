const { spawn } = require('child_process');
const fetch = require('node-fetch');
const Gun = require('gun');

class FightProcessManager {
  constructor() {
    this.currentFight = null;
    this.fightProcess = null;
    this.gun = Gun('http://localhost:8765/gun');
  }

  startFight(fightId, initialState) {
    console.log(`Loading fight: ${fightId}`);
    this.currentFight = fightId;
    
    //  conda environment is named 'retro_env'
    this.fightProcess = spawn('bash', [
      '-c',
      `source /opt/conda/etc/profile.d/conda.sh && \
       conda activate retro_env && \
       python /app/custom_scripts/run_fight_and_stream.py \
       --fight ${fightId} \
       --state Level1 \
       --initial_state '${JSON.stringify(initialState)}'`
    ]);

    this.fightProcess.stdout.on('data', (data) => {
      console.log(`Fight output: ${data}`);
      this.gun.get('fightOutput').set(data.toString());
    });

    this.fightProcess.stderr.on('data', (data) => {
      console.error(`Fight error: ${data}`);
    });

    this.fightProcess.on('close', (code) => {
      console.log(`Fight process exited with code ${code}`);
      this.currentFight = null;
      this.fightProcess = null;
    });

    return true;
  }

  startFightViaAPI(initialState) {
    // Make an API call to your backend server to start the fight
    fetch('http://localhost:6001/api/start-fight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initialState })
    })
    .then(response => response.json())
    .then(data => console.log('Fight started:', data))
    .catch(error => console.error('Error starting fight:', error));
  }

  stopFight() {
    if (this.fightProcess) {
      console.log('Stopping current fight');
      
      // Make an API call to your backend server to stop the fight
      fetch('http://localhost:6001/api/stop-fight', { method: 'POST' })
        .then(response => response.json())
        .then(data => console.log('Fight stopped:', data))
        .catch(error => console.error('Error stopping fight:', error));

      this.fightProcess.kill();
      this.currentFight = null;
      this.fightProcess = null;
      this.gun.get('fightStatus').put({ status: 'stopped' });
      return true;
    }
    return false;
  }

  isFightRunning() {
    const running = this.fightProcess !== null;
    this.gun.get('fightStatus').put({ isRunning: running });
    return running;
  }
}

exports.fightProcessManager = new FightProcessManager();