"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Trash2, 
  Check, 
  X, 
  MoreHorizontal, 
  Share2, 
  Pencil, 
  Pin, 
  Archive 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
}

interface ChatHistoryListProps {
  chats: ChatSession[];
  activeId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onPinChat?: (id: string) => void;
  onArchiveChat?: (id: string) => void;
  onShareChat?: (id: string) => void;
  isOpen: boolean;
}

export const ChatHistoryList = ({ 
  chats, 
  activeId, 
  onSelectChat, 
  onDeleteChat,
  onRenameChat,
  onPinChat,
  onArchiveChat,
  onShareChat,
  isOpen 
}: ChatHistoryListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  if (!isOpen) return null;

  const handleStartEdit = (chat: ChatSession) => {
    setEditingId(chat.id);
    setTempTitle(chat.title);
    setOpenMenuId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleSaveEdit = async (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    if (tempTitle.trim() === "") return;
    onRenameChat(id, tempTitle);
    setEditingId(null);
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      const rect = triggerRefs.current[id]?.getBoundingClientRect();
      if (rect) {
        setMenuPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.right - 192, // 192px is w-48
        });
      }
      setOpenMenuId(id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
      <div className="px-3 pb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        Recents
      </div>
      
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => editingId !== chat.id && onSelectChat(chat.id)}
          className={cn(
            "group relative flex items-center w-full rounded-lg px-3 py-2 text-sm text-left cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-[#2f2f2f]",
            activeId === chat.id ? "bg-gray-100 dark:bg-[#2f2f2f] text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300",
            openMenuId === chat.id && "bg-gray-100 dark:bg-[#2f2f2f]"
          )}
        >
          {editingId === chat.id ? (
            <input
              autoFocus
              suppressHydrationWarning
              className="flex-1 bg-white dark:bg-[#212121] border border-blue-500 rounded px-1 outline-none mr-10 text-sm py-0.5 ml-1"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(e, chat.id)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex items-center gap-1.5 flex-1 min-w-0 pl-1">
              <span className="truncate font-medium">
                {chat.title}
              </span>
              {chat.isPinned && (
                <Pin size={10} className="shrink-0 text-blue-500 fill-blue-500/20" />
              )}
            </div>
          )}
          
          {/* Action Button (Three Dots) */}
          <div className={cn(
            "absolute right-2 flex items-center gap-1 transition-opacity z-20",
            openMenuId === chat.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            {editingId === chat.id ? (
              <div className="flex gap-1">
                <button 
                  suppressHydrationWarning
                  onClick={(e) => handleSaveEdit(e, chat.id)} 
                  className="p-1 hover:text-green-500 transition-colors"
                >
                  <Check size={14} />
                </button>
                <button 
                  suppressHydrationWarning
                  onClick={handleCancelEdit} 
                  className="p-1 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                ref={(el) => { triggerRefs.current[chat.id] = el; }}
                suppressHydrationWarning
                onClick={(e) => toggleMenu(e, chat.id)}
                className={cn(
                  "p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors",
                  openMenuId === chat.id && "bg-gray-200 dark:bg-white/10"
                )}
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Portal for Dropdown Menu */}
      {mounted && createPortal(
        <AnimatePresence>
          {openMenuId && (() => {
            const activeChat = chats.find(c => c.id === openMenuId);
            return (
              <motion.div
                ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: 'absolute',
                top: menuPosition.top,
                left: menuPosition.left,
                width: '12rem', // w-48
              }}
              className="z-[9999] bg-white dark:bg-[#2f2f2f] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl py-1.5 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                suppressHydrationWarning
                className="flex items-center gap-3 w-full px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onShareChat && openMenuId) onShareChat(openMenuId);
                  setOpenMenuId(null);
                }}
              >
                <Share2 size={14} className="opacity-70" />
                Share
              </button>
              <button 
                suppressHydrationWarning
                className="flex items-center gap-3 w-full px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={() => {
                  if (activeChat) handleStartEdit(activeChat);
                }}
              >
                <Pencil size={14} className="opacity-70" />
                Rename
              </button>
              <button 
                suppressHydrationWarning
                className="flex items-center gap-3 w-full px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={() => {
                  if (onPinChat && openMenuId) onPinChat(openMenuId);
                  setOpenMenuId(null);
                }}
              >
                <Pin size={14} className={cn("opacity-70", activeChat?.isPinned && "text-blue-500 fill-blue-500/20")} />
                {activeChat?.isPinned ? 'Unpin chat' : 'Pin chat'}
              </button>
              <button 
                suppressHydrationWarning
                className="flex items-center gap-3 w-full px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                onClick={() => {
                  if (onArchiveChat && openMenuId) onArchiveChat(openMenuId);
                  setOpenMenuId(null);
                }}
              >
                <Archive size={14} className="opacity-70" />
                Archive
              </button>
              <div className="h-[1px] bg-gray-200 dark:bg-white/10 my-1" />
              <button 
                suppressHydrationWarning
                className="flex items-center gap-3 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                onClick={(e) => { onDeleteChat(openMenuId, e); setOpenMenuId(null); }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </motion.div>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
