import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

// Initialize the Gemini SDK
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

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
    const messagesForAI = (history || [])
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
        // Transform the structured messages into Gemini's expected format
        const contents = messagesForAI.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Gemini requires alternating roles (user, model, user...)
        // We'll filter to ensure we strictly follow this pattern if needed,
        // but for a standard chat, the history usually already alternates.
        const sanitizedContents = [];
        let lastRole = null;
        for (const content of contents) {
            if (content.role !== lastRole) {
                sanitizedContents.push(content);
                lastRole = content.role;
            }
        }

        const response = await genAI.models.generateContent({
            model: 'gemini-flash-latest',
            contents: sanitizedContents,
        });
        responseText = response.text || "";
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





