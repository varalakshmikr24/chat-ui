import React, { useState, useRef, useEffect } from 'react';
import { CircleArrowUp, Plus, ChevronDown, Check, Sparkles, Cpu, Settings, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputAreaProps {
  onSendMessage: (content: string, questionId?: string) => void;
  isLoading: boolean;
  chatMode: 'demo' | 'gemini' | 'llama';
  setChatMode: (mode: 'demo' | 'gemini' | 'llama') => void;
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

const MODELS = [
  { id: 'demo', name: 'Demo', icon: Settings, color: 'text-amber-500' },
  { id: 'gemini', name: 'Gemini', icon: Sparkles, color: 'text-emerald-500' },
  { id: 'llama', name: 'Llama (Groq)', icon: Cpu, color: 'text-blue-500' },
] as const;

export const InputArea = ({ onSendMessage, isLoading, chatMode, setChatMode }: InputAreaProps) => {
  const [input, setInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [extendedThinking, setExtendedThinking] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const currentModel = MODELS.find(m => m.id === chatMode) || MODELS[1];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (input.trim() && !isLoading) {
      const trimmedInput = input.trim();
      const matchedQuestion = PRESET_QUESTIONS.find(
        q => q.text.toLowerCase() === trimmedInput.toLowerCase()
      );

      onSendMessage(trimmedInput, matchedQuestion?.id);
      setInput('');
    }
  };

  const handleSelectQuestion = (question: { id: string; text: string }) => {
    setInput(question.text);
    setIsMenuOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
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
      <AnimatePresence>
        {/* Question Menu */}
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-4 right-4 mb-2 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white/90 backdrop-blur-xl p-2 shadow-2xl dark:border-gray-700 dark:bg-[#303030]/90 md:left-0 md:right-0 z-50"
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
          </motion.div>
        )}

        {/* Model Matcher/Dropdown */}
        {isModelMenuOpen && (
          <motion.div
            ref={modelMenuRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-4 mb-4 w-60 rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-xl p-2 shadow-2xl dark:border-gray-800 dark:bg-[#1f1f1f]/95 z-50 overflow-hidden"
          >
            <div className="flex flex-col gap-1">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setChatMode(model.id as any);
                    setIsModelMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${chatMode === model.id
                    ? "bg-gray-100 dark:bg-white/10"
                    : "hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <model.icon size={18} className={model.color} />
                    <span className="text-sm font-medium dark:text-gray-200">{model.name}</span>
                  </div>
                  {chatMode === model.id && <Check size={16} className="text-blue-500" />}
                </button>
              ))}
            </div>

            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/5 px-2 pb-1">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-amber-500" />
                  <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300">Extended thinking</span>
                </div>
                <div
                  onClick={() => setExtendedThinking(!extendedThinking)}
                  className={`relative w-8 h-4.5 rounded-full transition-colors ${extendedThinking ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${extendedThinking ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </div>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handleSubmit}
        className="relative flex w-full flex-col rounded-3xl border border-gray-200 bg-white/80 backdrop-blur-md shadow-xl transition-all hover:shadow-2xl focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-gray-700 dark:bg-[#2f2f2f]/80 dark:focus-within:ring-blue-500/40"
      >
        <div className="flex w-full items-end gap-2 p-2 px-3">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-9 w-9 shrink-0 mb-1.5 items-center justify-center rounded-xl bg-gray-100/50 dark:bg-gray-800/50 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Preset questions"
          >
            <Plus size={18} className={`transition-transform duration-200 ${isMenuOpen ? "rotate-45" : ""}`} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 resize-none bg-transparent py-3.5 pr-32 text-sm md:text-base outline-none disabled:cursor-not-allowed min-h-[56px] placeholder:text-gray-400 dark:placeholder:text-gray-500"
            disabled={false}
          />

          {/* Model Selector Pill */}
          <div className="absolute right-14 bottom-3 flex items-center">
            <button
              type="button"
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 transition-all border border-gray-200 dark:border-white/5 shadow-sm"
            >
              <currentModel.icon size={14} className={currentModel.color} />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{currentModel.name}</span>
              <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />
            </button>
          </div>

          <button
            type="submit"
            disabled={false}
            className={`flex h-9 w-9 shrink-0 mb-1.5 items-center justify-center rounded-full transition-all ${input.trim()
              ? "bg-black dark:bg-white text-white dark:text-black shadow-lg hover:scale-105 active:scale-95"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 opacity-50 cursor-not-allowed"
              }`}
          >
            <CircleArrowUp size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};




//import React, { useState, useRef } from 'react';

export const VoiceInterface = () => {
  const [isListening, setIsListening] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsListening(true);

      // 1. Initialize Audio Context for Visualizers
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.current.createMediaStreamSource(stream);
      const analyzer = audioContext.current.createAnalyser();
      source.connect(analyzer);

      // 2. Setup MediaRecorder for Deepgram
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Send this blob to your Socket.io server here
          // socket.emit('audio-stream', event.data);
        }
      };

      mediaRecorder.current.start(250); // Send chunks every 250ms
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopListening = () => {
    mediaRecorder.current?.stop();
    setIsListening(false);
  };

  return (
    <button
      onClick={isListening ? stopListening : startListening}
      className={`p-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`}
    >
      {/* Mic Icon Here */}
      {isListening ? "Listening..." : "Start Voice"}
    </button>
  );
};