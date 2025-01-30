import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { character, state } = data;

    // Call your PHP endpoint
    const response = await fetch('https://cimai.biz/play.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        character,
        state,
        play: true,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Stream the video frames back to the client
    const reader = response.body?.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (!reader!.closed) {
            const { done, value } = await reader!.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Playing error:', error);
    return NextResponse.json({ error: 'Playing failed' }, { status: 500 });
  }
}