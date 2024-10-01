import { spawn } from 'child_process';
import { port } from './backendServer.mjs';
import Gun from 'gun';

class FightProcessManager {
  constructor() {
    this.gun = Gun({ peers: ['http://localhost:8765/gun'] });
  }

  async initializeFightForBetting(fightId, secureId) {
    console.log(`Initializing fight for betting: Fight ID: ${fightId}, Secure ID: ${secureId}`);
    
    // Update Gun with initial fight state
    await new Promise((resolve, reject) => {
      this.gun.get('fightStatus').get(fightId).put({
        id: fightId,
        secureId: secureId,
        status: 'betting_open',
        bets: {
          player1: 0,
          player2: 0
        }
      }, ack => {
        if (ack.err) reject(ack.err);
        else resolve();
      });
    });
  
    return true;
  }

  async placeBet(fightId, player, amount) {
    console.log(`Placing bet for Fight ID: ${fightId}, Player: ${player}, Amount: ${amount}`);
    
    return new Promise((resolve, reject) => {
      this.gun.get('fightStatus').get(fightId).get('bets').get(player).once((currentBet) => {
        const newBet = (currentBet || 0) + amount;
        this.gun.get('fightStatus').get(fightId).get('bets').get(player).put(newBet, (ack) => {
          if (ack.err) reject(ack.err);
          else resolve(true);
        });
      });
    });
  }

  async startFightAfterBetting(fightId, secureId) {
    console.log(`Starting fight after betting: Fight ID: ${fightId}, Secure ID: ${secureId}`);
    
    const hostUrl = `http://host.docker.internal:${port}`;
    
    // Construct the command to run inside the Docker container
    const command = `docker exec -i mk2_container_v6 /bin/bash -c "export HOST_URL=${hostUrl} && source /opt/conda/etc/profile.d/conda.sh && conda activate retro_env && python /app/custom_scripts/run_fight_and_stream.py --env MortalKombatII-Genesis --state Level1.LiuKangVsJax.2P.state --load_p1_model /app/models/LiuKang.pt --load_p2_model /app/models/LiuKang.pt --num_round 3 --fight_id ${fightId} --secure_id ${secureId}"`;
  
    console.log('Executing fight command:', command);
  
    const fightProcess = spawn('sh', ['-c', command]);
  
    fightProcess.stdout.on('data', (data) => {
      console.log(`Fight process output: ${data}`);
      this.updateFightState(fightId, data.toString());
    });
  
    fightProcess.stderr.on('data', (data) => {
      console.error(`Fight process error: ${data}`);
    });
  
    fightProcess.on('close', (code) => {
      console.log(`Fight process exited with code ${code}`);
      this.updateFightStatus(fightId, 'finished');
    });
  
    this.updateFightStatus(fightId, 'active');
    return true;
  }

  async updateFightStatus(fightId, status) {
    console.log(`Updating fight status: Fight ID: ${fightId}, Status: ${status}`);
    return new Promise((resolve, reject) => {
      this.gun.get('fightStatus').get(fightId).put({ status }, (ack) => {
        if (ack.err) reject(new Error(ack.err));
        else resolve(true);
      });
    });
  }

  async updateFightState(fightId, data) {
    const match = data.match(/Round: (\d+), P1 Health: (\d+), P2 Health: (\d+)/);
    if (match) {
      const [, round, p1Health, p2Health] = match;
      const currentState = {
        round: parseInt(round),
        p1_health: parseInt(p1Health),
        p2_health: parseInt(p2Health),
        timestamp: Date.now()
      };
      console.log(`Updating fight state: Fight ID: ${fightId}`, currentState);
      return new Promise((resolve, reject) => {
        this.gun.get('fightStatus').get(fightId).put({ currentState }, (ack) => {
          if (ack.err) reject(new Error(ack.err));
          else resolve(true);
        });
      });
    }
  }
}

export const fightProcessManager = new FightProcessManager();