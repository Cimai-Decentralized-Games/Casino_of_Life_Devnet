// File: web/app/api/betting/place-bet/route.ts

import { NextResponse } from 'next/server';
import { FightManager } from '../../../../components/betting/services/fight-manager';
import { gun } from '../../proof-of-gun/db/backendServer.mjs';

let fightManagerInstance: FightManager | null = null;

function getFightManager(): FightManager {
  if (!fightManagerInstance) {
    fightManagerInstance = new FightManager(gun);
  }
  return fightManagerInstance;
}

export async function POST(request: Request) {
  try {
    const { fightId, player, amount } = await request.json();

    if (!fightId || !player || !amount) {
      return NextResponse.json(
        { message: 'Fight ID, player, and amount are required' },
        { status: 400 }
      );
    }

    if (player !== 'player1' && player !== 'player2') {
      return NextResponse.json(
        { message: 'Invalid player. Must be either "player1" or "player2"' },
        { status: 400 }
      );
    }

    const fightManager = getFightManager();
    const fight = await fightManager.getFightStatus(fightId);
    
    if (!fight) {
      return NextResponse.json(
        { message: 'Fight not found' },
        { status: 404 }
      );
    }

    if (fight.status !== 'betting_open') {
      return NextResponse.json(
        { message: 'Betting is not open for this fight' },
        { status: 400 }
      );
    }

    // Place the bet
    await fightManager.placeBet(fightId, player, amount);

    return NextResponse.json({ 
      message: 'Bet placed successfully', 
      fightId: fightId,
      player: player,
      amount: amount
    });

  } catch (error) {
    console.error('Error in /api/betting/place-bet:', error);
    return NextResponse.json(
      { message: 'Failed to place bet', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}