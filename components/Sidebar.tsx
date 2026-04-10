"use client";

import React from 'react';
import { Plus, PanelLeft, Trash2, Settings, User, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChatHistoryList } from './ChatHistoryList';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  createdAt: number;
  updatedAt: number;
}

interface SidebarProps {
  chats: ChatSession[];
  activeId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  onClearChat: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar = ({ 
  chats, 
  activeId, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat,
  onClearChat, 
  isOpen, 
  setIsOpen 
}: SidebarProps) => {

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-[#171717] text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-white/5 transition-all duration-300 h-full",
        isOpen ? "w-64" : "w-0 overflow-hidden lg:w-[60px]"
      )}>
        
        {/* Toggle & Branding Header */}
        <div className="flex h-14 items-center px-3 shrink-0 gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            title={isOpen ? "Close sidebar" : "Open sidebar"}
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
            <span className="font-semibold text-sm whitespace-nowrap">
              Metawurks AI
            </span>
          </div>
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
            title="New chat"
          >
            <Plus size={18} />
            {isOpen && <span>New chat</span>}
          </button>
        </div>

        {/* Scrollable Recents History */}
        <ChatHistoryList 
          chats={chats}
          activeId={activeId}
          onSelectChat={onSelectChat}
          onDeleteChat={onDeleteChat}
          isOpen={isOpen}
        />

        {/* Floating Icons for collapsed view */}
        {!isOpen && chats.length > 0 && (
           <div className="flex flex-col items-center gap-2 py-4">
             {chats.slice(0, 5).map(chat => (
               <button 
                key={chat.id}
                onClick={() => {setIsOpen(true); onSelectChat(chat.id)}}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10",
                  activeId === chat.id && "bg-gray-100 dark:bg-white/10"
                )}
               >
                 <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
               </button>
             ))}
           </div>
        )}

        {/* Profile / Footer Section */}
        <div className="mt-auto p-3 shrink-0 border-t border-gray-200 dark:border-white/5 space-y-1">
          {isOpen ? (
            <>
              <button 
                onClick={onClearChat}
                className="flex items-center gap-3 w-full rounded-lg p-3 text-sm text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 size={16} />
                <span>Clear current chat</span>
              </button>
              <button className="flex items-center gap-3 w-full rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold">
                  VK
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium truncate">Varalakshmi K R</div>
                </div>
                <Settings size={16} className="text-gray-400" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 pb-2">
              <button onClick={onClearChat} className="text-red-500 hover:scale-110 transition-transform"><Trash2 size={18}/></button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white text-[10px] font-bold shadow-md">
                VK
              </button>
            </div>
          )}
        </div>

        {/* Mobile close x */}
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
