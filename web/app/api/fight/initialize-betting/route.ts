// File: web/app/api/fight/initialize-betting/route.ts

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
  console.log('Received request to initialize fight for betting');

  try {
    const fightManager = await getFightManager();

    // Create a new fight with initial betting state
    const newFight = await fightManager.createNewFight();
    console.log('New fight created:', newFight);

    // Initialize the fight for betting in FightProcessManager
    const fightInitialized = await fightProcessManager.initializeFightForBetting(newFight.id, newFight.secureId);
    if (!fightInitialized) {
      throw new Error('Failed to initialize fight for betting in FightProcessManager');
    }
    console.log('Fight initialized for betting in FightProcessManager');

    return NextResponse.json({ 
      message: 'Fight initialized for betting successfully', 
      fight: {
        id: newFight.id,
        secureId: newFight.secureId,
        status: 'betting_open'
      }
    });
  } catch (error) {
    console.error('Error in /api/fight/initialize-betting:', error);

    return NextResponse.json(
      { message: 'Failed to initialize fight for betting', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}