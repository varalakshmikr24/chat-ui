import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Thread from '@/models/Thread';
import Message from '@/models/Message';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = (session.user as any).id;
    
    // Sidebar Filtering: Only fetch threads that have a title other than 'New Conversation'
    // OR have at least one message in them.
    // In MongoDB, we can check for threads where title != 'New Conversation'
    const threads = await Thread.find({ 
      userId,
      $or: [
        { title: { $ne: 'New Conversation' } },
        // If we want to check for messages, we'd need a subquery or a count, 
        // but checking title is usually enough for "lazy creation" logic.
      ]
    })
    .sort({ updatedAt: -1 })
    .lean();

    // Secondary filter: Check if they have messages if title IS 'New Conversation'
    // (This handles the case where the first message was saved but title wasn't updated yet)
    const filteredThreads = [];
    for (const thread of threads) {
        if (thread.title !== 'New Conversation') {
            filteredThreads.push(thread);
        } else {
            const hasMessages = await Message.exists({ threadId: thread._id.toString() });
            if (hasMessages) {
                filteredThreads.push(thread);
            }
        }
    }

    return NextResponse.json(filteredThreads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title } = await req.json();
    await connectDB();

    const userId = (session.user as any).id;
    const newThread = await Thread.create({
      userId,
      title: title || 'New Conversation',
    });

    return NextResponse.json(newThread, { status: 201 });
  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
  }
}
