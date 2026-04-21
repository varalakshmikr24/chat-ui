"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useRouter, useParams } from 'next/navigation';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatMode, setChatMode] = useState<'demo' | 'gemini' | 'llama'>('gemini');
  
  const router = useRouter();
  const params = useParams();
  const activeThreadId = params.threadId as string;
  
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/threads');
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    // Optimistic UI could go here, but let's do simple first
    try {
        const res = await fetch('/api/threads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'New Conversation' }),
        });
        if (res.ok) {
            const newThread = await res.json();
            setThreads(prev => [newThread, ...prev]);
            router.push(`/chat/${newThread._id}`);
        }
    } catch (error) {
        console.error('Failed to create thread:', error);
    }
  };

  const handleSelectChat = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // For now just UI filter, actual delete API could be added
    setThreads(prev => prev.filter(t => t._id !== id));
    if (activeThreadId === id) {
        router.push('/chat');
    }
  };

  const mappedThreads = threads.map(t => ({
    id: t._id,
    title: t.title,
    messages: [],
    createdAt: new Date(t.createdAt).getTime(),
    updatedAt: new Date(t.updatedAt).getTime(),
  }));

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Sidebar
        chats={mappedThreads}
        activeId={activeThreadId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onClearChat={() => {}}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        chatMode={chatMode}
        setChatMode={setChatMode}
        isLoading={isLoading}
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
          </div>

          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {mounted && (resolvedTheme === 'dark' ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />)}
          </button>
        </header>

        {children}
      </main>
    </div>
  );
}
