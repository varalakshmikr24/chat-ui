import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini SDK
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    // Format and sanitize history for Gemini
    // Gemini requires alternating roles starting with 'user' and ending with 'model'
    const sanitizedContents: any[] = [];
    let nextExpectedRole = 'user';

    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg.isError) continue; // Skip error messages

        const role = msg.role === 'assistant' ? 'model' : 'user';
        
        // Ensure strictly alternating roles
        if (role === nextExpectedRole) {
          sanitizedContents.push({
            role: role,
            parts: [{ text: msg.content }],
          });
          nextExpectedRole = role === 'user' ? 'model' : 'user';
        }
      }
    }

    // If the history ends with a user message, we must remove it 
    // because the current 'message' will be the next user message.
    if (sanitizedContents.length > 0 && sanitizedContents[sanitizedContents.length - 1].role === 'user') {
      sanitizedContents.pop();
    }

    // Append the current message
    sanitizedContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Use gemini-flash-latest for best availability
    const response = await genAI.models.generateContent({
      model: 'gemini-flash-latest',
      contents: sanitizedContents,
    });

    return NextResponse.json({
      id: Date.now().toString(),
      role: 'assistant',
      content: response.text,
    });
  } catch (error: any) {
    console.error('Gemini API Error Detail:', error);
    
    const errorMessage = error.message || 'Unknown error occurred during Gemini generation';
    const status = error.status || 500;

    return NextResponse.json(
      { error: `Gemini Error: ${errorMessage}`, detail: error },
      { status }
    );
  }
}



