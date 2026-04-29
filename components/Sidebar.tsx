"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, PanelLeft, Trash2, LogIn, LogOut } from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react"; 
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
  activeId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  onRenameChat?: (id: string, newTitle: string) => void;
  onPinChat?: (id: string) => void;
  onArchiveChat?: (id: string) => void;
  onShareChat?: (id: string) => void;
  onClearChat: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  chats?: ChatSession[];
  isLoading?: boolean;
}

export const Sidebar = ({
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
  chats: propChats,
  isLoading: propIsLoading,
}: SidebarProps) => {
  const { data: session, status } = useSession();
  const [localChats, setLocalChats] = useState<ChatSession[]>([]);
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const chats = propChats || localChats;
  const isLoading = propIsLoading !== undefined ? propIsLoading : localIsLoading;

  // 1. Optimized Fetch Logic
  const loadChats = useCallback(async () => {
    if (status !== "authenticated" || propChats) return;
    
    setLocalIsLoading(true);
    try {
      const res = await fetch(`/api/chat?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
      });
      
      if (res.ok) {
        const data = await res.json();
        setLocalChats(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLocalIsLoading(false);
    }
  }, [status, propChats]);

  useEffect(() => {
    loadChats();
  }, [loadChats, status]);

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
        {/* Header Section */}
        <div className="flex h-14 items-center px-3 shrink-0 gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
          >
            <PanelLeft size={20} className={cn(!isOpen && "rotate-180")} />
          </button>

          {isOpen && (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">M</span>
              </div>
              <span className="font-semibold text-sm">Metawurks AI</span>
            </div>
          )}
        </div>

        {/* New Chat Button */}
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

        {/* Search Bar */}
        {isOpen && (
          <div className="px-3 pb-2 shrink-0">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-gray-100 dark:bg-white/5 border border-transparent focus:border-blue-500 p-2 pl-3 text-sm outline-none"
            />
          </div>
        )}

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="px-3 py-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-white/5" />
              ))}
            </div>
          ) : (
            <ChatHistoryList
              searchQuery={searchQuery}
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

        {/* Bottom Navigation & User Profile */}
        <div className="mt-auto p-3 shrink-0 border-t border-gray-200 dark:border-white/5 space-y-1">
          {isOpen && (
            <button
              onClick={onClearChat}
              className="flex items-center gap-3 w-full rounded-lg p-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            >
              <Trash2 size={16} />
              <span>Clear current chat</span>
            </button>
          )}

          {/* AUTHENTICATION UI BLOCK */}
          <div className="pt-2">
            {status === "authenticated" ? (
              <UserAccountNav isCollapsed={!isOpen} />
            ) : (
              <button
                onClick={() => signIn()}
                className={cn(
                  "flex items-center gap-3 w-full rounded-lg p-3 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  !isOpen && "justify-center p-0 h-10 w-10"
                )}
              >
                <LogIn size={18} />
                {isOpen && <span>Sign In</span>}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};