"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { InputArea } from '@/components/InputArea';
import { Sun, Moon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from 'next-themes';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
}

export default function Home() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatMode, setChatMode] = useState<'demo' | 'gemini' | 'llama'>('gemini');
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Load chats from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedChats = localStorage.getItem('metawurks_chats');
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setChats(parsed);
      } catch (e) {
        console.error('Failed to parse chats:', e);
      }
    }
  }, []);

  // Sync chats to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('metawurks_chats', JSON.stringify(chats));
    }
  }, [chats, mounted]);

  const handleSendMessage = async (content: string, questionId?: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp,
    };

    let activeId = currentChatId;
    let initialUpdatedChats: ChatSession[] = [];
    let assistantMessageId: string | null = null;

    // 2. UPDATE UI STATE (Only call these once)
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 1. CHAT SESSION LOGIC (Wait for DB to create Chat)
      if (!activeId) {
        const res = await fetch('/api/conversations', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          activeId = data.id;
          setCurrentChatId(activeId);
          window.history.replaceState(null, '', `/chat/${activeId}`);
        } else {
           throw new Error("Failed to create conversation");
        }
        const newChat: ChatSession = {
          id: activeId!,
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
          messages: [userMessage],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        initialUpdatedChats = [newChat, ...chats];
        setChats(initialUpdatedChats);
      } else {
        initialUpdatedChats = chats.map(chat => {
          if (chat.id === activeId) {
            return {
              ...chat,
              messages: [...chat.messages, userMessage],
              updatedAt: Date.now()
            };
          }
          return chat;
        }).sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.updatedAt - a.updatedAt;
        });
        setChats(initialUpdatedChats);
      }
      if (chatMode === 'demo') {
        const QUESTION_MAP: Record<string, string> = {
          'chat_q1': "The Next.js App Router (introduced in version 13) uses React Server Components to simplify data fetching and improve performance by reducing the amount of JavaScript sent to the client.",
          'chat_q2': "In this application, we use React's `useState` for local message state and `next-themes` for global theme management. For larger apps, tools like Zustand or Redux are often preferred.",
          'chat_q3': "TypeScript provides static type checking, which catches errors early in development, improves IDE autocompletion, and makes the codebase much easier to refactor and maintain.",
          'chat_q4': "This project follows a modular Next.js App Router structure. Components are stored in `/components`, pages in `/app`, and API logic in `/app/api` for clear separation of concerns.",
          'chat_q5': "To deploy to Vercel, push your code to GitHub, connect your repository in the Vercel dashboard, and it will automatically build and deploy your application with every push.",
          'chat_q6': "Tailwind CSS v4 introduces a new 'high-performance' engine, zero-config setup, and first-class support for modern CSS features like CSS variables and container queries.",
          'chat_q7': "Manual dark mode is implemented using the `dark:` utility classes in Tailwind. The `next-themes` library handles the logic of adding the `.dark` class to the HTML element.",
          'chat_q8': "API Route Handlers in Next.js allow you to create RESTful endpoints. They run on the server, meaning you can safely handle secret keys and database connections away from the client.",
          'chat_q9': "React Server Components (RSC) allow components to be rendered on the server. This results in faster page loads as the initial HTML is generated and sent before the JavaScript hydrates.",
          'chat_q10': "Optimization techniques in Next.js include using the `<Image />` component for automatic optimization, implementing dynamic imports, and leveraging Incremental Static Regeneration (ISR).",
        };

        const TEXT_TO_ID_MAP: Record<string, string> = {
          "tell me about next.js app router": "chat_q1",
          "how does state management work here?": "chat_q2",
          "what are the benefits of typescript?": "chat_q3",
          "explain the project architecture": "chat_q4",
          "how to deploy this to vercel?": "chat_q5",
          "what is tailwind css v4's main feature?": "chat_q6",
          "how to implement dark mode manually?": "chat_q7",
          "what is the role of an api route handler?": "chat_q8",
          "explain react server components": "chat_q9",
          "how to optimize performance in next.js?": "chat_q10",
        };

        const userContent = content.trim().toLowerCase();
        await new Promise((resolve) => setTimeout(resolve, 1500));

        let aiMessageContent = "";
        if (questionId && QUESTION_MAP[questionId]) {
          aiMessageContent = QUESTION_MAP[questionId];
        } else if (TEXT_TO_ID_MAP[userContent]) {
          aiMessageContent = QUESTION_MAP[TEXT_TO_ID_MAP[userContent]];
        } else {
          aiMessageContent = "That's an interesting question. I'm currently set up to provide detailed answers to preset professional questions in Demo Mode, but I can tell you that Metawurks AI is designed for enterprise-grade performance and scalability.";
        }

        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: aiMessageContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChats(prev => prev.map(chat => {
          if (chat.id === activeId) {
            return {
              ...chat,
              messages: [...chat.messages, aiMessage],
              updatedAt: Date.now()
            };
          }
          return chat;
        }).sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.updatedAt - a.updatedAt;
        }));

        setMessages(prev => [...prev, aiMessage]);
      } else {
        // LIVE STREAMING MODE
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            history: initialUpdatedChats.find(c => c.id === activeId)?.messages.slice(-10) || [],
            conversationId: activeId,
            model: chatMode
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const newChatId = response.headers.get('X-Chat-Id');
        if (newChatId && !activeId) {
          window.history.replaceState(null, '', `/chat/${newChatId}`);
          setCurrentChatId(newChatId);
          activeId = newChatId;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantMessageContent = "";

        assistantMessageId = crypto.randomUUID();
        setMessages(prev => [...prev, {
          id: assistantMessageId!,
          role: 'assistant',
          content: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            if (chunk.startsWith('{"error":')) {
              const errorObj = JSON.parse(chunk);
              throw new Error(errorObj.error);
            }

            assistantMessageContent += chunk;

            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId ? { ...msg, content: assistantMessageContent } : msg
            ));
          }

          // Update final chat history with the full content
          setChats(prev => prev.map(chat => {
            if (chat.id === activeId) {
              const fullAssistantMessage: Message = {
                id: assistantMessageId!,
                role: 'assistant',
                content: assistantMessageContent,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              return {
                ...chat,
                messages: [...chat.messages, fullAssistantMessage],
                updatedAt: Date.now()
              };
            }
            return chat;
          }).sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.updatedAt - a.updatedAt;
          }));
        }
      }
    } catch (err: any) {
      console.error("Chat Error:", err);
      const errorMessage = err.message || "Failed to connect to server.";

      if (errorMessage.includes("Quota Exceeded") || errorMessage.includes("429")) {
        setIsLimitExceeded(true);
        setChatMode('demo');
      }

      setMessages(prev => {
        // If we have a placeholder ID, find it and update it
        if (assistantMessageId) {
          return prev.map(msg =>
            msg.id === assistantMessageId
              ? {
                ...msg,
                content: `Error: ${errorMessage}`,
                isError: true
              }
              : msg
          );
        }

        // Otherwise, add a new error message
        const errorAssistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${errorMessage}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        };
        return [...prev, errorAssistantMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  const handleSelectChat = (id: string) => {
    const chat = chats.find(c => c.id === id);
    if (chat) {
      setCurrentChatId(id);
      setMessages(chat.messages);
    }
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) {
      handleNewChat();
    }
  };

  const handleRenameChat = async (id: string, newTitle: string) => {
    try {
      // Optimistic update
      setChats(prev => prev.map(chat => 
        chat.id === id ? { ...chat, title: newTitle, updatedAt: Date.now() } : chat
      ).sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
      }));
    } catch (error) {
      console.error("Failed to rename chat:", error);
    }
  };

  const handlePinChat = (id: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, isPinned: !chat.isPinned } : chat
    ).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    }));
  };

  const handleArchiveChat = (id: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, isArchived: true } : chat
    ));
    if (currentChatId === id) {
      handleNewChat();
    }
  };

  const handleShareChat = async (id: string) => {
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    const shareData = {
      title: chat.title,
      text: `Check out this chat session: ${chat.title}`,
      url: window.location.origin + (id ? `/chat/${id}` : ''), // Fallback URL
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        // Using a simple toast or alert logic here
        console.log("Copied to clipboard");
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error("Error sharing:", err);
      }
    }
  };

  const handleClearCurrent = () => {
    if (currentChatId) {
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId ? { ...chat, messages: [], updatedAt: Date.now() } : chat
      ));
    }
    setMessages([]);
  };

  const isDarkMode = resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDarkMode ? 'light' : 'dark');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Sidebar
        chats={chats}
        activeId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onPinChat={handlePinChat}
        onArchiveChat={handleArchiveChat}
        onShareChat={handleShareChat}
        onClearChat={handleClearCurrent}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main
        className={cn(
          "relative flex flex-1 flex-col overflow-hidden transition-all duration-300",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-[60px]"
        )}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur dark:border-gray-800 dark:bg-[#212121]/80 z-20">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-bold">M</span>
                </div>
                <h1 className="text-sm font-semibold md:text-base">Metawurks AI</h1>
              </div>
            )}

            <div className="flex items-center gap-2 ml-2">
              {chatMode === 'demo' ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
                  Mock Mode
                </span>
              ) : (
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                  chatMode === 'gemini'
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                )}>
                  <span className={cn(
                    "mr-1 h-1.5 w-1.5 rounded-full",
                    chatMode === 'gemini' ? "bg-emerald-500" : "bg-blue-500"
                  )}></span>
                  {chatMode === 'gemini' ? 'Gemini Live' : 'Llama 3.1 Live'}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle Theme"
          >
            {!mounted ? (
              <div className="h-5 w-5" />
            ) : (
              isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600" />
            )}
          </button>
        </header>

        <ChatWindow messages={messages} isLoading={isLoading} />

        <div className="shrink-0 pb-4 md:pb-6">
          <InputArea
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            chatMode={chatMode}
            setChatMode={setChatMode}
          />
        </div>
      </main>
    </div>
  );
}
