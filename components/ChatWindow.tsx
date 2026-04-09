"use client";

import React, { useRef, useEffect } from 'react';
import { Message } from './Message';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export const TypingIndicator = () => (
  <div className="flex w-full justify-start px-4 py-4 md:px-0">
    <div className="flex w-full max-w-3xl gap-4 md:gap-6 px-4 md:px-8">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-[#10a37f] text-white">
        <div className="flex gap-1">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
            className="h-1.5 w-1.5 rounded-full bg-white"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
            className="h-1.5 w-1.5 rounded-full bg-white"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
            className="h-1.5 w-1.5 rounded-full bg-white"
          />
        </div>
      </div>
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-500 animate-pulse">Assistant is typing...</span>
      </div>
    </div>
  </div>
);

export const ChatWindow = ({ messages, isLoading }: ChatWindowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or loading state
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto scroll-smooth py-4"
    >
      <div className="mx-auto flex max-w-full flex-col">
        {messages.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center p-4 text-center">
             <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-4 shadow-lg">
                <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
             </div>
             <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Welcome to Metawurks AI</h2>
             <p className="mt-2 text-gray-500 dark:text-gray-400">Ask me anything. I can help you with code, content, and more.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <Message key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
            
            {isLoading && <TypingIndicator />}
          </div>
        )}
        
        {/* Spacer for bottom */}
        <div className="h-4 w-full shrink-0" />
      </div>
    </div>
  );
};
