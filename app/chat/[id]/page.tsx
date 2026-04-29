"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatWindow } from '@/components/ChatWindow';
import { InputArea } from '@/components/InputArea';
import { AlertCircle, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [chatMode, setChatMode] = useState<'demo' | 'gemini' | 'llama'>('gemini');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchMessages();
    }
  }, [id]);

  const fetchMessages = async () => {
    try {
      setIsFetching(true);
      const res = await fetch(`/api/messages/${id}`);
      if (res.ok) {
        const data = await res.json();
        const mappedMessages = data.map((msg: any) => ({
          id: msg._id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(mappedMessages);
      } else if (res.status === 404) {
          router.push('/');
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    setError(null); // Clear previous errors
    
    // OPTIMISTIC UPDATE: Add user message immediately
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
          chatId: id,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          model: chatMode
        }),
      });

      // QUOTA HANDLING: Check for 429 status code
      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Quota Exceeded: Your daily limit is reached. Please try again tomorrow.");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch response');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const aiMessageId = crypto.randomUUID();
      let aiFullContent = "";

      // Add a placeholder message for the assistant immediately
      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'assistant',
        content: "",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      if (reader) {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Hide global loading indicator as soon as streaming starts
            if (isLoading) setIsLoading(false);
            
            const chunk = decoder.decode(value, { stream: true });
            
            // Check if chunk contains an error JSON
            if (chunk.includes('{"error":')) {
                try {
                    const errObj = JSON.parse(chunk);
                    throw new Error(errObj.error);
                } catch (e) {
                    // Not valid JSON, just treat as text
                }
            }

            aiFullContent += chunk;

            setMessages(prev => prev.map(m => 
              m.id === aiMessageId ? { ...m, content: aiFullContent } : m
            ));
          }
      }

    } catch (error: any) {
      console.error(error);
      setError(error.message || "Failed to connect to server.");
      
      // Update the last assistant message with error if it exists, or add a new one
      setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content === "") {
              return prev.map((m, idx) => 
                idx === prev.length - 1 ? { ...m, content: `Error: ${error.message}`, isError: true } : m
              );
          }
          return [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Error: ${error.message}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isError: true
          }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* User-friendly Toast Notification for Quota/Errors */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md">
            <AlertCircle size={18} className="shrink-0" />
            <p className="text-sm font-medium pr-4">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <ChatWindow messages={messages} isLoading={isLoading && messages.length > 0 && messages[messages.length-1].role !== 'assistant'} />
      
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
