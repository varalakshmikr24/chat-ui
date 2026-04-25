import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Thread from '@/models/Thread';
import { getRealTimeData } from '@/lib/tavily';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log("Chat API POST request received");
  try {
    const session = await auth();
    const body = await req.json();
    const { message, history, model, threadId } = body;
    const userId = session?.user ? (session.user as any).id : null;
    const modelName = model || 'gemini';

    console.log("User ID:", userId, "Model:", modelName);

    await connectDB();

    const isValidThreadId = threadId && mongoose.Types.ObjectId.isValid(threadId);

    // 1. SAVE USER MESSAGE
    if (isValidThreadId && userId) {
      try {
        await Message.create({
          threadId, userId, role: 'user', content: message,
        });

        const currentThread = await Thread.findById(threadId);
        if (currentThread && currentThread.title === 'New Conversation') {
          const newTitle = message.slice(0, 40) + (message.length > 40 ? '...' : '');
          await Thread.findByIdAndUpdate(threadId, {
            title: newTitle,
            updatedAt: new Date()
          });
        } else {
          await Thread.findByIdAndUpdate(threadId, { updatedAt: new Date() });
        }
      } catch (err) {
        console.error('Failed to save user message:', err);
      }
    }

    // --- REAL-TIME DATA FETCHING ---
    let liveContext = "No real-time data found.";
    try {
        const searchData = await getRealTimeData(message);
        if (searchData) {
            liveContext = searchData.answer || searchData.results?.map((r: any) => r.content).join("\n") || liveContext;
        }
    } catch (searchErr) {
        console.error("Search error:", searchErr);
    }

    const systemPrompt = `
      You are a helpful AI assistant. 
      Today's Date: ${new Date().toLocaleDateString()}
      Use the following real-time information to answer the user's request accurately.
      
      REAL-TIME DATA:
      ${liveContext}
    `;

    const messagesForGemini = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: "Understood. I will use that real-time data for context." }] },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const messagesForGroq = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        try {
          if (modelName === 'llama') {
            const groqStream = await groq.chat.completions.create({
              messages: messagesForGroq,
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
            const result = await modelInstance.generateContentStream({ contents: messagesForGemini });

            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              if (chunkText) {
                fullResponse += chunkText;
                controller.enqueue(encoder.encode(chunkText));
              }
            }
          }

          if (isValidThreadId && userId && fullResponse.trim()) {
            await Message.create({
              threadId, userId, role: 'assistant', content: fullResponse.trim(),
            });
          }
        } catch (err: any) {
          console.error("Streaming error caught:", err);
          let friendlyError = "An error occurred during streaming.";
          if (err.status === 429 || err.message?.includes("429")) {
            friendlyError = "Quota Exceeded: Your daily limit is reached. Please try again tomorrow.";
          }
          controller.enqueue(encoder.encode(JSON.stringify({ error: friendlyError })));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error: any) {
    console.error('Initial API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    );
  }
}