import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://cimai.biz';
const TRAIN_URL = 'https://train.cimai.biz';

// Validation constants matching Python backend expectations
const VALID_CHARACTERS = ['liukang', 'kunglao', 'cage', 'reptile', 'subzero', 'shang', 'kitana', 'jax', 'mileena', 'baraka', 'scorpion', 'raiden'];
const VALID_STATES = ['Level1.LiuKangVsJax.state'];
const VALID_POLICIES = ['PPO', 'A2C', 'DQN'];
const VALID_STRATEGIES = ['aggressive', 'defensive', 'balanced'];

interface TrainingRequest {
  sessionId?: string;
  message: string;
  fighter: string;
  state: string;
  policy: string;
  strategy: string;
  save_state: string;
  learning_rate?: number;
  batch_size?: number;
  timesteps?: number;
}

export async function POST(req: NextRequest) {
  try {
    console.log('1. Starting training request...');
    const requestData: TrainingRequest = await req.json();
    console.log('2. Request data:', requestData);

    // Validate required fields
    if (!requestData.fighter || !requestData.policy || !requestData.strategy || !requestData.save_state) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields' 
        },
        { status: 400 }
      );
    }

    // Validate field values
    console.log('Validation details:', {
        receivedFighter: requestData.fighter,
        validFighters: VALID_CHARACTERS,
        fighterValid: VALID_CHARACTERS.includes(requestData.fighter),
        policyValid: VALID_POLICIES.includes(requestData.policy),
        strategyValid: VALID_STRATEGIES.includes(requestData.strategy),
        stateValid: VALID_STATES.includes(requestData.state)
    });

    if (!VALID_CHARACTERS.includes(requestData.fighter) ||
        !VALID_POLICIES.includes(requestData.policy) ||
        !VALID_STRATEGIES.includes(requestData.strategy) ||
        !VALID_STATES.includes(requestData.state)) {
      console.log('Invalid values:', {
        fighter: requestData.fighter,
        policy: requestData.policy,
        strategy: requestData.strategy,
        state: requestData.state
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid field values provided' 
        },
        { status: 400 }
      );
    }

    const sessionId = requestData.sessionId || uuidv4();

    // First, initialize the training service via PHP
    const serviceInit = await fetch(`${API_BASE}/services.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service: 'train',
        session_id: sessionId
      })
    });

    if (!serviceInit.ok) {
      throw new Error('Failed to initialize training service');
    }

    // Send the actual training request to the Python backend
    const response = await fetch(`${TRAIN_URL}/train`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        type: "train",
        message: requestData.message,
        fighter: requestData.fighter,
        state: requestData.state,
        policy: requestData.policy,
        strategy: requestData.strategy,
        save_state: "MortalKombatII-Genesis"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const responseData = await response.json();

    return NextResponse.json({
      success: true,
      sessionId,
      response: responseData.response || responseData.message,
      trainedModel: responseData.trainedModel,
      metrics: responseData.metrics || {}
    });

  } catch (error) {
    console.error('Detailed training error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get training status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${TRAIN_URL}/training-status`, {
      method: 'POST', // Using POST as per your Python API
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({ session_id: sessionId })
    });

    if (!response.ok) {
      throw new Error('Failed to get training status');
    }

    const statusData = await response.json();

    return NextResponse.json({
      success: true,
      status: statusData.status,
      progress: statusData.progress,
      metrics: statusData.metrics
    });

  } catch (error) {
    console.error('Training status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
