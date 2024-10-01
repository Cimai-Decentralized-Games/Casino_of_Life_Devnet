import { createHash, randomBytes } from 'crypto';

export interface Fight {
  id: string;
  secureId: string;
  timestamp: number;
  status: 'betting_open' | 'active' | 'finished' | 'failed';
  bets: {
    player1: number;
    player2: number;
  };
  currentState?: {
    round: number;
    p1_health: number;
    p2_health: number;
    timestamp: number;
  };
  streamUrl?: string;
  winner?: string;
}

export class FightManager {
  private gun: any;

  constructor(gun: any) {
    if (!gun) {
      throw new Error('Gun instance is required');
    }
    this.gun = gun;
  }

  private generateFightId(): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    return `${timestamp}-${randomString}`;
  }

  private generateSecureFightId(): string {
    const timestamp = BigInt(Date.now());
    const randomNumber = BigInt(randomBytes(4).readUInt32LE());
    const secureFightId = (timestamp << 16n) | (randomNumber & 0xFFFFn);
    return secureFightId.toString();
  }

  async createNewFight(): Promise<Fight> {
    const fightId = this.generateFightId();
    const secureId = this.generateSecureFightId();
    
    const newFight: Fight = {
      id: fightId,
      secureId: secureId,
      status: 'betting_open',
      timestamp: Date.now(),
      bets: {
        player1: 0,
        player2: 0
      }
    };

    await this.updateFightDetails(fightId, secureId, newFight);
    return newFight;
  }

  async updateFightDetails(fightId: string, secureId: string, updateData: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gun.get('fightStatus').get(fightId).put(updateData, (ack: unknown) => {
        if (typeof ack === 'object' && ack !== null) {
          const acknowledgment = ack as { err?: string; ok?: boolean };
          if (acknowledgment.err || acknowledgment.ok === false) {
            reject(new Error(`Failed to update fight details: ${acknowledgment.err || 'Unknown error'}`));
          } else {
            resolve();
          }
        } else {
          reject(new Error('Received invalid acknowledgment from Gun'));
        }
      });
    });
  }
  
  async getFightStatus(fightId: string): Promise<Fight | null> {
    if (!this.gun) {
      throw new Error('Gun instance is not initialized');
    }

    return new Promise((resolve, reject) => {
      this.gun.get('fightStatus').get(fightId).once((fightData: any, key: string) => {
        if (fightData === undefined || fightData === null) {
          console.log(`No fight data found for ID: ${fightId}`);
          resolve(null);
        } else {
          try {
            const fight: Fight = {
              id: fightId,
              secureId: fightData.secureId,
              status: fightData.status,
              timestamp: fightData.timestamp,
              bets: fightData.bets || { player1: 0, player2: 0 },
              currentState: fightData.currentState || null,
              streamUrl: fightData.streamUrl || null,
              winner: fightData.winner || null
            };
            resolve(fight);
          } catch (error) {
            console.error(`Error parsing fight data for ID ${fightId}:`, error);
            reject(error);
          }
        }
      });
    });
  }

  async getActiveFight(): Promise<Fight | null> {
    return new Promise((resolve) => {
      this.gun.get('fightStatus').once((fights: Record<string, any>) => {
        if (!fights) {
          resolve(null);
          return;
        }
        const activeFight = Object.entries(fights).find(([id, fight]) => 
          fight && (fight.status === 'betting_open' || fight.status === 'active')
        );
        if (activeFight) {
          const [id, fight] = activeFight;
          resolve({
            id,
            secureId: fight.secureId,
            status: fight.status,
            timestamp: fight.timestamp,
            bets: fight.bets || { player1: 0, player2: 0 },
            currentState: fight.currentState || null,
            streamUrl: fight.streamUrl || null,
            winner: fight.winner || null
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async placeBet(fightId: string, player: 'player1' | 'player2', amount: number): Promise<void> {
    try {
      const fight = await this.getFightStatus(fightId);
      if (!fight) {
        throw new Error('Fight not found');
      }
  
      return new Promise((resolve, reject) => {
        this.gun.get('fightStatus').get(fightId).get('bets').get(player).once((currentBet: number) => {
          const newBet = (currentBet || 0) + amount;
          this.gun.get('fightStatus').get(fightId).get('bets').get(player).put(newBet, (ack: unknown) => {
            if (typeof ack === 'object' && ack !== null) {
              const acknowledgment = ack as { err?: string; ok?: boolean };
              if (acknowledgment.err || acknowledgment.ok === false) {
                reject(new Error(`Failed to place bet: ${acknowledgment.err || 'Unknown error'}`));
              } else {
                resolve();
              }
            } else {
              reject(new Error('Received invalid acknowledgment from Gun'));
            }
          });
        });
      });
    } catch (error) {
      console.error('Error in placeBet:', error);
      throw error;
    }
  }

  async updateFightStatus(fightId: string, secureId: string, status: Fight['status'], currentState: Fight['currentState']): Promise<void> {
    const fight = await this.getFightStatus(fightId);
    if (!fight || fight.secureId !== secureId) {
      throw new Error('Invalid fight ID or secure ID');
    }
  
    const updatedFight: Fight = {
      ...fight,
      status,
      currentState: currentState || fight.currentState,
      timestamp: Date.now()
    };
  
    return new Promise((resolve, reject) => {
      this.gun.get('fightStatus').get(fightId).put(updatedFight, (ack: unknown) => {
        if (typeof ack === 'object' && ack !== null) {
          const acknowledgment = ack as { err?: string; ok?: boolean };
          if (acknowledgment.err || acknowledgment.ok === false) {
            reject(new Error(`Failed to update fight details: ${acknowledgment.err || 'Unknown error'}`));
          } else {
            resolve();
          }
        } else {
          reject(new Error('Received invalid acknowledgment from Gun'));
        }
      });
    });
  }
}
export default FightManager;