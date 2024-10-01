import { NextResponse } from 'next/server';
import Gun from 'gun';

// Initialize Gun
const gun = Gun();

export async function GET() {
  try {
    // Perform a simple operation to check if Gun is working
    gun.get('health-check').put({ status: 'ok', timestamp: Date.now() });
    
    return NextResponse.json({ status: 'Gun.js connection is healthy' });
  } catch (error) {
    console.error('Gun.js error:', error);
    return NextResponse.json({ error: 'Failed to connect to Gun.js' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // This endpoint isn't necessary for Gun.js operations, but we'll keep it
  // in case you want to add server-side logic in the future
  return NextResponse.json({ message: 'Gun.js handles real-time data synchronization client-side' });
}