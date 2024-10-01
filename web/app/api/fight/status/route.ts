import { NextResponse } from 'next/server';
import { gun, getFightManager } from '../../proof-of-gun/db/backendServer.mjs';
import { Fight } from '../../../../components/betting/services/fight-manager';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fightId = searchParams.get('fightId');
  const secureId = searchParams.get('secureId');


  if (!fightId || !secureId) {
    return NextResponse.json({ error: 'Missing fightId or secureId' }, { status: 400 });
  }

  try {
    const fightManager = await getFightManager();
    const fightstatus = await fightManager.getFightStatus(fightId);

    if (!fightstatus || fightstatus.secureId !== secureId) {
      return NextResponse.json({ error: 'Fight not found or invalid secureId' }, { status: 404 });
    }

    // Update Gun with the latest fight status
    gun.get('fights').get(fightId).put(fightstatus);

    return NextResponse.json(fightstatus);
  } catch (error) {
    console.error('Error fetching fight status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('Received POST request to /api/fight/status');
  let data;
  try {
    data = await request.json();
    console.log('Parsed request body:', data);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const { fightId, secureId, ...fightData } = data;
  console.log('Extracted fightId:', fightId, 'secureId:', secureId);

  if (!fightId || !secureId) {
    console.log('Missing fightId or secureId');
    return NextResponse.json({ error: 'Missing fightId or secureId' }, { status: 200 });
  }

  try {
    const fightManager = await getFightManager();
    await fightManager.updateFightStatus(fightId, secureId, fightData);

    // Update Gun with the new fight status
    gun.get('fights').get(fightId).put({
      ...fightData,
      fightId,
      secureId,
      lastUpdated: Date.now()
    });

    return NextResponse.json({ message: 'Fight status updated successfully' });
  } catch (error) {
    console.error('Error updating fight status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}