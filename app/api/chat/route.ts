import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log("🚀 Chat API POST request received - Agno Service Mode");

  try {
    // 1. Safe Auth Resolution: Don't let a missing auth session break the entire route compilation
    let session = null;
    try {
      session = await auth();
    } catch (authError) {
      console.warn("⚠️ Auth session check skipped or failed:", authError);
    }

    const body = await req.json();
    const { message: userMessage, threadId } = body;

    if (!userMessage) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const userId = session?.user ? (session.user as any).id : null;

    // Connect to MongoDB
    await connectDB();

    console.log(`📡 Calling Agno service for message: "${userMessage}"`);

    // 2. Call local Agno Python service with a POST request
    const agentResponse = await fetch(`http://127.0.0.1:8000/api/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!agentResponse.ok) {
      const errorText = await agentResponse.text();
      throw new Error(`Agno Agent service error (${agentResponse.status}): ${errorText || agentResponse.statusText}. Ensure the service is running via "python agent_service.py" on port 8000.`);
    }

    // Parse the response from your Python backend
    const data = await agentResponse.json();

    // Fallback if data.reply is missing in the Python response object structure
    const replyText = data.reply || data.content || JSON.stringify(data);
    const content = `Result Via Agent: \n\n ${replyText}`;

    // 3. Save assistant response to DB if threadId and userId exist
    if (threadId && userId && replyText) {
      try {
        await Message.create({
          threadId,
          userId,
          role: 'assistant',
          content: content.trim(),
        });
        console.log("💾 Saved response to MongoDB successfully.");
      } catch (dbError) {
        console.error("❌ Failed to save message to MongoDB:", dbError);
        // We don't crash the request here so the user still gets their answer visually
      }
    }

    // Return the response from the Agno service back to the frontend
    return NextResponse.json({
      role: 'assistant',
      content: content
    });

  } catch (error: any) {
    console.error("❌ Chat API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}