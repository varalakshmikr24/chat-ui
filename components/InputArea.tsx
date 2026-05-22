import React, { useState, useRef, useEffect } from 'react';
import { CircleArrowUp, Plus, ChevronDown, Check, Sparkles, Cpu, Zap, FileUp, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputAreaProps {
  // 1. Updated prop type to accept an optional file alongside the text content
  onSendMessage: (content: string, file?: File | null) => void;
  isLoading: boolean;
  chatMode: 'gemini' | 'llama';
  setChatMode: (mode: 'gemini' | 'llama') => void;
}

const MODELS = [
  { id: 'gemini', name: 'Gemini', icon: Sparkles, color: 'text-emerald-500' },
  { id: 'llama', name: 'Llama (Groq)', icon: Cpu, color: 'text-blue-500' },
] as const;

export const InputArea = ({ onSendMessage, isLoading, chatMode, setChatMode }: InputAreaProps) => {
  const [input, setInput] = useState('');
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [extendedThinking, setExtendedThinking] = useState(false);

  // 2. Added state to hold the attached file locally
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentModel = MODELS.find(m => m.id === chatMode) || MODELS[0];

  // 3. Modified submit handler to forward the file and reset it
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Allow submission if there is text OR a file attached
    if ((input.trim() || attachedFile) && !isLoading) {
      onSendMessage(input.trim(), attachedFile);
      setInput('');
      setAttachedFile(null); // Clear file slot after sending
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const triggerAttachmentUpload = (acceptType: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
    setIsUploadMenuOpen(false);
  };

  // 4. Updated file parser to set state correctly
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setAttachedFile(files[0]);
      console.log("Attached file ready for RAG:", files[0].name);
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setIsUploadMenuOpen(false);
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

      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <AnimatePresence>
        {/* Upload Attachments Menu */}
        {isUploadMenuOpen && (
          <motion.div
            ref={uploadMenuRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-4 mb-3 w-48 rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-xl p-1.5 shadow-2xl dark:border-gray-800 dark:bg-[#212121]/95 z-50 overflow-hidden flex flex-col gap-0.5"
          >
            <button
              type="button"
              onClick={() => triggerAttachmentUpload(".pdf,.doc,.docx,.txt,.csv")}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-left rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200"
            >
              <FileUp size={16} className="text-gray-500 dark:text-gray-400" />
              <span>Upload files</span>
            </button>
            <button
              type="button"
              onClick={() => triggerAttachmentUpload("image/*")}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-left rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200"
            >
              <ImageIcon size={16} className="text-gray-500 dark:text-gray-400" />
              <span>Upload photos</span>
            </button>
          </motion.div>
        )}

        {/* Model Dropdown Menu */}
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
                  type="button"
                  onClick={() => {
                    setChatMode(model.id);
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
        {/* 5. Added Document Preview Chip directly above input text when a file is staged */}
        {attachedFile && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs font-medium text-gray-700 dark:text-gray-300">
              <FileUp size={14} className="text-blue-500" />
              <span className="max-w-[200px] truncate">{attachedFile.name}</span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="flex w-full items-end gap-2 p-2 px-3">
          {/* Main Attachment Trigger '+' Button */}
          <button
            type="button"
            onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)}
            className="flex h-9 w-9 shrink-0 mb-1.5 items-center justify-center rounded-xl bg-gray-100/50 dark:bg-gray-800/50 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all"
            title="Upload options"
          >
            <Plus size={18} className={`transition-transform duration-200 ${isUploadMenuOpen ? "rotate-45" : ""}`} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachedFile ? "Ask about this document..." : "Ask anything..."}
            className="flex-1 resize-none bg-transparent py-3.5 pr-32 text-sm md:text-base outline-none disabled:cursor-not-allowed min-h-[56px] placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-100"
            disabled={isLoading}
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
            // Button lights up if there's text OR an attached file
            disabled={(!input.trim() && !attachedFile) || isLoading}
            className={`flex h-9 w-9 shrink-0 mb-1.5 items-center justify-center rounded-full transition-all ${(input.trim() || attachedFile) && !isLoading
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

export const VoiceInterface = () => {
  const [isListening, setIsListening] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsListening(true);

      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.current.createMediaStreamSource(stream);
      const analyzer = audioContext.current.createAnalyser();
      source.connect(analyzer);

      mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Send chunks to server logic here
        }
      };

      mediaRecorder.current.start(250);
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
      {isListening ? "Listening..." : "Start Voice"}
    </button>
  );
};