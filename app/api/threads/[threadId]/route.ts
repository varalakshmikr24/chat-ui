import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Thread from '@/models/Thread';
import Message from '@/models/Message';

export async function DELETE(
  req: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = params;
    if (!threadId || !mongoose.Types.ObjectId.isValid(threadId)) {
      return NextResponse.json({ error: 'Invalid Thread ID' }, { status: 400 });
    }

    await connectDB();

    const userId = (session.user as any).id;

    // Verify ownership before deleting
    const thread = await Thread.findOne({ _id: threadId, userId: new mongoose.Types.ObjectId(userId) });
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found or unauthorized' }, { status: 404 });
    }

    // Cascade Delete: Thread and all associated Messages
    await Message.deleteMany({ threadId: new mongoose.Types.ObjectId(threadId) });
    await Thread.deleteOne({ _id: threadId });

    return NextResponse.json({ message: 'Thread and messages deleted successfully' });
  } catch (error) {
    console.error('Error deleting thread:', error);
    return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 });
  }
}
