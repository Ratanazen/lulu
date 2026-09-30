import React, { useState } from 'react';
import { ChatMessage } from '../../stores/useAgentStore';
import { copyToClipboard } from '../../utils/clipboard';
import { Terminal, Check, Copy, ChevronRight, ChevronDown, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ToolMessageCard: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const isFailed = msg.exitCode !== undefined && msg.exitCode !== 0;
  const [collapsed, setCollapsed] = useState(!isFailed);
  const [copied, setCopied] = useState(false);

  const handleCopyOutput = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await copyToClipboard(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const durationStr = msg.durationMs
    ? msg.durationMs >= 1000
      ? `${(msg.durationMs / 1000).toFixed(1)}s`
      : `${msg.durationMs}ms`
    : null;

  return (
    <div className={`rounded-lg border overflow-hidden my-1.5 text-xs transition ${
      isFailed
        ? 'bg-red-950/20 border-red-500/40'
        : 'bg-[#14161e] border-[#2b313e]'
    }`}>
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between px-3 py-2 bg-[#171a23] cursor-pointer hover:bg-[#1d222e] transition select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Terminal size={13} className={isFailed ? 'text-red-400' : 'text-cyan-400'} />
          <span className="font-mono text-cyan-300 font-semibold truncate">
            {msg.toolName || 'Tool Execution'}
          </span>

          {msg.exitCode !== undefined && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium flex items-center gap-1 ${
                msg.exitCode === 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border border-red-500/40'
              }`}
            >
              {msg.exitCode === 0 ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
              exit {msg.exitCode}
            </span>
          )}

          {durationStr && (
            <span className="text-[10px] text-gray-500 flex items-center gap-0.5 font-mono">
              <Clock size={10} />
              {durationStr}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopyOutput}
            className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
            title="Copy Output"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>
          {collapsed ? <ChevronRight size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
        </div>
      </div>

      {!collapsed && (
        <pre className="p-3 font-mono text-[11.5px] text-gray-300 bg-[#0d0f15] overflow-x-auto whitespace-pre-wrap max-h-56 leading-relaxed select-text border-t border-[#2b313e]/40">
          {msg.content}
        </pre>
      )}
    </div>
  );
};
