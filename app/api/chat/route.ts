import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Thread from '@/models/Thread';
import { getRealTimeData } from '@/lib/tavily'; // Import your Tavily utility

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

    // --- REAL-TIME DATA FETCHING (TAVILY) ---
    const searchData = await getRealTimeData(message);
    const liveContext = searchData?.answer ||
      searchData?.results?.map((r: any) => r.content).join("\n") ||
      "No real-time data found.";

    const systemPrompt = `
      You are a helpful AI assistant. 
      Today's Date: ${new Date().toLocaleDateString()}
      Use the following real-time information to answer the user's request accurately.
      
      REAL-TIME DATA:
      ${liveContext}
    `;

    // Prepare messages for Gemini
    const messagesForGemini = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: "Understood. I will use that real-time data for context." }] },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    // Prepare messages for Groq (Llama)
    const messagesForGroq = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const encoder = new TextEncoder();

    // 2. CREATE READABLE STREAM
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
            // GEMINI FLOW
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

          // 3. PERSIST ASSISTANT MESSAGE ONCE FINISHED
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
        'Transfer-Encoding': 'chunked',
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