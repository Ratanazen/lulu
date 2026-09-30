import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../../stores/useAgentStore';
import { MessageCard } from './MessageCard';
import { ChatComposer } from './ChatComposer';
import {
  Bot,
  Trash2,
  ArrowDown,
  Sparkles,
  Terminal,
  FileCode2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ChatPanelProps {
  onOpenSettings?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onOpenSettings }) => {
  const { messages, activeTask, state, clearMessages } = useAgentStore();
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollLockedRef = useRef<boolean>(true);

  // Smart auto-scroll handling
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= 80;
    isAutoScrollLockedRef.current = isAtBottom;
    setShowScrollBottom(!isAtBottom);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
      isAutoScrollLockedRef.current = true;
      setShowScrollBottom(false);
    }
  };

  useEffect(() => {
    if (isAutoScrollLockedRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages]);

  // Live status badge styling
  const statusConfig = {
    IDLE: { label: 'Idle', color: 'text-gray-400', dot: 'bg-gray-400' },
    PLANNING: { label: 'Planning', color: 'text-cyan-400', dot: 'bg-cyan-400 animate-pulse' },
    INSPECTING: { label: 'Inspecting', color: 'text-blue-400', dot: 'bg-blue-400 animate-pulse' },
    EXECUTING: { label: 'Executing', color: 'text-amber-400', dot: 'bg-amber-400 animate-pulse' },
    TESTING: { label: 'Testing', color: 'text-purple-400', dot: 'bg-purple-400 animate-pulse' },
    ANALYZING: { label: 'Analyzing', color: 'text-indigo-400', dot: 'bg-indigo-400 animate-pulse' },
    FIXING: { label: 'Fixing', color: 'text-orange-400', dot: 'bg-orange-400 animate-pulse' },
    VERIFYING: { label: 'Verifying', color: 'text-teal-400', dot: 'bg-teal-400 animate-pulse' },
    COMPLETE: { label: 'Complete', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    RECOVERY: { label: 'Recovery', color: 'text-rose-400', dot: 'bg-rose-400 animate-pulse' },
    CANCELLED: { label: 'Cancelled', color: 'text-red-400', dot: 'bg-red-400' },
  }[state] || { label: state, color: 'text-gray-400', dot: 'bg-gray-400' };

  return (
    <div className="flex flex-col h-full bg-[#12141a] text-gray-200 overflow-hidden relative">
      {/* Task Header Bar */}
      <div className="h-10 bg-[#161922] border-b border-[#2b313e] flex items-center justify-between px-3.5 shrink-0 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 font-medium text-xs text-gray-200 truncate">
            <Bot size={14} className="text-blue-400 shrink-0" />
            <span className="truncate">{activeTask ? activeTask.title : 'Lulu Code Session'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            <span className={`font-mono font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
              title="Clear chat history"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 relative"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 text-xs select-none max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 shadow-sm">
              <Bot size={26} />
            </div>
            <h3 className="font-semibold text-gray-200 text-sm mb-1">Lulu Code Native Desktop Agent</h3>
            <p className="text-[12px] text-gray-400 leading-relaxed mb-4">
              Native autonomous engineering agent with zero-overhead C/C++ build diagnostics, process sandboxing, and safe patch application.
            </p>

            <div className="grid grid-cols-2 gap-2 w-full text-[11.5px] text-left">
              <div className="p-2.5 rounded-lg bg-[#181b24] border border-[#2b313e] text-gray-300">
                <span className="font-semibold text-cyan-300 block mb-0.5">⚡ C/C++ Fast Fix</span>
                <span className="text-gray-500">Detects GCC, Clang, CMake, and linker failures</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#181b24] border border-[#2b313e] text-gray-300">
                <span className="font-semibold text-amber-300 block mb-0.5">🛡️ Safe Permissions</span>
                <span className="text-gray-500">Prompts before executing shell or disk modifications</span>
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageCard key={m.id} message={m} />)
        )}
      </div>

      {/* Floating Jump to Latest Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-20 right-6 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-xl border border-blue-400/40 transition select-none cursor-pointer"
        >
          <ArrowDown size={13} />
          <span>Jump to latest</span>
        </button>
      )}

      {/* Bottom Composer */}
      <ChatComposer onOpenSettings={onOpenSettings} />
    </div>
  );
};
