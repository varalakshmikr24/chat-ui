import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Thread from '@/models/Thread';
import Message from '@/models/Message';
import mongoose from 'mongoose';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await connectDB();

    const userId = (session.user as any).id;
    const thread = await Thread.findOne({ _id: id, userId });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Cascade delete: remove thread and all its messages
    await Thread.deleteOne({ _id: id });
    await Message.deleteMany({ threadId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const { title, isPinned, isArchived } = body;

    await connectDB();

    const userId = (session.user as any).id;
    const thread = await Thread.findOne({ _id: id, userId });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (isPinned !== undefined) updates.isPinned = isPinned;
    if (isArchived !== undefined) updates.isArchived = isArchived;
    updates.updatedAt = new Date();

    const updatedThread = await Thread.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    return NextResponse.json(updatedThread);
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
  }
}
