import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { chatId: string } }) {
  try {
    await connectDB();
    const { chatId } = await params;
    
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).lean();
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
