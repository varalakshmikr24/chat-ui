import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Chat from '@/models/Chat';
import { getRealTimeData } from '@/lib/tavily';
import { generateTitle } from '@/lib/titleService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { message, history, model, conversationId, chatId: reqChatId, threadId: reqThreadId } = body;
    const userId = session?.user ? (session.user as any).id : null;
    const modelName = model || 'gemini';

    await connectDB();

    let chatId = conversationId || reqChatId || reqThreadId;

    // First Message Logic: Create chat if no chatId
    if (!chatId || chatId === 'new' || !mongoose.Types.ObjectId.isValid(chatId)) {
      if (userId) {
        // Auto-Title: LLM Call to generate 3-word title
        const generatedTitle = await generateTitle(message);

        const newChat = await Chat.create({
          userId,
          title: generatedTitle,
        });
        chatId = newChat._id.toString();
      }
    }

    // SAVE USER MESSAGE
    if (chatId && userId) {
      try {
        await Message.create({
          chatId,
          userId,
          role: 'user',
          content: message,
        });

        await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });
      } catch (err) {
        console.error('Failed to save user message:', err);
      }
    }

    // --- AI LOGIC ---
    let liveContext = "No real-time data found.";
    try {
      const searchData = await getRealTimeData(message);
      if (searchData) {
        liveContext = searchData.answer || searchData.results?.map((r: any) => r.content).join("\n") || liveContext;
      }
    } catch (searchErr) {
      console.error("Search error:", searchErr);
    }

    const systemPrompt = `You are a helpful AI assistant. REAL-TIME DATA: ${liveContext}`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        try {
          if (modelName === 'llama') {
            const groqStream = await groq.chat.completions.create({
              messages: [{ role: 'system', content: systemPrompt }, ...history.map((m: any) => ({ role: m.role, content: m.content })), { role: 'user', content: message }],
              model: "llama-3.1-8b-instant",
              stream: true,
            });
            for await (const chunk of groqStream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) { fullResponse += content; controller.enqueue(encoder.encode(content)); }
            }
          } else {
            const modelInstance = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await modelInstance.generateContentStream({
              contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: "Understood." }] },
                ...history.map((m: any) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
                { role: 'user', parts: [{ text: message }] }
              ]
            });
            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              if (chunkText) { fullResponse += chunkText; controller.enqueue(encoder.encode(chunkText)); }
            }
          }

          if (chatId && userId && fullResponse.trim()) {
            await Message.create({
              chatId, userId, role: 'assistant', content: fullResponse.trim(),
            });
          }
        } catch (err: any) {
          console.error("Streaming error:", err);

          let errorMessage = err.message || "An unexpected error occurred.";
          if (err.status === 429 || errorMessage.includes("429") || errorMessage.includes("quota")) {
            errorMessage = "Quota Exceeded: The Gemini API rate limit has been reached. Please try again in a few moments.";
          }

          controller.enqueue(encoder.encode(JSON.stringify({ error: errorMessage })));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Chat-Id': chatId || '',
      },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}