import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import Thread from '@/models/Thread';
import { getRealTimeData } from '@/lib/tavily';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

export const dynamic = 'force-dynamic';

class StreamFilter {
  buffer = "";
  isTool = false;
  extractedCalls: any[] = [];

  process(chunk: string): string {
    if (this.isTool) {
      this.buffer += chunk;
      return "";
    }
    
    this.buffer += chunk;
    
    // Check if we definitely have a tool tag
    const funcIdx = this.buffer.indexOf("<function=");
    const toolIdx = this.buffer.indexOf("<tool_call>");
    
    let firstTagIdx = -1;
    if (funcIdx !== -1 && toolIdx !== -1) firstTagIdx = Math.min(funcIdx, toolIdx);
    else if (funcIdx !== -1) firstTagIdx = funcIdx;
    else if (toolIdx !== -1) firstTagIdx = toolIdx;

    if (firstTagIdx !== -1) {
       this.isTool = true;
       const safeText = this.buffer.slice(0, firstTagIdx);
       this.buffer = this.buffer.slice(firstTagIdx);
       return safeText;
    }

    // Check for partial tags at the end
    let safeIdx = this.buffer.length;
    for (let i = this.buffer.length - 1; i >= 0; i--) {
       if (this.buffer[i] === '<') {
          const suffix = this.buffer.slice(i);
          if ("<function=".startsWith(suffix) || "<tool_call>".startsWith(suffix)) {
             safeIdx = i;
             break;
          }
       }
    }

    const safeText = this.buffer.slice(0, safeIdx);
    this.buffer = this.buffer.slice(safeIdx);
    return safeText;
  }

  flush(): string {
    if (this.isTool) return "";
    const safeText = this.buffer;
    this.buffer = "";
    return safeText;
  }

  getToolCalls() {
    if (this.isTool) {
      const match = this.buffer.match(/<function=([^>]+)>(.*?)<\/function>/s) || this.buffer.match(/<tool_call>\s*(.*?)\s*<\/tool_call>/s);
      if (match) {
        const funcName = this.buffer.includes("<function=") ? match[1] : "tavily_search";
        const argsStr = match[2];
        this.extractedCalls.push({
          id: "call_" + Date.now(),
          type: 'function',
          function: { name: funcName, arguments: argsStr }
        });
      }
    }
    return this.extractedCalls;
  }
}

