import React, { useState, useRef, useEffect } from 'react';
import { useTerminalStore, TerminalTabId } from '../../stores/useTerminalStore';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { Terminal, Play, Square, Trash2, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard';

export const TerminalPanel: React.FC = () => {
  const { activeTab, setActiveTab, logs, isRunning, runCommandInTab, stopRunningCommand, clearTab } =
    useTerminalStore();
  const { rootPath } = useWorkspaceStore();
  const [inputCmd, setInputCmd] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  const currentLogs = logs[activeTab] || [];

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentLogs]);

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim() || isRunning) return;
    const cmd = inputCmd.trim();
    setInputCmd('');
    await runCommandInTab(activeTab, cmd, rootPath || '.');
  };

  const [copied, setCopied] = useState(false);

  const handleCopyOutput = async () => {
    const raw = currentLogs.map((l) => l.text).join('\n');
    await copyToClipboard(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: TerminalTabId; label: string }[] = [
    { id: 'agent', label: 'Agent Activity' },
    { id: 'tests', label: 'Tests & Build' },
    { id: 'terminal-1', label: 'Terminal 1' },
    { id: 'terminal-2', label: 'Terminal 2' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#12141a] border-t border-[#2b313e]">
      {/* Terminal Tab Bar */}
      <div className="h-8 bg-[#181b22] border-b border-[#2b313e] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-1">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-2.5 py-1 text-xs rounded transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#1f232d] text-blue-400 font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f232d]/50'
                }`}
              >
                <Terminal size={12} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <button
              onClick={stopRunningCommand}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition"
              title="Stop running command"
            >
              <Square size={11} fill="currentColor" /> Stop
            </button>
          )}

          <button
            onClick={handleCopyOutput}
            className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-[#1f232d] transition"
            title="Copy Terminal Output"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>

          <button
            onClick={() => clearTab(activeTab)}
            className="p-1 rounded text-gray-400 hover:text-gray-200 hover:bg-[#1f232d] transition"
            title="Clear logs"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Terminal Output Log Area */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1 select-text">
        {currentLogs.length === 0 ? (
          <div className="text-gray-500 italic">No output in this session yet.</div>
        ) : (
          currentLogs.map((log) => {
            let color = 'text-gray-300';
            if (log.type === 'cmd') color = 'text-cyan-400 font-bold';
            if (log.type === 'stderr') color = 'text-amber-400';
            if (log.type === 'error') color = 'text-red-400 font-semibold';
            if (log.type === 'success') color = 'text-emerald-400 font-semibold';

            return (
              <div key={log.id} className="leading-relaxed flex items-start gap-2">
                <span className="text-gray-600 text-[10px] shrink-0 select-none pt-0.5">
                  {log.timestamp}
                </span>
                <span className={`whitespace-pre-wrap break-all ${color}`}>{log.text}</span>
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>

      {/* Input Prompt for Terminal 1 & 2 */}
      {(activeTab === 'terminal-1' || activeTab === 'terminal-2') && (
        <form onSubmit={handleRun} className="p-2 bg-[#181b22] border-t border-[#2b313e] flex items-center gap-2">
          <span className="text-blue-400 text-xs font-mono select-none">$</span>
          <input
            type="text"
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            placeholder="Type terminal command (e.g. cargo test, git status)..."
            disabled={isRunning}
            className="flex-1 bg-transparent text-xs text-gray-100 font-mono outline-none placeholder:text-gray-600"
          />
          <button
            type="submit"
            disabled={isRunning || !inputCmd.trim()}
            className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition"
          >
            <Play size={12} />
          </button>
        </form>
      )}
    </div>
  );
};
