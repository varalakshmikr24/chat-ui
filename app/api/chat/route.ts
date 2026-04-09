import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Simulate "thinking" time with a 1.5-second delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simple mock response logic
    const lastUserMessage = messages[messages.length - 1];
    let responseContent = "I'm a mock AI assistant. I received your message and I'm processing it.";

    if (lastUserMessage.content.toLowerCase().includes('hello')) {
      responseContent = "Hello! How can I assist you today with your Metawurks project?";
    } else if (lastUserMessage.content.toLowerCase().includes('help')) {
      responseContent = "I'm here to help. You can ask me about the chat UI, backend integration, or any other features.";
    }

    return NextResponse.json({
      id: Date.now().toString(),
      role: 'assistant',
      content: responseContent,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
