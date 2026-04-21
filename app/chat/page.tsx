"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputArea } from '@/components/InputArea';
import { MessageSquare } from 'lucide-react';

export default function NewChatPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'demo' | 'gemini' | 'llama'>('gemini');
  const router = useRouter();

  const handleSendMessage = async (content: string) => {
    setIsLoading(true);
    try {
      // 1. Create a new thread
      const threadRes = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: content.slice(0, 30) + (content.length > 30 ? '...' : '') }),
      });

      if (!threadRes.ok) throw new Error('Failed to create thread');
      const newThread = await threadRes.json();
      const threadId = newThread._id;

      // 2. Send the first message
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          threadId: threadId,
          history: [],
          model: chatMode
        }),
      });

      // 3. Redirect to the new thread
      router.push(`/chat/${threadId}`);
    } catch (error) {
      console.error('Error starting new chat:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#212121]">
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
          <MessageSquare className="text-white" size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-12">
          Start a new conversation with Metawurks AI. I can help with coding, writing, debugging, and more.
        </p>
      </div>
      <div className="shrink-0 pb-4 md:pb-6">
        <InputArea 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          chatMode={chatMode}
          setChatMode={setChatMode}
        />
      </div>
    </div>
  );
}
