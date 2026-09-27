import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore, ChatMessage } from '../../stores/useAgentStore';
import { copyToClipboard } from '../../utils/clipboard';
import {
  Send,
  Square,
  Terminal,
  User,
  Bot,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Code2,
} from 'lucide-react';

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-lg border border-[#2b313e] bg-[#0d0f14] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1 bg-[#161922] border-b border-[#2b313e] text-[10px] text-gray-400 select-none">
        <div className="flex items-center gap-1.5">
          <Code2 size={11} className="text-cyan-400" />
          <span className="font-mono uppercase text-cyan-300 font-semibold">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 text-gray-300 hover:text-white transition"
          title="Copy Code"
        >
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          <span>{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>
      <pre className="p-3 font-mono text-[11px] text-gray-200 overflow-x-auto whitespace-pre leading-relaxed select-text">
        {code}
      </pre>
    </div>
  );
};

const ToolMessageCard: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyOutput = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copyToClipboard(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyOutput}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition"
            title="Copy Output"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>
          {collapsed ? <ChevronRight size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </div>
      </div>

      {!collapsed && (
        <pre className="p-3 font-mono text-[11px] text-gray-300 bg-[#101217] overflow-x-auto whitespace-pre-wrap max-h-48 select-text">
          {msg.content}
        </pre>
      )}
    </div>
  );
};

export const ChatPanel: React.FC = () => {
  const { messages, state, startTask, stopTask } = useAgentStore();
  const [prompt, setPrompt] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
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

  const handleCopyMessage = async (id: string, text: string) => {
    await copyToClipboard(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const renderContent = (content: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={lastIndex} className="whitespace-pre-wrap leading-relaxed select-text">
            {content.slice(lastIndex, match.index)}
          </span>
        );
      }
      const lang = match[1] || 'code';
      const code = match[2];
      parts.push(<CodeBlock key={match.index} code={code} language={lang} />);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <span key={lastIndex} className="whitespace-pre-wrap leading-relaxed select-text">
          {content.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : <span className="whitespace-pre-wrap leading-relaxed select-text">{content}</span>;
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
                className={`group flex gap-2.5 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
                    <Bot size={13} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-lg p-3 relative ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : isSystem
                      ? 'bg-amber-950/20 border border-amber-600/30 text-amber-200'
                      : 'bg-[#181b22] border border-[#2b313e] text-gray-200'
                  }`}
                >
                  <div>{renderContent(m.content)}</div>
                  <div className="flex items-center justify-between mt-1 text-[9px] opacity-60">
                    <button
                      onClick={() => handleCopyMessage(m.id, m.content)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 hover:text-white transition"
                      title="Copy full message text"
                    >
                      {copiedMsgId === m.id ? (
                        <Check size={10} className="text-emerald-400" />
                      ) : (
                        <Copy size={10} />
                      )}
                      <span>{copiedMsgId === m.id ? 'Copied' : 'Copy'}</span>
                    </button>
                    <span className="ml-auto">{m.timestamp}</span>
                  </div>
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
