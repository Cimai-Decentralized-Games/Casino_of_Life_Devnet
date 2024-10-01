import { NextResponse } from 'next/server';
import { FightManager } from '../../../../components/betting/services/fight-manager';
import { gun } from '../../proof-of-gun/db/backendServer.mjs';

let fightManagerInstance: FightManager | null = null;

async function getFightManager(): Promise<FightManager> {
  if (!fightManagerInstance) {
    fightManagerInstance = new FightManager(gun);
  }
  return fightManagerInstance;
}

export async function GET(request: Request) {
  try {
    const fightManager = await getFightManager();
    const url = new URL(request.url);
    const fightId = url.searchParams.get('fightId');

    if (!fightId) {
      return NextResponse.json({ message: 'Fight ID is required' }, { status: 400 });
    }

    const fight = await fightManager.getFightStatus(fightId);

    if (!fight) {
      return NextResponse.json({ message: 'Fight not found' }, { status: 404 });
    }

    return NextResponse.json(fight);
  } catch (error) {
    console.error('Error in GET /api/fight/update:', error);
    return NextResponse.json(
      { message: 'Failed to fetch fight state', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const fightManager = await getFightManager();
    const data = await request.json();
    const { fightId, secureId, status, currentState, ...otherData } = data;
    
    if (!fightId || !secureId || !status) {
      return NextResponse.json(
        { message: 'Missing required fields in request body' },
        { status: 400 }
      );
    }

    const fullUpdateData = {
      status,
      currentState: {
        ...(currentState || {}),
        ...otherData
      }
    };

    await fightManager.updateFightStatus(fightId, secureId, status, fullUpdateData.currentState);
    
    return NextResponse.json({ 
      message: 'Fight state updated', 
      ...fullUpdateData
    });
  } catch (error) {
    console.error('Error in POST /api/fight/update:', error);
    return NextResponse.json(
      { message: 'Failed to update fight state', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}