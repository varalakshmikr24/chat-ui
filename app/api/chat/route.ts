import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Note: Ensure you are using the correct package name
import OpenAI from 'openai';

// Define the interface to fix the "implicitly has an 'any' type" error
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Initialize the Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize Groq (OpenAI compatible)
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

export async function POST(req: Request) {
  let modelName = 'unknown';
  try {
    const { message, history, model } = await req.json();
    modelName = model || 'gemini';

    if (modelName === 'gemini' && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }
    if (modelName === 'llama' && !process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API key is not configured' }, { status: 500 });
    }

    // 1. Extract and format the history array
    const messagesForAI: ChatMessage[] = (history || [])
      .filter((msg: any) => !msg.isError)
      .map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

    // 2. Append the new message as the final user entry
    messagesForAI.push({ role: 'user', content: message });

    let responseText = "";

    if (modelName === 'llama') {
      // --- GROQ (LLAMA) LOGIC ---
      const completion = await groq.chat.completions.create({
        messages: messagesForAI,
        model: "llama-3.1-8b-instant",
      });
      responseText = completion.choices[0].message.content || "";

    } else {
      // --- GEMINI LOGIC ---
      // FIX: Explicitly typed 'msg' to avoid the 'any' type error
      const contents = messagesForAI.map((msg: ChatMessage) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Gemini requires alternating roles (user, model, user...)
      const sanitizedContents = [];
      let lastRole = null;
      for (const content of contents) {
        if (content.role !== lastRole) {
          sanitizedContents.push(content);
          lastRole = content.role;
        }
      }

      const modelInstance = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await modelInstance.generateContent({
        contents: sanitizedContents,
      });
      const response = await result.response;
      responseText = response.text() || "";
    }

    return NextResponse.json({
      id: Date.now().toString(),
      role: 'assistant',
      content: responseText,
    });
  } catch (error: any) {
    console.error('API Error Detail:', error);

    const errorMessage = error.message || 'Unknown error occurred during generation';
    const status = error.status || 500;

    return NextResponse.json(
      { error: `${modelName.toUpperCase()} Error: ${errorMessage}`, detail: error },
      { status }
    );
  }
}





