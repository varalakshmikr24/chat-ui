"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChatWindow } from '@/components/ChatWindow';
import { InputArea } from '@/components/InputArea';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [chatMode, setChatMode] = useState<'demo' | 'gemini' | 'llama'>('gemini');

  useEffect(() => {
    if (threadId) {
      fetchMessages();
    }
  }, [threadId]);

  const fetchMessages = async () => {
    try {
      setIsFetching(true);
      const res = await fetch(`/api/messages/${threadId}`);
      if (res.ok) {
        const data = await res.json();
        const mappedMessages = data.map((msg: any) => ({
          id: msg._id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(mappedMessages);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSendMessage = async (content: string) => {
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
          threadId: threadId,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          model: chatMode
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const aiMessageId = crypto.randomUUID();
      let aiFullContent = "";

      // Add a placeholder message for the assistant
      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'assistant',
        content: "",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        // Hide "thinking" indicator as soon as the first chunk arrives
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
    <>
      <ChatWindow messages={messages} isLoading={isLoading} />
      <div className="shrink-0 pb-4 md:pb-6">
        <InputArea 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          chatMode={chatMode}
          setChatMode={setChatMode}
        />
      </div>
    </>
  );
}
