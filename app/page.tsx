"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { InputArea } from '@/components/InputArea';
import { useTheme } from 'next-themes';
import { Menu, Sun, Moon } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Frontend-Backend Integration (Requirement 5)
  const handleSendMessage = async (content: string, questionId?: string) => {
    // Step A: Immediately add user's message to state (full text)
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Step B: Set loading/typing indicator to true
    setIsLoading(true);

    try {
      // Step C: fetch() to send message (ONLY questionId if available)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: questionId || null,
          messages: [...messages, userMessage]
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');

      const aiMessageData = await response.json();

      // Step D: Add bot's message to state and hide loading indicator
      const aiMessage: Message = {
        ...aiMessageData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Error: Failed to process request. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const isDarkMode = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Sidebar
        onNewChat={() => setMessages([])}
        onClearChat={handleClearChat}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Requirement 59: Header with Title */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur dark:border-gray-800 dark:bg-[#212121]/80 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-sm font-semibold md:text-base">Metawurks AI</h1>
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

        {/* Child Components handling Requirements 60, 61, 82 */}
        <ChatWindow messages={messages} isLoading={isLoading} />

        <div className="shrink-0 pb-4 md:pb-6">
          <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}
