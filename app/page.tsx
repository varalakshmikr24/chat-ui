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
  // Removed 'demo' option completely from chatMode state
  const [chatMode, setChatMode] = useState<'gemini' | 'llama'>('gemini');
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

  // Modified to handle optional file processing via FormData proxy architecture
  const handleSendMessage = async (content: string, file?: File | null) => {
    if (!content.trim() && !file) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Format layout appearance in UI bubble if file is appended
    const displayUserText = file
      ? `📎 Attached: ${file.name}\n\n${content || "Summarize this document."}`
      : content;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: displayUserText,
      timestamp,
    };

    let activeId = currentChatId;
    let initialUpdatedChats: ChatSession[] = [];

    // 1. CHAT SESSION LOGIC
    if (!activeId) {
      activeId = crypto.randomUUID();
      const newChat: ChatSession = {
        id: activeId,
        title: file
          ? `File: ${file.name}`
          : content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        messages: [userMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      initialUpdatedChats = [newChat, ...chats];
      setChats(initialUpdatedChats);
      setCurrentChatId(activeId);
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

    // 2. UPDATE UI STATE FOR USER MESSAGE
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // 3. BUILD MULTIPART PAYLOAD FOR DYNAMIC RAG ENDPOINT
    const formData = new FormData();
    formData.append("message", content || "Summarize the attached document.");
    if (file) {
      formData.append("file", file);
    }

    try {
      // Hit your Next.js internal API Route Proxy
      const response = await fetch('/api/dynamic-rag', {
        method: 'POST',
        body: formData, // Browser auto-injects boundaries
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessageContent = data.response || data.reply || "No response received";

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantMessageContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // 4. APPEND RESPONSE TO ALL SESSIONS & UPDATE STATES
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

    } catch (err: any) {
      console.error("Chat Error:", err);
      const errorMessage = err.message || "Failed to connect to server.";

      if (errorMessage.includes("Quota Exceeded") || errorMessage.includes("429")) {
        setIsLimitExceeded(true);
      }

      const errorAssistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ Error: ${errorMessage}. Please check if the backend service is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorAssistantMessage]);
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
      url: window.location.origin + (id ? `/chat/${id}` : ''),
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
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
        chatMode={chatMode}
        setChatMode={(mode) => {
          setChatMode(mode as 'gemini' | 'llama');
          if (isLimitExceeded) setIsLimitExceeded(false);
        }}
        isLimitExceeded={isLimitExceeded}
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