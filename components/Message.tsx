"use client";

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

interface MessageProps {
  message: ChatMessage;
}

export const Message = ({ message }: MessageProps) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex w-full px-4 py-3 md:px-8",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      <div className={cn(
        "flex max-w-[85%] md:max-w-[75%] gap-3 group relative",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm mt-1",
          isAssistant ? "bg-[#10a37f] text-white" : "bg-blue-600 text-white"
        )}>
          {isAssistant ? <Bot size={18} /> : <User size={18} />}
        </div>

        {/* Message Content */}
        <div className={cn(
          "flex flex-col gap-1 overflow-hidden",
          isAssistant ? "items-start" : "items-end"
        )}>
          <div className={cn(
            "rounded-2xl p-4 text-sm md:text-base shadow-sm break-words",
            message.isError
              ? "bg-red-500 text-white rounded-tl-none border border-red-400"
              : isAssistant 
                ? "bg-white dark:bg-[#303030] text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700" 
                : "bg-blue-600 text-white rounded-tr-none"
          )}>
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Timestamp & Actions */}
          <div className={cn(
            "flex items-center gap-2 px-1 text-[10px] md:text-xs text-gray-500 font-medium",
            isAssistant ? "flex-row" : "flex-row-reverse"
          )}>
            <span>{message.timestamp}</span>
            {isAssistant && (
              <button
                onClick={handleCopy}
                className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-gray-700 dark:hover:text-gray-300 ml-1"
                title="Copy response"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={13} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
