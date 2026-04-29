import { Schema, model, models, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  chatId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: String, required: true },
    userId: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const Message: Model<IMessage> = models.Message || model<IMessage>('Message', MessageSchema);

export default Message;
