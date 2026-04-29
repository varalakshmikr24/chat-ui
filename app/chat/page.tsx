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
      // Send message to the API with threadId: 'new'
      // The API will create the thread and return its ID in the X-Thread-Id header
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          threadId: 'new',
          history: [],
          model: chatMode
        }),
      });

      if (!response.ok) throw new Error('Failed to start chat');
      
      const newThreadId = response.headers.get('X-Thread-Id');
      
      if (newThreadId) {
          // Redirect to the newly created thread
          // The thread page will fetch the message we just sent (since it's in the DB now)
          router.push(`/chat/${newThreadId}`);
      } else {
          router.push('/chat');
      }
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
