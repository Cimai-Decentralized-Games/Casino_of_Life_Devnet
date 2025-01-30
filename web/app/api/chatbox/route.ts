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

export async function POST(request: Request) {
  try {
    const { user, text, timestamp } = await request.json();
    
    const message = await prisma.chatMessage.create({
      data: {
        user,
        text,
        timestamp: new Date(timestamp),
        fightId: null
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}