"use client";

import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatHistoryListProps {
  chats: ChatSession[];
  activeId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
}

export const ChatHistoryList = ({ 
  chats, 
  activeId, 
  onSelectChat, 
  onDeleteChat,
  isOpen 
}: ChatHistoryListProps) => {
  if (!isOpen) return null;

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
      <div className="px-3 pb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        Recents
      </div>
      
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className={cn(
            "group relative flex items-center w-full rounded-lg px-3 py-2 text-sm text-left cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-white/10",
            activeId === chat.id ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
          )}
        >
          <MessageSquare size={16} className="mr-3 shrink-0 opacity-60" />
          <span className="truncate pr-6 font-medium">
            {chat.title}
          </span>
          
          <button
            onClick={(e) => onDeleteChat(chat.id, e)}
            className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity z-10"
            title="Delete chat"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
