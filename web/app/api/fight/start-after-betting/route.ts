// File: web/app/api/fight/start-after-betting/route.ts

import { NextResponse } from 'next/server';
import { FightManager } from '../../../../components/betting/services/fight-manager';
import { fightProcessManager } from '../../proof-of-gun/db/fightProcess.mjs';
import { gun } from '../../proof-of-gun/db/backendServer.mjs';

let fightManagerInstance: FightManager | null = null;

async function getFightManager(): Promise<FightManager> {
  if (!fightManagerInstance) {
    fightManagerInstance = new FightManager(gun);
  }
  return fightManagerInstance;
}

export async function POST(request: Request) {
  console.log('Received request to start fight after betting');

  try {
    const fightManager = await getFightManager();
    const { fightId, secureId } = await request.json();

    if (!fightId || !secureId) {
      return NextResponse.json({ message: 'Fight ID and Secure ID are required' }, { status: 400 });
    }

    const fight = await fightManager.getFightStatus(fightId);
    if (!fight) {
      return NextResponse.json({ message: 'Fight not found' }, { status: 404 });
    }

    if (fight.status !== 'betting_open') {
      return NextResponse.json({ message: 'Fight is not in betting_open state' }, { status: 400 });
    }

    const fightStarted = await fightProcessManager.startFightAfterBetting(fightId, secureId);
    if (!fightStarted) {
      throw new Error('Failed to start fight after betting');
    }

    const updatedFight = {
      ...fight,
      status: 'active',
      currentState: fight.currentState || {
        round: 1,
        p1_health: 100,
        p2_health: 100,
        timestamp: Date.now()
      }
    };

    await fightManager.updateFightStatus(fightId, secureId, 'active', updatedFight.currentState);

    return NextResponse.json({ 
      message: 'Fight started successfully after betting', 
      fightId: fightId,
      status: 'active'
    });
  } catch (error) {
    console.error('Error in /api/fight/start-after-betting:', error);

    return NextResponse.json(
      { message: 'Failed to start fight after betting', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}