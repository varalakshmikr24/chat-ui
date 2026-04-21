import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IThread extends Document {
  // Change this from ObjectId to string to support UUIDs
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ThreadSchema = new Schema<IThread>(
  {
    // Change type to String to match the UUID coming from your session
    userId: { type: String, required: true },
    title: { type: String, required: true },
  },
  { timestamps: true }
);

const Thread: Model<IThread> = mongoose.models.Thread || mongoose.model<IThread>('Thread', ThreadSchema);

export default Thread;
