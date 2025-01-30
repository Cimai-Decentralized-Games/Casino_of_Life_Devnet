import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://cimai.biz';
const CHAT_URL = 'https://chat.cimai.biz/chat';



export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json();
    const sessionId = req.headers.get('x-session-id') || 'new-session';

    console.log('1. Starting chat service...');
    const serviceInit = await fetch(`${API_BASE}/services.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        service: 'chat'
      })
    });

    const serviceText = await serviceInit.text();
    console.log('2. Raw service response:', serviceText);

    // Parse the SSE data
    const jsonMatch = serviceText.match(/data: ({.*})/);
    if (!jsonMatch) {
      throw new Error(`Invalid service response format: ${serviceText}`);
    }

    const serviceData = JSON.parse(jsonMatch[1]);
    console.log('3. Parsed service data:', serviceData);

    if (!serviceData.success || serviceData.status !== 'active') {
      throw new Error('Chat service not active');
    }

    console.log('4. Sending chat request...');
    const chatResponse = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: requestData.message,
        type: 'chat'
      })
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('Chat error response:', errorText);
      throw new Error(`Chat service error: ${errorText}`);
    }

    const data = await chatResponse.json();
    console.log('5. Chat response:', data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Detailed chat error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://cimai.biz',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
      'Access-Control-Max-Age': '86400'
    }
  });
}