export async function POST(req: Request) {
  console.log("Chat API POST request received");
  try {
    const session = await auth();
    const body = await req.json();
    const { message, history, model, threadId } = body;
    const userId = session?.user ? (session.user as any).id : null;
    const modelName = model || 'gemini';

    console.log("User ID:", userId, "Model:", modelName);

    await connectDB();

    let validThreadId = threadId;
    let isNewThread = false;

    if (!validThreadId || validThreadId === 'new' || !mongoose.Types.ObjectId.isValid(validThreadId)) {
        isNewThread = true;
    }

    let generatedTitle = '';
    
    // 1. SAVE USER MESSAGE AND THREAD
    if (userId) {
      if (isNewThread) {
         try {
            const modelInstance = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const titlePrompt = `Summarize this user request into a concise 3-5 word title. Return only the title text. Request: "${message}"`;
            
            let responseText = "";
            try {
              const titleResult = await modelInstance.generateContent(titlePrompt);
              responseText = titleResult.response.text();
            } catch (quotaErr) {
              console.error("Gemini Title Quota Exceeded, using fallback");
              responseText = message.slice(0, 30) + (message.length > 30 ? "..." : "");
            }
            
            if (responseText && responseText.trim()) {
              generatedTitle = responseText.trim().replace(/["']/g, ''); // Remove quotes
            }
          } catch (e) {
            console.error("Title generation failed", e);
            generatedTitle = message.slice(0, 40) + (message.length > 40 ? '...' : '');
          }

          const newThread = await Thread.create({
            userId,
            title: generatedTitle || 'New Conversation',
          });
          validThreadId = newThread._id.toString();
      } else {
         const currentThread = await Thread.findById(validThreadId);
         if (currentThread) {
            generatedTitle = currentThread.title;
            await Thread.findByIdAndUpdate(validThreadId, { updatedAt: new Date() });
         }
      }

      try {
        await Message.create({
          threadId: validThreadId, userId, role: 'user', content: message,
        });
      } catch (err) {
        console.error('Failed to save user message:', err);
      }
    }

    const systemPrompt = `
      You are a helpful AI assistant. 
      Today's Date: ${new Date().toLocaleDateString()}
      You have access to a web search tool (Tavily). If a user asks for real-time information, current events, or weather, you MUST use the search tool before answering.
      
      CRITICAL INSTRUCTIONS:
      1. DO NOT output raw function strings like <function=tavily_search> or <tool_call> in your conversational response.
      2. Always summarize the Tavily search results into a helpful, human-friendly answer.
      3. You must use the search results to answer the user directly. Do not explain that you are searching.
      4. You MUST provide the specific numbers (prices, dates, statistics) you find in the search tool output. 
      5. If the search results contain any price or data point, it is STRICTLY FORBIDDEN to say "I don't know," "I cannot find," or "information is unavailable." You must report what the tool returned.
      6. If the user asks a new question, ignore the previous tool outputs and perform a new search or provide a new answer immediately. Do not say "I already answered that" or refer to previous search results unless they are directly relevant to the new question.
    `;

    const messagesForGemini = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: "Understood. I will use the search tool if needed." }] },
      ...(history || [])
        .filter((msg: any) => msg.content && msg.content.trim())
        .map((msg: any) => {
          let cleanedContent = msg.content;
          if (msg.role === 'assistant') {
            cleanedContent = cleanedContent
              .replace(/<function=.*?<\/function>/gs, '')
              .replace(/<tool_call>.*?<\/tool_call>/gs, '')
              .replace(/<function=.*$/gs, '')
              .trim();
          }
          return {
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: cleanedContent || (msg.role === 'assistant' ? "..." : "Hello") }]
          };
        }),
      { role: 'user', parts: [{ text: message }] }
    ];

    const messagesForGroq: any[] = [
      { role: 'system', content: systemPrompt },
      ...(history || [])
        .filter((msg: any) => msg.content && msg.content.trim())
        .map((msg: any) => {
          let cleanedContent = msg.content;
          if (msg.role === 'assistant') {
            cleanedContent = cleanedContent
              .replace(/<function=.*?<\/function>/gs, '')
              .replace(/<tool_call>.*?<\/tool_call>/gs, '')
              .replace(/<function=.*$/gs, '')
              .trim();
          }
          return {
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: cleanedContent || (msg.role === 'assistant' ? "..." : "Hello")
          };
        }),
      { role: 'user', content: message }
    ];

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        try {
          if (modelName === 'llama') {
            const groqTools = [{
              type: "function",
              function: {
                name: "tavily_search",
                description: "Search the web for real-time information, current events, or weather.",
                parameters: {
                  type: "object",
                  properties: { query: { type: "string", description: "The search query." } },
                  required: ["query"]
                }
              }
            }];

            const groqStream = await groq.chat.completions.create({
              messages: messagesForGroq,
              model: "llama-3.1-8b-instant",
              stream: true,
              tools: groqTools as any,
              tool_choice: "auto",
            });

            let toolCalls: any[] = [];
            const filter = new StreamFilter();

            for await (const chunk of groqStream) {
              const delta = chunk.choices[0]?.delta as any;
              if (delta?.tool_calls) {
                 for (const tc of delta.tool_calls) {
                    if (!toolCalls[tc.index]) toolCalls[tc.index] = { id: tc.id, type: 'function', function: { name: tc.function.name || "", arguments: "" } };
                    if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
                 }
              } else if (delta?.content) {
                const safeChunk = filter.process(delta.content);
                if (safeChunk) {
                  fullResponse += safeChunk;
                  controller.enqueue(encoder.encode(safeChunk));
                }
              }
            }
            
            const finalChunk1 = filter.flush();
            if (finalChunk1) {
              fullResponse += finalChunk1;
              controller.enqueue(encoder.encode(finalChunk1));
            }
            
            toolCalls = [...toolCalls, ...filter.getToolCalls()];

            let loopCount = 0;
            while (toolCalls.length > 0 && loopCount < 3) {
               loopCount++;
               console.log(`Groq Tool Loop ${loopCount}, Tool Calls:`, toolCalls.map(tc => tc.function.name));
               
               // Push the tool calls to the history for the NEXT pass in the loop
               messagesForGroq.push({ role: 'assistant', tool_calls: toolCalls, content: "" });
               
               for (const tc of toolCalls) {
                  if (tc.function.name === 'tavily_search') {
                     let args = { query: "" };
                     try {
                        const rawArgs = tc.function.arguments;
                        if (typeof rawArgs === 'string') {
                           try {
                              args = JSON.parse(rawArgs);
                              if (typeof args === 'string') args = { query: args };
                           } catch {
                              // If JSON.parse fails, treat it as a raw string query
                              args = { query: rawArgs.replace(/^["']|["']$/g, '').trim() };
                           }
                        } else {
                           args = rawArgs;
                        }
                     } catch(e) { 
                        console.error("Parsing Error for Tool Args:", e);
                        args = { query: String(tc.function.arguments) }; 
                     }
                     
                     console.log("Tool Call Detected:", tc.function.name);
                     console.log("Executing Tavily Search for:", args.query);
                     const searchData = await getRealTimeData(args.query);
                     
                     let resultText = "";
                     if (!searchData) {
                        console.error("Search Error: Tavily returned null for", args.query);
                        resultText = "I encountered an error while searching. Please say 'I encountered an error while fetching real-time data' to the user.";
                     } else if (!searchData.answer && (!searchData.results || searchData.results.length === 0)) {
                        console.log("Empty results for:", args.query);
                        resultText = "I couldn't find the current price or specific data for this. Please say 'I couldn't find the current price' to the user.";
                     } else {
                        resultText = JSON.stringify(searchData);
                        console.log("Tavily Result Received (Stringified) for:", args.query);
                     }
                     
                     messagesForGroq.push({ role: 'tool', tool_call_id: tc.id, name: tc.function.name, content: resultText });
                  }
               }

               const nextStream = await groq.chat.completions.create({
                  messages: messagesForGroq,
                  model: "llama-3.1-8b-instant",
                  stream: true,
                  tools: groqTools as any,
                  tool_choice: "auto",
               });

               toolCalls = [];
               const loopFilter = new StreamFilter();

               for await (const chunk of nextStream) {
                  const delta = chunk.choices[0]?.delta as any;
                  if (delta?.tool_calls) {
                     for (const tc of delta.tool_calls) {
                        if (!toolCalls[tc.index]) toolCalls[tc.index] = { id: tc.id, type: 'function', function: { name: tc.function.name || "", arguments: "" } };
                        if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
                     }
                  } else if (delta?.content) {
                    const safeChunk = loopFilter.process(delta.content);
                    if (safeChunk) {
                      fullResponse += safeChunk;
                      controller.enqueue(encoder.encode(safeChunk));
                    }
                  }
               }
               const flushChunk = loopFilter.flush();
               if (flushChunk) {
                 fullResponse += flushChunk;
                 controller.enqueue(encoder.encode(flushChunk));
               }
               toolCalls = [...toolCalls, ...loopFilter.getToolCalls()];
            }

            // Fallback for Llama if no response was generated after tool loops
            if (!fullResponse.trim()) {
              console.log("Llama loop finished with empty response, applying fallback");
              const fallback = "I encountered an error while fetching real-time data. Please try again.";
              fullResponse = fallback;
              controller.enqueue(encoder.encode(fallback));
            }
          } else {
            const geminiTools = [{
              functionDeclarations: [{
                name: "tavily_search",
                description: "Search the web for real-time information, current events, or weather.",
                parameters: {
                  type: "OBJECT",
                  properties: { query: { type: "STRING", description: "The search query to look up on the web." } },
                  required: ["query"]
                }
              }]
            }];

            const modelInstance = genAI.getGenerativeModel({ 
              model: "gemini-2.0-flash",
              tools: geminiTools as any,
            });

            let contents = [...messagesForGemini];
            const result = await modelInstance.generateContentStream({ contents });
            
            let functionCallFound = false;
            let functionCallName = "";
            let functionCallArgs: any = {};
            const filter = new StreamFilter();

            for await (const chunk of result.stream) {
              const calls = chunk.functionCalls();
              if (calls && calls.length > 0) {
                functionCallFound = true;
                functionCallName = calls[0].name;
                functionCallArgs = calls[0].args;
                break; 
              }
              try {
                const chunkText = chunk.text();
                if (chunkText) {
                  const safeChunk = filter.process(chunkText);
                  if (safeChunk) {
                    fullResponse += safeChunk;
                    controller.enqueue(encoder.encode(safeChunk));
                  }
                }
              } catch (e) {}
            }
            
            const finalChunkGemini1 = filter.flush();
            if (finalChunkGemini1) {
              fullResponse += finalChunkGemini1;
              controller.enqueue(encoder.encode(finalChunkGemini1));
            }
            
            const rawTools = filter.getToolCalls();
            if (rawTools.length > 0 && !functionCallFound) {
               functionCallFound = true;
               functionCallName = rawTools[0].function.name;
               try {
                 functionCallArgs = JSON.parse(rawTools[0].function.arguments);
               } catch(e) { functionCallArgs = { query: rawTools[0].function.arguments }; }
            }

            let turnCount = 0;
            while (functionCallFound && functionCallName === 'tavily_search' && turnCount < 3) {
               turnCount++;
               console.log("Tool Call Detected (Gemini):", functionCallName);
               console.log(`Gemini Tool Loop ${turnCount}, Query:`, functionCallArgs.query);
               const searchData = await getRealTimeData(functionCallArgs.query);
               
               let resultText = "";
               if (!searchData) {
                  console.error("Search Error (Gemini): Tavily returned null for", functionCallArgs.query);
                  resultText = "I encountered an error while searching. Please say 'I encountered an error while fetching real-time data' to the user.";
               } else if (!searchData.answer && (!searchData.results || searchData.results.length === 0)) {
                  console.log("Empty results (Gemini) for:", functionCallArgs.query);
                  resultText = "I couldn't find the current price or specific data for this. Please say 'I couldn't find the current price' to the user.";
               } else {
                  resultText = JSON.stringify(searchData);
                  console.log("Tavily Result Received (Gemini) for:", functionCallArgs.query);
               }
               
               contents.push({
                 role: 'model',
                 parts: [{ functionCall: { name: functionCallName, args: functionCallArgs } }]
               });
               contents.push({
                 role: 'function',
                 parts: [{ functionResponse: { name: functionCallName, response: { result: resultText } } }]
               });

               const nextResult = await modelInstance.generateContentStream({ contents });
               const loopFilter = new StreamFilter();
               
               functionCallFound = false;
               functionCallName = "";
               functionCallArgs = {};

               for await (const chunk of nextResult.stream) {
                 const calls = chunk.functionCalls();
                 if (calls && calls.length > 0) {
                    functionCallFound = true;
                    functionCallName = calls[0].name;
                    functionCallArgs = calls[0].args;
                    break;
                 }
                 try {
                   const chunkText = chunk.text();
                   if (chunkText) {
                     const safeChunk = loopFilter.process(chunkText);
                     if (safeChunk) {
                       fullResponse += safeChunk;
                       controller.enqueue(encoder.encode(safeChunk));
                     }
                   }
                 } catch (e) {}
               }
               const flushChunk = loopFilter.flush();
               if (flushChunk) {
                 fullResponse += flushChunk;
                 controller.enqueue(encoder.encode(flushChunk));
               }
               
               const rawTools = loopFilter.getToolCalls();
               if (rawTools.length > 0 && !functionCallFound) {
                  functionCallFound = true;
                  functionCallName = rawTools[0].function.name;
                  try {
                    functionCallArgs = JSON.parse(rawTools[0].function.arguments);
                  } catch(e) { functionCallArgs = { query: rawTools[0].function.arguments }; }
               }
            }

            // Fallback for Gemini if no response was generated after tool loops
            if (!fullResponse.trim()) {
              console.log("Gemini loop finished with empty response, applying fallback");
              const fallback = "I encountered an error while fetching real-time data. Please try again.";
              fullResponse = fallback;
              controller.enqueue(encoder.encode(fallback));
            }
          }

          // FINAL SAVE: fullResponse is cleaned by StreamFilter and loopCount logic
          if (validThreadId && userId && fullResponse.trim()) {
            await Message.create({
              threadId: validThreadId, userId, role: 'assistant', content: fullResponse.trim(),
            });
          }
        } catch (err: any) {
          console.error("Streaming error caught:", err);
          let friendlyError = "An error occurred during streaming.";
          if (err.status === 429 || err.message?.includes("429")) {
            friendlyError = "Quota Exceeded: Your daily limit is reached. Please try again tomorrow.";
          }
          controller.enqueue(encoder.encode(friendlyError));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Thread-Id': validThreadId || '',
        'X-Thread-Title': encodeURIComponent(generatedTitle)
      },
    });

  } catch (error: any) {
    console.error('Initial API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    );
  }
}