"use client";

import React from 'react';
import { Plus, PanelLeft, Trash2, X, MoreHorizontal } from 'lucide-react'; // Added MoreHorizontal
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChatHistoryList } from './ChatHistoryList';
import { UserAccountNav } from './UserAccountNav';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
}

interface SidebarProps {
  chats: ChatSession[];
  activeId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  // Add these new props for your menu actions
  onRenameChat?: (id: string) => void;
  onPinChat?: (id: string) => void;
  onArchiveChat?: (id: string) => void;
  onShareChat?: (id: string) => void;
  onClearChat: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  chatMode: 'demo' | 'gemini' | 'llama';
  setChatMode: (mode: 'demo' | 'gemini' | 'llama') => void;
  isLimitExceeded?: boolean;
  isLoading?: boolean;
}

export const Sidebar = ({
  chats,
  activeId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onPinChat,
  onArchiveChat,
  onShareChat,
  onClearChat,
  isOpen,
  setIsOpen,
  isLoading
}: SidebarProps) => {

  const [searchQuery, setSearchQuery] = React.useState("");
  const filteredChats = chats
    .filter((chat) => !chat.isArchived)
    .filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-[#171717] text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-white/5 transition-all duration-300 h-full",
        isOpen ? "w-64" : "w-0 overflow-hidden lg:w-[60px]"
      )}>

        <div className="flex h-14 items-center px-3 shrink-0 gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            <PanelLeft size={20} className={cn(!isOpen && "rotate-180")} />
          </button>

          <div className={cn(
            "flex items-center gap-2 overflow-hidden transition-all duration-300",
            isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
          )}>
            <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">M</span>
            </div>
            <span className="font-semibold text-sm whitespace-nowrap">Metawurks AI</span>
          </div>
        </div>

        <div className="px-3 pb-2 shrink-0">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) setIsOpen(false);
            }}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-gray-200 dark:border-white/20 p-3 text-sm font-medium transition-all hover:bg-gray-100 dark:hover:bg-white/10",
              isOpen ? "w-full" : "w-10 h-10 justify-center p-0"
            )}
          >
            <Plus size={18} />
            {isOpen && <span>New chat</span>}
          </button>
        </div>

        {isOpen && (
          <div className="px-3 pb-2 shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-gray-100 dark:bg-white/5 border border-transparent focus:border-blue-500 p-2 pl-3 text-sm outline-none transition-all"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="px-3 py-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-white/5" />
              ))}
            </div>
          ) : (
            <ChatHistoryList
              chats={filteredChats}
              activeId={activeId}
              onSelectChat={onSelectChat}
              onDeleteChat={onDeleteChat}
              onRenameChat={onRenameChat}
              onPinChat={onPinChat}
              onArchiveChat={onArchiveChat}
              onShareChat={onShareChat}
              isOpen={isOpen}
            />
          )}
        </div>

        <div className="mt-auto p-3 shrink-0 border-t border-gray-200 dark:border-white/5 space-y-1">
          {isOpen && (
            <button
              onClick={onClearChat}
              className="flex items-center gap-3 w-full rounded-lg p-3 text-sm text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-950/30 mb-1"
            >
              <Trash2 size={16} />
              <span>Clear current chat</span>
            </button>
          )}
          <UserAccountNav isCollapsed={!isOpen} />
        </div>

        {isOpen && (
          <button
            className="absolute right-[-48px] top-4 rounded-md border border-gray-200 dark:border-white/20 bg-white dark:bg-[#171717] p-2 text-gray-600 dark:text-white lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        )}
      </aside>
    </>
  );
};