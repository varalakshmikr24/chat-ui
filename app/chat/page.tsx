"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { InputArea } from '@/components/InputArea';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
}

export default function ChatPage() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatMode, setChatMode] = useState<'demo' | 'gemini' | 'llama'>('gemini');
  const [isLimitExceeded, setIsLimitExceeded] = useState(false);
  
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Load chats from localStorage
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
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp,
    };

    let activeId = currentChatId;
    let updatedChats = [...chats];

    if (!activeId) {
      activeId = Date.now().toString();
      const newChat: ChatSession = {
        id: activeId,
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        messages: [userMessage],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updatedChats = [newChat, ...updatedChats];
      setChats(updatedChats);
      setCurrentChatId(activeId);
    } else {
      updatedChats = updatedChats.map(chat => {
        if (chat.id === activeId) {
          return {
            ...chat,
            messages: [...chat.messages, userMessage],
            updatedAt: Date.now()
          };
        }
        return chat;
      }).sort((a, b) => b.updatedAt - a.updatedAt);
      setChats(updatedChats);
    }

    setMessages(updatedChats.find(c => c.id === activeId)?.messages || []);
    setIsLoading(true);

    try {
      let aiMessageContent = "";
      let aiMessageId = Date.now().toString();

      if (chatMode === 'demo') {
        const QUESTION_MAP: Record<string, string> = {
          'chat_q1': "The Next.js App Router uses React Server Components for better performance.",
          'chat_q2': "We use useState for local state and next-themes for theme management.",
        };
        
        await new Promise((resolve) => setTimeout(resolve, 1000));
        aiMessageContent = questionId && QUESTION_MAP[questionId] ? QUESTION_MAP[questionId] : "I'm in Demo Mode. How can I help you today?";
      } else {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage.content,
            history: updatedChats.find(c => c.id === activeId)?.messages.slice(0, -1) || [],
            model: chatMode
          }),
        });

        if (!response.ok) {
           const errData = await response.json().catch(() => ({}));
           if (response.status === 429) {
             setIsLimitExceeded(true);
             setChatMode('demo');
             throw new Error("Quota exceeded. Switched to Demo Mode.");
           }
           throw new Error(errData.error || 'Failed to fetch response');
        }
        
        const aiMessageData = await response.json();
        aiMessageContent = aiMessageData.content;
        aiMessageId = aiMessageData.id;
      }

      const aiMessage: Message = {
        id: aiMessageId,
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
      }).sort((a, b) => b.updatedAt - a.updatedAt));
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
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
    if (currentChatId === id) handleNewChat();
  };

  const handleClearCurrent = () => {
    if (currentChatId) {
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId ? { ...chat, messages: [], updatedAt: Date.now() } : chat
      ));
    }
    setMessages([]);
  };

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Sidebar
        chats={chats}
        activeId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onClearChat={handleClearCurrent}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        chatMode={chatMode}
        setChatMode={(mode) => {
          setChatMode(mode as 'demo' | 'gemini' | 'llama');
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
               <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">M</span>
                  </div>
                  <h1 className="text-sm font-semibold">Metawurks AI</h1>
               </div>
            )}
            <div className="flex items-center gap-2 ml-2">
              <span className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                chatMode === 'demo' ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              )}>
                {chatMode === 'demo' ? 'Mock Mode' : 'Live Mode'}
              </span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {mounted && (resolvedTheme === 'dark' ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />)}
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
