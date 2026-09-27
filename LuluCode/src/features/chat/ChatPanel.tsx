import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore, ChatMessage } from '../../stores/useAgentStore';
import { Send, Square, Terminal, User, Bot, AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';

const ToolMessageCard: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="bg-[#14161d] border border-[#2b313e] rounded-lg overflow-hidden my-1 text-xs">
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between px-3 py-1.5 bg-[#181b22] cursor-pointer hover:bg-[#1f232d] transition select-none"
      >
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-cyan-400" />
          <span className="font-mono text-cyan-300 font-medium">{msg.toolName || 'Tool Call'}</span>
          {msg.exitCode !== undefined && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                msg.exitCode === 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              exit {msg.exitCode}
            </span>
          )}
        </div>
        {collapsed ? <ChevronRight size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
      </div>

      {!collapsed && (
        <pre className="p-3 font-mono text-[11px] text-gray-300 bg-[#101217] overflow-x-auto whitespace-pre-wrap max-h-48">
          {msg.content}
        </pre>
      )}
    </div>
  );
};

export const ChatPanel: React.FC = () => {
  const { messages, state, startTask, stopTask } = useAgentStore();
  const [prompt, setPrompt] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isAgentActive) return;
    const p = prompt.trim();
    setPrompt('');
    startTask(p);
  };

  const isAgentActive =
    state === 'PLANNING' ||
    state === 'INSPECTING' ||
    state === 'EXECUTING' ||
    state === 'TESTING' ||
    state === 'ANALYZING' ||
    state === 'FIXING' ||
    state === 'VERIFYING';

  return (
    <div className="flex flex-col h-full bg-[#14161d]">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 text-xs select-none">
            <Bot size={32} className="text-blue-400 mb-2 opacity-80" />
            <p className="font-medium text-gray-300">Lulu Code Agent</p>
            <p className="text-[11px] text-gray-500 max-w-xs mt-1">
              Ask Lulu to inspect code, run tests, fix compiler errors, refactor, or explain project architecture.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            if (m.role === 'TOOL') {
              return <ToolMessageCard key={m.id} msg={m} />;
            }

            const isUser = m.role === 'USER';
            const isSystem = m.role === 'SYSTEM';

            return (
              <div
                key={m.id}
                className={`flex gap-2.5 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
                    <Bot size={13} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : isSystem
                      ? 'bg-amber-950/20 border border-amber-600/30 text-amber-200'
                      : 'bg-[#181b22] border border-[#2b313e] text-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed select-text">{m.content}</p>
                  <span className="block text-[9px] opacity-40 text-right mt-1">{m.timestamp}</span>
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded-md bg-gray-700 text-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={13} />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-[#181b22] border-t border-[#2b313e] flex items-center gap-2 select-none"
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={isAgentActive ? 'Lulu is working on the task...' : 'Ask Lulu (e.g. "Fix tests in auth.rs")...'}
          disabled={isAgentActive}
          className="flex-1 bg-[#12141a] border border-[#2b313e] rounded-lg px-3 py-2 text-xs text-gray-100 outline-none focus:border-blue-500 placeholder:text-gray-500"
        />

        {isAgentActive ? (
          <button
            type="button"
            onClick={stopTask}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition"
          >
            <Square size={13} fill="currentColor" /> Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!prompt.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition disabled:opacity-40"
          >
            <Send size={13} /> Run
          </button>
        )}
      </form>
    </div>
  );
};
