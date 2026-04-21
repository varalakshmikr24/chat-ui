import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Thread from '@/models/Thread';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(req: Request) {
  let modelName = 'unknown';
  try {
    const session = await auth();
    const { message, history, model, threadId } = await req.json();
    const userId = session?.user ? (session.user as any).id : null;
    modelName = model || 'gemini';

    await connectDB();

    const isValidThreadId = threadId && mongoose.Types.ObjectId.isValid(threadId);

    // 1. SAVE USER MESSAGE IMMEDIATELY
    if (isValidThreadId && userId) {
      try {
        await Message.create({
          threadId, userId, role: 'user', content: message,
        });

        // AUTOMATIC RENAMING: If this is the first message (title is still default), rename it
        const currentThread = await Thread.findById(threadId);
        if (currentThread && currentThread.title === 'New Conversation') {
          const newTitle = message.slice(0, 40) + (message.length > 40 ? '...' : '');
          await Thread.findByIdAndUpdate(threadId, { 
            title: newTitle,
            updatedAt: new Date() 
          });
        } else {
          // Just update the timestamp for existing threads
          await Thread.findByIdAndUpdate(threadId, { updatedAt: new Date() });
        }
      } catch (err) {
        console.error('Failed to save user message:', err);
      }
    }

    const messagesForAI = (history || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    messagesForAI.push({ role: 'user', parts: [{ text: message }] });

    const encoder = new TextEncoder();

    // 2. CREATE READABLE STREAM
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        try {
          if (modelName === 'llama') {
            const groqStream = await groq.chat.completions.create({
              messages: messagesForAI.map(m => ({ 
                role: m.role === 'model' ? 'assistant' : 'user', 
                content: m.parts[0].text 
              })),
              model: "llama-3.1-8b-instant",
              stream: true,
            });

            for await (const chunk of groqStream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                fullResponse += content;
                controller.enqueue(encoder.encode(content));
              }
            }
          } else {
            const modelInstance = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await modelInstance.generateContentStream({ contents: messagesForAI });

            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              if (chunkText) {
                fullResponse += chunkText;
                controller.enqueue(encoder.encode(chunkText));
              }
            }
          }

          // 3. PERSIST ASSISTANT MESSAGE ONCE FINISHED
          if (isValidThreadId && userId && fullResponse.trim()) {
             await Message.create({
               threadId, userId, role: 'assistant', content: fullResponse.trim(),
             });
          }
        } catch (err: any) {
          console.error("Streaming error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
        },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    );
  }
}