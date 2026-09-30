import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../../stores/useAgentStore';
import { useProviderStore } from '../../stores/useProviderStore';
import { usePermissionStore } from '../../stores/usePermissionStore';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useTerminalStore } from '../../stores/useTerminalStore';
import {
  Send,
  Square,
  Paperclip,
  X,
  FileCode2,
  Sparkles,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface ChatComposerProps {
  onOpenSettings?: () => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({ onOpenSettings }) => {
  const [prompt, setPrompt] = useState('');
  const [showSlashHelp, setShowSlashHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { state, startTask, stopTask, contextFiles, removeContextFile, addContextFile, clearMessages } = useAgentStore();
  const { activeType, selectedModel } = useProviderStore();
  const { level } = usePermissionStore();
  const { rootPath, projectMetadata } = useWorkspaceStore();
  const { runCommandInTab } = useTerminalStore();

  const isAgentActive =
    state === 'PLANNING' ||
    state === 'INSPECTING' ||
    state === 'EXECUTING' ||
    state === 'TESTING' ||
    state === 'ANALYZING' ||
    state === 'FIXING' ||
    state === 'VERIFYING';

  // Auto-resize textarea up to 160px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 160)}px`;
    }
  }, [prompt]);

  const handleSend = async () => {
    const raw = prompt.trim();
    if (!raw || isAgentActive) return;

    setPrompt('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setShowSlashHelp(false);

    // 1. Client-side Slash command interceptor
    if (raw.startsWith('/')) {
      const parts = raw.split(' ');
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ');

      switch (cmd) {
        case '/clear':
          clearMessages();
          return;
        case '/help':
          useAgentStore.getState().addMessage({
            role: 'SYSTEM',
            content: `**Available Lulu Commands:**
- \`/fix <file>\`: Directs agent to locate & fix errors in the target file
- \`/test\`: Executes detected test runner (${projectMetadata?.test_runner || 'tests'})
- \`/build\`: Runs project build tool (${projectMetadata?.build_tool || 'build'})
- \`/review\`: Analyzes git diff for security and architecture review
- \`/git\`: Inspects git status and uncommitted changes
- \`/search <text>\`: Searches the workspace for target query
- \`/clear\`: Clears the current chat history
- \`/model\`: Opens settings to switch AI provider or model`,
          });
          return;
        case '/test':
          if (rootPath) {
            const runner = projectMetadata?.test_runner || 'cargo test';
            await runCommandInTab('tests', runner, rootPath);
          }
          return;
        case '/build':
          if (rootPath) {
            const builder = projectMetadata?.build_tool === 'cmake'
              ? 'cmake --build build'
              : projectMetadata?.build_tool || 'make';
            await runCommandInTab('tests', builder, rootPath);
          }
          return;
        case '/git':
          if (rootPath) {
            await runCommandInTab('agent', 'git status', rootPath);
          }
          return;
        case '/model':
          onOpenSettings?.();
          return;
        case '/fix':
          if (arg) {
            startTask(`Fix compiler or logic issues in ${arg}`);
            return;
          }
          break;
        default:
          break;
      }
    }

    // Append context files summary if any
    let fullPrompt = raw;
    if (contextFiles.length > 0) {
      fullPrompt = `[Context Files: ${contextFiles.join(', ')}]\n\n${raw}`;
    }

    startTask(fullPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      if (isAgentActive) {
        e.preventDefault();
        stopTask();
      }
      return;
    }

    if (e.key === 'Enter') {
      if (!e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  return (
    <div className="bg-[#171a23] border-t border-[#2b313e] p-3 flex flex-col gap-2 select-none shadow-lg">
      {/* Active Context Chips */}
      {contextFiles.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-white/5 text-[11px]">
          <span className="text-gray-400 font-medium">Context:</span>
          {contextFiles.map((file) => (
            <span
              key={file}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-blue-300 font-mono text-[11px]"
            >
              <FileCode2 size={11} className="text-blue-400" />
              <span>{file}</span>
              <button
                onClick={() => removeContextFile(file)}
                className="hover:text-red-400 ml-0.5"
                title="Remove from context"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Main Composer Textarea */}
      <div className="relative flex flex-col bg-[#11131a] border border-[#2b313e] focus-within:border-blue-500 rounded-xl overflow-hidden transition shadow-inner">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            setShowSlashHelp(e.target.value.startsWith('/'));
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isAgentActive
              ? 'Lulu Code is working on the task...'
              : 'Ask Lulu (e.g. "Fix the C++ build error in src/main.cpp" or type /help)...'
          }
          disabled={isAgentActive}
          rows={1}
          className="w-full bg-transparent px-3.5 py-2.5 text-[13.5px] text-gray-100 placeholder:text-gray-500 outline-none resize-none leading-relaxed select-text font-sans"
          style={{ maxHeight: '160px', overflowY: 'auto' }}
        />

        {/* Action Controls Toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#14161f] border-t border-[#2b313e]/40 text-xs">
          <div className="flex items-center gap-2">
            {/* Model Badge */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-[10.5px] border border-white/10 transition"
              title="Click to configure AI Model"
            >
              <Sparkles size={11} className="text-cyan-400" />
              <span>{selectedModel || activeType}</span>
            </button>

            {/* Permission Badge */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-mono text-[10.5px] border border-white/10 transition"
              title="Click to configure permissions"
            >
              <Shield size={11} className="text-amber-400" />
              <span>{level}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isAgentActive ? (
              <button
                type="button"
                onClick={stopTask}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow transition cursor-pointer"
              >
                <Square size={12} fill="currentColor" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!prompt.trim()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow transition disabled:opacity-40 cursor-pointer"
              >
                <Send size={12} />
                <span>Run</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
