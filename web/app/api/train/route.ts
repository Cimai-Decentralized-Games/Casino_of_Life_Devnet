import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { character, state, numEnv, numTimesteps, wallet } = data;

    const response = await fetch('https://cimai.biz/train.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        character,
        state,
        num_env: numEnv,
        num_timesteps: numTimesteps,
        wallet
      })
    });

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Training error:', error);
    return NextResponse.json(
      { error: 'Training failed', details: error.message },
      { status: 500 }
    );
  }
}

// Training status endpoint stays the same
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const character = searchParams.get('character');
    const state = searchParams.get('state');
    const trainingId = searchParams.get('trainingId');

    if (!character || !state || !trainingId) {
      throw new Error('Character, state, and trainingId are required');
    }

    const response = await fetch(
      `https://cimai.biz/training-status.php?character=${character}&state=${state}&trainingId=${trainingId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Status check failed', details: error.message },
      { status: 500 }
    );
  }
}
