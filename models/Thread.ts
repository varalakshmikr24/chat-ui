import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IThread extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ThreadSchema = new Schema<IThread>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
  },
  { timestamps: true }
);

const Thread: Model<IThread> = mongoose.models.Thread || mongoose.model<IThread>('Thread', ThreadSchema);

export default Thread;
