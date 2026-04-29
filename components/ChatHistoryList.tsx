"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import {
  Trash2, Check, X, MoreHorizontal, Share2,
  Pencil, Pin, Archive
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ChatHistoryList = ({
  activeId,
  searchQuery,
  isOpen
}: any) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchHistory = async () => {
    if (status !== "authenticated") return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (status === "authenticated") {
      fetchHistory();
    }
  }, [status]);

  if (!isOpen || !mounted) return null;

  const filteredChats = chats
    .filter((chat) => !chat.isArchived)
    .filter((chat) => {
      if (!searchQuery) return true;
      return chat.title?.toLowerCase().includes(searchQuery.toLowerCase());
    });

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
      <div className="px-3 pb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex justify-between">
        <span>Recents</span>
        {loading && <span className="animate-pulse">...</span>}
      </div>

      {status === "unauthenticated" ? (
        <div className="px-3 py-2 text-xs text-gray-400 italic text-center">
          Sign in to see history
        </div>
      ) : filteredChats.length === 0 && !loading ? (
        <div className="px-3 py-2 text-xs text-gray-400 italic">No recent chats</div>
      ) : (
        filteredChats.map((chat) => (
          <div
            key={chat.id || chat._id}
            onClick={() => router.push(`/chat/${chat.id || chat._id}`)}
            className={cn(
              "group relative flex items-center w-full rounded-lg px-3 py-2 text-sm text-left cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-[#2f2f2f]",
              activeId === (chat.id || chat._id) ? "bg-gray-100 dark:bg-[#2f2f2f] text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"
            )}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0 pl-1">
              <span className="truncate font-medium">{chat.title || "New Chat"}</span>
            </div>
            
          </div>
        ))
      )}
    </div>
  );
};