import { tavily } from "@tavily/core";

// Initialize the client
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

export async function getRealTimeData(query: string) {
    try {
        const response = await tvly.search(query, {
            searchDepth: "advanced", // Use 'advanced' for better accuracy on rates/news
            maxResults: 5,
            includeAnswer: true,     // This gives you a quick AI-generated summary
            topic: "general"         // Change to "news" specifically for news queries
        });

        return response;
    } catch (error) {
        console.error("Tavily Search Error:", error);
        return null;
    }
}