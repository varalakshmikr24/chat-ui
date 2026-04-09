"use client";

import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Plus } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (content: string, questionId?: string) => void;
  isLoading: boolean;
}

const PRESET_QUESTIONS = [
  { id: 'chat_q1', text: "Tell me about Next.js App Router" },
  { id: 'chat_q2', text: "How does state management work here?" },
  { id: 'chat_q3', text: "What are the benefits of TypeScript?" },
  { id: 'chat_q4', text: "Explain the project architecture" },
  { id: 'chat_q5', text: "How to deploy this to Vercel?" },
  { id: 'chat_q6', text: "What is Tailwind CSS v4's main feature?" },
  { id: 'chat_q7', text: "How to implement dark mode manually?" },
  { id: 'chat_q8', text: "What is the role of an API route handler?" },
  { id: 'chat_q9', text: "Explain React Server Components" },
  { id: 'chat_q10', text: "How to optimize performance in Next.js?" },
];

export const InputArea = ({ onSendMessage, isLoading }: InputAreaProps) => {
  const [input, setInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleSelectQuestion = (question: { id: string; text: string }) => {
    onSendMessage(question.text, question.id);
    setIsMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 md:px-0 relative">
      {/* Question Menu */}
      {isMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute bottom-full left-4 right-4 mb-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-2xl dark:border-gray-700 dark:bg-[#303030] md:left-0 md:right-0 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="mb-2 px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Suggested Questions
          </div>
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q.id}
              onClick={() => handleSelectQuestion(q)}
              className="flex w-full items-center px-3 py-2 text-sm text-left rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              {q.text}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="relative flex w-full items-center rounded-2xl border border-gray-200 bg-white shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-gray-700 dark:bg-[#303030] dark:focus-within:ring-blue-500/40"
      >
        <div className="flex w-full items-end gap-2 p-2 px-3">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-10 w-10 shrink-0 mb-1 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Professional questions"
          >
            <Plus size={20} className={`transition-transform duration-200 ${isMenuOpen ? "rotate-45" : ""}`} />
          </button>

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
            disabled={!input.trim() || isLoading}
            className={`flex h-10 w-10 shrink-0 mb-1 items-center justify-center rounded-xl transition-all ${
              input.trim() && !isLoading
                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700 scale-100"
                : "bg-blue-600 text-white opacity-50 cursor-not-allowed scale-95"
            }`}
          >
            <SendHorizontal size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};
