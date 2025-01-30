import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

// Constants - separate domains for different purposes
const DROPLET_IP = process.env.DROPLET_IP || '157.230.72.195';
const DROPLET_PORT = process.env.DROPLET_PORT || 6001;
const apiDomain = process.env.API_DOMAIN || 'cimai.biz';

// Different URLs for different purposes
export const dropletUrl = `https://${DROPLET_IP}:${DROPLET_PORT}`; // For the fight process on the droplet
export const webServerUrl = `https://${apiDomain}`; // For the main website
export const streamUrl = 'https://stream.cimai.biz/hls'; // For the stream server

export interface Fight {
  fightid: string;
  secureId: string;
  timestamp: number;
  status: 'no_fight' | 'betting_open' | 'in_progress' | 'completed' | 'error';
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

export class FightProcessManager {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  private generateFightId(): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    return `${timestamp}-${randomString}`;
  }

  private generateSecureFightId(): string {
    const timestamp = BigInt(Date.now());
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    const randomNumber = BigInt(new DataView(randomBytes.buffer).getUint32(0));
    const secureFightId = (timestamp << 16n) | (randomNumber & 0xFFFFn);
    return secureFightId.toString();
  }

  private generateStreamUrl(fightId: string): string {
    return `https://stream.cimai.biz/hls/${fightId}/output.m3u8`;
  }

  async createNewFight(): Promise<Fight> {
    const fightId = this.generateFightId();
    const secureId = this.generateSecureFightId();
    
    const newFight = await this.prisma.fight.create({
      data: {
        fightid: fightId,
        secureId: secureId,
        timestamp: Math.floor(Date.now() / 1000),
        status: 'betting_open',
        bets: {
          player1: 0,
          player2: 0
        },
        currentState: {
          round: 0,
          p1_health: 120,
          p2_health: 120,
          timestamp: Math.floor(Date.now() / 1000)
        },
        streamUrl: null // Explicitly set to null initially
      }
    });

    return {
      fightid: newFight.fightid,
      secureId: newFight.secureId,
      timestamp: newFight.timestamp,
      status: newFight.status as Fight['status'],
      bets: newFight.bets as Fight['bets'],
      currentState: newFight.currentState as Fight['currentState'],
      streamUrl: undefined,
      winner: undefined
    };
  }

  async placeBet(fightId: string, player: 'player1' | 'player2', amount: number): Promise<void> {
    console.log('Placing bet:', { fightId, player, amount });
    
    const fight = await this.prisma.fight.findUnique({
      where: { fightid: fightId }
    });

    if (!fight) {
      console.error('Fight not found:', fightId);
      throw new Error('Fight not found');
    }
    
    if (fight.status !== 'betting_open') {
      console.error('Invalid fight status:', fight.status);
      throw new Error('Fight is not open for betting');
    }

    const currentBets = fight.bets as Fight['bets'];
    const updatedBets = {
      ...currentBets,
      [player]: (currentBets[player] || 0) + amount
    };

    // Update while maintaining all fight state
    await this.prisma.fight.update({
      where: { fightid: fightId },
      data: { 
        bets: updatedBets,
        status: 'betting_open' as const,  // Explicitly maintain status
        currentState: fight.currentState, // Maintain current state
        timestamp: fight.timestamp,       // Maintain timestamp
        streamUrl: fight.streamUrl       // Maintain stream URL if exists
      }
    });

    console.log('Updated fight bets:', { fightId, player, amount, updatedBets });
  }

  async startFightAfterBetting(fightId: string, secureId: string): Promise<{ success: boolean; fight?: Fight; streamUrl?: string; error?: string }> {
    console.log(`Starting fight after betting for ID: ${fightId}, secureId: ${secureId}`);

    try {
      // 1. IMMEDIATE: Update fight to active with stream URL
      const streamUrl = `https://stream.cimai.biz/hls/${fightId}/output.m3u8`;
      
      const updatedFight = await this.prisma.fight.update({
        where: { fightid: fightId },
        data: {
          status: 'in_progress',  
          streamUrl: streamUrl,
          timestamp: Math.floor(Date.now() / 1000)
        }
      });

      // 2. IMMEDIATE: Return the active state and URL
      const response: { success: boolean; fight: Fight; streamUrl: string } = {
        success: true,
        fight: {
          fightid: updatedFight.fightid,
          secureId: updatedFight.secureId,
          timestamp: updatedFight.timestamp,
          status: updatedFight.status as Fight['status'],
          bets: updatedFight.bets as Fight['bets'],
          currentState: updatedFight.currentState as Fight['currentState'],
          streamUrl: streamUrl,
          winner: updatedFight.winner
        },
        streamUrl: streamUrl
      };

      // 3. BACKGROUND: Start PHP process
      fetch('https://cimai.biz/startFight.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          fightId,
          secureId
        }).toString()
      }).catch(error => {
        console.error('Background PHP process error:', error);
      });

      return response;

    } catch (error) {
      console.error('Error in startFightAfterBetting:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getFightStatus(fightId: string): Promise<Fight | undefined> {
    console.log('Getting fight status for:', fightId);
    
    const fight = await this.prisma.fight.findUnique({
      where: { fightid: fightId },
      select: {
        fightid: true,
        secureId: true,
        timestamp: true,
        status: true,
        bets: true,
        currentState: true,
        streamUrl: true,
        winner: true
      }
    });
    
    if (!fight) {
      console.log('Fight not found:', fightId);
      return undefined;
    }
    
    console.log('Found fight:', fight);
    
    return {
      fightid: fight.fightid,
      secureId: fight.secureId,
      timestamp: fight.timestamp,
      status: fight.status as Fight['status'],
      bets: fight.bets as Fight['bets'],
      currentState: fight.currentState as Fight['currentState'],
      streamUrl: fight.streamUrl || undefined,
      winner: fight.winner || undefined
    };
  }

  async  verifyCashout(fightId: string): Promise<{ 
    success: boolean; 
    secureId?: string;
    error?: string; 
  }> {
    console.log('Verifying cashout for fight:', fightId);
    
    const fight = await this.prisma.fight.findUnique({
      where: { fightid: fightId }
    });

    if (!fight) {
      console.error('Fight not found:', fightId);
      return { 
        success: false, 
        error: 'Fight not found' 
      };
    }

    if (fight.status !== 'completed') {
      console.error('Fight not completed:', fight.status);
      return { 
        success: false, 
        error: 'Fight must be completed before cashing out' 
      };
    }

    if (!fight.winner) {
      console.error('No winner declared for fight:', fightId);
      return { 
        success: false, 
        error: 'No winner declared for this fight' 
      };
    }

    return {
      success: true,
      secureId: fight.secureId
    };
  }
}

export const fightProcessManager = new FightProcessManager();
