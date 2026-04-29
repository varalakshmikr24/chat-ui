import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface IConversation extends Document {
  userId: string;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  id: { type: String },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: String },
}, { _id: false });

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true, default: 'New Conversation' },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

const Conversation: Model<IConversation> = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
