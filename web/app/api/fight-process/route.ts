import { NextResponse } from 'next/server';
import { fightProcessManager } from '../../lib/fightProcessManager';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FightRequest {
  action: 'initializeFight' | 'placeBet' | 'startFight' | 'updateState' | 'cashOut';
  fightId?: string;
  secureId?: string;
  player?: 'player1' | 'player2';
  amount?: number;
  data?: string;
  status?: string;
  currentState?: any;
  timestamp?: number;
  streamUrl?: string;
  walletAddress?: string;
}

interface Bet {
  walletAddress: string;
  player: 'player1' | 'player2';
  amount: number;
  timestamp: number;
}

interface Fight {
  fightid: string;
  secureId: string;
  timestamp: number;
  status: string;
  bets: {
    player1: number;
    player2: number;
  };
  currentState: any;
  streamUrl: string | null;
  winner: string | null;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const fightId = url.searchParams.get('fightId');

    if (!fightId) {
      return NextResponse.json({ message: 'Fight ID is required' }, { status: 400 });
    }

    const fight = fightProcessManager.getFightStatus(fightId);

    if (!fight) {
      return NextResponse.json({ message: 'Fight not found' }, { status: 404 });
    }

    return NextResponse.json(fight);
  } catch (error) {
    console.error('Error in GET /api/fight-process:', error);
    return NextResponse.json(
      { message: 'Failed to fetch fight state', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  console.log('Received fight process request');

  try {
    const data: FightRequest = await request.json();
    const { action } = data;
    console.log(`Processing ${action} request`);

    switch (action) {
      case 'initializeFight': {
        console.log('Initializing new fight for betting');
        
        const newFight = await fightProcessManager.createNewFight();
        console.log('New fight created:', newFight);

        return NextResponse.json({
          message: 'Fight initialized for betting successfully',
          fight: newFight
        });
      }

      case 'placeBet': {
        const { fightId, player, amount } = data;
        console.log('API: Attempting to place bet:', { fightId, player, amount });

        if (!fightId || !player || !amount) {
          return NextResponse.json(
            { message: 'Fight ID, player, and amount are required' },
            { status: 400 }
          );
        }

        try {
          // First verify the fight exists
          const fight = await prisma.fight.findUnique({
            where: { fightid: fightId }
          });
          console.log('API: Found fight before bet:', fight);

          if (!fight) {
            console.error('API: Fight not found:', fightId);
            return NextResponse.json({ message: 'Fight not found' }, { status: 404 });
          }

          await fightProcessManager.placeBet(fightId, player as 'player1' | 'player2', amount);
          
          // Verify fight after bet
          const updatedFight = await prisma.fight.findUnique({
            where: { fightid: fightId }
          });
          console.log('API: Fight after bet:', updatedFight);

          return NextResponse.json({
            message: 'Bet placed successfully',
            fight: updatedFight,
            amount: amount,
            player: player
          });
        } catch (error) {
          console.error('API: Error placing bet:', error);
          return NextResponse.json(
            { message: 'Failed to place bet', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          );
        }
      }

      case 'startFight': {
        const { fightId, secureId } = data;
        console.log(`Starting fight after betting: ${fightId}, secureId: ${secureId}`);

        if (!fightId || !secureId) {
          return NextResponse.json(
            { message: 'Fight ID and Secure ID are required' },
            { status: 400 }
          );
        }

        try {
          // Use fightProcessManager instead of direct calls
          const result = await fightProcessManager.startFightAfterBetting(fightId, secureId);
          
          if (!result.success) {
            return NextResponse.json(
              { message: result.error || 'Failed to start fight' },
              { status: 500 }
            );
          }

          return NextResponse.json({
            message: 'Fight started successfully',
            fight: result.fight,
            streamUrl: result.streamUrl
          });
        } catch (error) {
          console.error('Error starting fight:', error);
          return NextResponse.json(
            { message: 'Failed to start fight', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          );
        }
      }

      case 'updateState': {
        const { fightId } = data;
        
        if (!fightId) {
          return NextResponse.json(
            { message: 'Fight ID is required' },
            { status: 400 }
          );
        }

        try {
          const fight = await prisma.fight.findUnique({
            where: { fightid: fightId }
          });

          if (!fight) {
            return NextResponse.json({ message: 'Fight not found' }, { status: 404 });
          }

          // Handle incoming Python data structure
          const updatedCurrentState = data.currentState ? {
            round: data.currentState.round,
            p1_health: data.currentState.p1_health,
            p2_health: data.currentState.p2_health,
            timestamp: data.timestamp || Math.floor(Date.now() / 1000)
          } : fight.currentState;

          // Determine winner if fight is completed
          let winner = null;
          if (data.status === 'completed') {
            if ((updatedCurrentState as any).p1_health > (updatedCurrentState as any).p2_health) {
              winner = 'player1';
            } else if ((updatedCurrentState as any).p2_health > (updatedCurrentState as any).p1_health) {
              winner = 'player2';
            }
            // If health is equal, it's a draw
            console.log('Fight completed, determined winner:', winner);
          }

          const updatedFight = await prisma.fight.update({
            where: { fightid: fightId },
            data: {
              status: data.status === 'completed' ? 'completed' : 
                     data.status === 'in_progress' ? 'in_progress' : 
                     data.status,
              currentState: updatedCurrentState,
              winner: winner || fight.winner,
              streamUrl: data.streamUrl || fight.streamUrl
            }
          });

          console.log('Updated fight state:', {
            status: updatedFight.status,
            currentState: updatedFight.currentState,
            winner: updatedFight.winner
          });

          return NextResponse.json({
            message: 'Fight state updated',
            fight: updatedFight
          });
        } catch (error) {
          console.error('Error updating fight state:', error);
          return NextResponse.json(
            { message: 'Failed to update fight state', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          );
        }
      }

      case 'cashOut': {
        const { secureId, walletAddress } = data;
        console.log('Starting cashout process:', { secureId, walletAddress });

        if (!secureId || !walletAddress) {
          console.log('Missing required fields:', { secureId, walletAddress });
          return NextResponse.json(
            { message: 'Secure ID and wallet address are required' },
            { status: 400 }
          );
        }

        try {
          // Use the fightProcessManager to verify cashout
          const result = await fightProcessManager.verifyCashout(secureId);
          
          if (!result.success) {
            console.log('Cashout verification failed:', result.error);
            return NextResponse.json(
              { message: result.error },
              { status: 400 }
            );
          }

          // If verification passed, return the secure ID
          console.log('Cashout authorized:', {
            wallet: walletAddress,
            secureId: result.secureId
          });
          
          return NextResponse.json({
            message: 'Cashout authorized',
            secureId: result.secureId,
            success: true
          });

        } catch (error) {
          console.error('Detailed cashout error:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
          return NextResponse.json(
            { message: 'Failed to process cashout', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          );
        }
      }

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in fight process:', error);
    return NextResponse.json(
      { message: 'Operation failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
