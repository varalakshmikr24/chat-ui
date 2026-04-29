// app/api/conversations/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth"; // Import the auth helper from your auth.ts
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat"; // Ensure you have a Chat or Conversation model

export async function GET() {
    try {
        const session = await auth();

        // 1. Check if user is logged in
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // 2. Fetch chats belonging ONLY to this user
        // We use email because it's consistent across logins
        const chats = await Chat.find({ userEmail: session.user.email })
            .sort({ updatedAt: -1 }) // Show newest first
            .limit(50); // Don't overload the sidebar

        return NextResponse.json(chats);
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}