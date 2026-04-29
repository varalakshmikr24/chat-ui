import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';
import User from '@/models/User';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let userId = (session.user as any).id;
    if (!userId && session.user.email) {
      const userDoc = await User.findOne({ email: session.user.email });
      if (userDoc) userId = userDoc._id.toString();
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    const formattedChats = chats.map((c: any) => ({
      id: c._id.toString(),
      title: c.title,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }));

    return NextResponse.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
}
