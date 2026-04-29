import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChat extends Document {
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true, default: 'New Chat' },
  },
  { timestamps: true }
);

const Chat: Model<IChat> = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);

export default Chat;
