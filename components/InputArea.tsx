"use client";

import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

export const InputArea = ({ onSendMessage, isLoading }: InputAreaProps) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput(''); // Requirement 73: Clear input immediately after sending
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 md:px-0">
      <form
        onSubmit={handleSubmit}
        className="relative flex w-full items-center rounded-2xl border border-gray-200 bg-white shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-gray-700 dark:bg-[#303030] dark:focus-within:ring-blue-500/40"
      >
        <div className="flex w-full items-end gap-2 p-2 px-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Metawurks AI..."
            className="flex-1 resize-none bg-transparent py-3 text-sm md:text-base outline-none disabled:cursor-not-allowed min-h-[52px]"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading} // Requirement 72: Disable button when input is empty
            className={`flex h-10 w-10 shrink-0 mb-1 items-center justify-center rounded-xl transition-all ${
              input.trim() && !isLoading
                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700 scale-100"
                : "bg-gray-100 text-gray-400 dark:bg-gray-800 scale-95 opacity-50 cursor-not-allowed"
            }`}
          >
            <SendHorizontal size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};
