"use client";

import React, { useState } from 'react';
import { Plus, MessageSquare, Menu, X, Trash2, Settings } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  onNewChat: () => void;
  onClearChat: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar = ({ onNewChat, onClearChat, isOpen, setIsOpen }: SidebarProps) => {
  const [history] = useState([
    { id: '1', title: 'Brainstorming SaaS ideas' },
    { id: '2', title: 'React Performance Tips' },
    { id: '3', title: 'Next.js 14 vs 15' },
    { id: '4', title: 'Tailwind CSS v4 overview' },
  ]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#171717] text-white transition-transform duration-300 lg:static lg:translate-x-0 h-full",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) setIsOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-md border border-white/20 p-3 text-sm font-medium transition-colors hover:bg-white/10"
          >
            <Plus size={16} />
            New chat
          </button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="mb-2 text-xs font-semibold uppercase text-gray-500 px-3">Recents</div>
          <div className="space-y-1">
            {history.map((item) => (
              <button
                key={item.id}
                className="group flex w-full items-center gap-3 rounded-md p-3 text-sm transition-colors hover:bg-white/10"
              >
                <MessageSquare size={16} className="shrink-0 text-gray-400" />
                <span className="truncate text-left">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 space-y-2">
          <button 
            onClick={onClearChat}
            className="flex w-full items-center gap-3 rounded-md p-2 text-sm text-red-400 transition-colors hover:bg-red-950/30"
          >
            <Trash2 size={16} />
            Clear Chat
          </button>
          <button className="flex w-full items-center gap-3 rounded-md p-2 text-sm transition-colors hover:bg-white/10">
            <Settings size={16} />
            Settings
          </button>
        </div>

        {/* Close button for mobile */}
        <button 
          className="absolute right-[-48px] top-4 rounded-md border border-white/20 bg-[#171717] p-2 text-white lg:hidden"
          onClick={() => setIsOpen(false)}
        >
          <X size={20} />
        </button>
      </aside>
    </>
  );
};
