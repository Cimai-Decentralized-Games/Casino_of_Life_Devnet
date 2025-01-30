import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://cimai.biz';
const TRAIN_URL = 'https://train.cimai.biz';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const sessionId = data.session_id;
    
    console.log('Received status request for session:', sessionId);
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // First check with PHP service
    const serviceCheck = await fetch(`${API_BASE}/services.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service: 'train',
        action: 'status',
        session_id: sessionId
      })
    });

    if (!serviceCheck.ok) {
      throw new Error('Failed to check service status');
    }

    // Then get the actual training status from Python backend
    const response = await fetch(`${TRAIN_URL}/training-status`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({ session_id: sessionId })
    });

    if (!response.ok) {
      throw new Error('Failed to get training status');
    }



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