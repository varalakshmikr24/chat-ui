"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputArea } from '@/components/InputArea';
import { ChatWindow } from '@/components/ChatWindow';
import { MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

export default function NewChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'demo' | 'gemini' | 'llama'>('gemini');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const router = useRouter();

  const handleSendMessage = async (content: string) => {
    // Optimistic UI Update
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          threadId: activeThreadId || 'new',
          history: messages.map(m => ({ role: m.role, content: m.content })),
          model: chatMode
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');
      
      const newThreadId = response.headers.get('X-Thread-Id');
      if (newThreadId && newThreadId !== activeThreadId) {
         setActiveThreadId(newThreadId);
         window.history.replaceState(null, '', `/chat/${newThreadId}`);
         
         const newTitle = response.headers.get('X-Thread-Title');
         if (newTitle) {
            window.dispatchEvent(new CustomEvent('chat-title-updated', { 
               detail: { threadId: newThreadId, title: decodeURIComponent(newTitle), isNew: true } 
            }));
         }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const aiMessageId = crypto.randomUUID();
      let aiFullContent = "";

      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'assistant',
        content: "",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        setIsLoading(false);
        const chunk = decoder.decode(value);
        aiFullContent += chunk;

        setMessages(prev => prev.map(m => 
          m.id === aiMessageId ? { ...m, content: aiFullContent } : m
        ));
      }

    } catch (error: any) {
      console.error(error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#212121]">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
            <MessageSquare className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-12">
            Start a new conversation with Metawurks AI. I can help with coding, writing, debugging, and more.
          </p>
        </div>
      ) : (
        <ChatWindow messages={messages} isLoading={isLoading} />
      )}
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
