import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../prisma/generated/chat-client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const messages = await prisma.chatMessage.findMany({
      orderBy: {
        timestamp: 'asc'
      },
      take: 100
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}