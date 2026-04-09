"use client";

import React, { useState } from 'react';
import { Plus, MessageSquare, Menu, X, Trash2, Settings, PanelLeft } from 'lucide-react';
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
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-[#171717] text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-800 transition-all duration-300 h-full",
        isOpen ? "w-64" : "w-[60px]"
      )}>
        {/* Header with Branding & Toggle */}
        <div className={cn("flex items-center p-4 pb-2", isOpen ? "justify-between" : "justify-center")}>
          {isOpen && (
            <div className="font-semibold text-gray-900 dark:text-white transition-opacity duration-300 opacity-100">
              Metawurks AI
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            title={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            <PanelLeft size={20} className={cn("transition-transform duration-300", !isOpen && "rotate-180")} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 pt-2">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) setIsOpen(false);
            }}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/20 p-3 text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-white/10",
              isOpen ? "w-full" : "w-10 h-10 justify-center p-0 mx-auto"
            )}
            title="New chat"
          >
            <Plus size={18} />
            {isOpen && <span>New chat</span>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {/* Recent history icons could go here */}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-white/10 p-2 space-y-2">
          <button 
            onClick={onClearChat}
            className={cn(
              "flex items-center gap-3 rounded-md p-2 text-sm text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-950/30",
              isOpen ? "w-full" : "w-10 h-10 justify-center p-0 mx-auto"
            )}
            title="Clear Chat"
          >
            <Trash2 size={18} />
            {isOpen && <span>Clear Chat</span>}
          </button>
          <button 
            className={cn(
              "flex items-center gap-3 rounded-md p-2 text-sm transition-all hover:bg-gray-100 dark:hover:bg-white/10",
              isOpen ? "w-full" : "w-10 h-10 justify-center p-0 mx-auto"
            )}
            title="Settings"
          >
            <Settings size={18} />
            {isOpen && <span>Settings</span>}
          </button>
        </div>

        {/* Close button for mobile x */}
        <button 
          className="absolute right-[-48px] top-4 rounded-md border border-gray-200 dark:border-white/20 bg-white dark:bg-[#171717] p-2 text-gray-600 dark:text-white lg:hidden"
          onClick={() => setIsOpen(false)}
        >
          <X size={20} />
        </button>
      </aside>
    </>
  );
};
