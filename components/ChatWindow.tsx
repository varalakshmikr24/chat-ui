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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null); // Dedicated anchor ref

  // Refined Auto-scroll: Keep pinned to bottom during streaming
  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto scroll-smooth py-4"
    >
      <div className="mx-auto flex max-w-full flex-col">
        {messages.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center p-4 text-center">
             {/* Welcome UI ... */}
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <Message key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
            
            {/* 2. Typing State: Positioned at the end of the message list */}
            {isLoading && <TypingIndicator />}
          </div>
        )}
        
        {/* The Anchor Point for Auto-Scroll */}
        <div ref={scrollEndRef} className="h-4 w-full shrink-0" />
      </div>
    </div>
  );
};