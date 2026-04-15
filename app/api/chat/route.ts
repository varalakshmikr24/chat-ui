import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '', // ✅ Fixed: Now matches your .env.local
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

    const messagesForAI: ChatMessage[] = (history || [])
      .filter((msg: any) => !msg.isError)
      .map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

    messagesForAI.push({ role: 'user', content: message });

    let responseText = "";

    if (modelName === 'llama') {
      const completion = await groq.chat.completions.create({
        messages: messagesForAI as any,
        model: "llama-3.1-8b-instant",
      });
      responseText = completion.choices[0].message.content || "";

    } else {
      // --- GEMINI LOGIC ---
      const contents = messagesForAI.map((msg: ChatMessage) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Gemini requires alternating roles; this logic ensures validity
      const sanitizedContents = [];
      let lastRole = null;
      for (const content of contents) {
        if (content.role !== lastRole) {
          sanitizedContents.push(content);
          lastRole = content.role;
        }
      }

      // FIX: Ensure variable name matches (modelInstance vs model)
      // Use "gemini-1.5-flash" for reliability
      const modelInstance = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    // Provide a cleaner error message for the frontend
    const errorMessage = error.message || 'Unknown error occurred';

    // Check for specific Quota/Rate Limit errors to trigger your frontend's "Demo Mode" switch
    const status = error.status || (errorMessage.includes('429') ? 429 : 500);

    return NextResponse.json(
      { error: `${modelName.toUpperCase()} Error: ${errorMessage}` },
      { status }
    );
  }
}