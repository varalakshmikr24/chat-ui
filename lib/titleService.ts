import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateTitle(message: string): Promise<string> {
  try {
    const modelInstance = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const titlePrompt = `Summarize this user request into a concise 3-5 word title. Return only the title text. Request: "${message}"`;
    const titleResult = await modelInstance.generateContent(titlePrompt);
    const responseText = titleResult.response.text();
    if (responseText && responseText.trim()) {
      return responseText.trim().replace(/["']/g, '');
    }
  } catch (err) {
    console.error("Title generation failed.", err);
  }
  return message.slice(0, 30) + (message.length > 30 ? '...' : '');
}
