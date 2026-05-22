import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IThread extends Document {
  _id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ThreadSchema = new Schema<IThread>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    title: { type: String, required: true },
  },
  { timestamps: true }
);

const Thread: Model<IThread> = mongoose.models.Thread || mongoose.model<IThread>('Thread', ThreadSchema);

export default Thread;
