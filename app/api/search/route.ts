import { NextResponse } from "next/server";
import { getRealTimeData } from "@/lib/tavily";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" }, 
        { status: 400 }
      );
    }

    // Call the function you created in lib/tavily.ts
    const searchData = await getRealTimeData(query);

    if (!searchData) {
      return NextResponse.json(
        { error: "Failed to fetch real-time data" }, 
        { status: 500 }
      );
    }

    return NextResponse.json(searchData);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}