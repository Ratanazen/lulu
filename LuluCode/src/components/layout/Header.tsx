import React from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useProviderStore } from '../../stores/useProviderStore';
import { usePermissionStore } from '../../stores/usePermissionStore';
import { useAgentStore } from '../../stores/useAgentStore';
import { FolderOpen, Settings, Shield, Cpu, Play, Terminal, Sparkles } from 'lucide-react';
import { PermissionLevel } from '../../types/permissions';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { rootPath, projectMetadata, openWorkspace } = useWorkspaceStore();
  const { ollamaStatus, selectedModel } = useProviderStore();
  const { level, setLevel } = usePermissionStore();
  const { startTask, state } = useAgentStore();

  const handleOpenFolder = async () => {
    // In Tauri, use dialog or prompt
    const path = prompt('Enter workspace project folder path:', rootPath || '/home/reny/Documents/Lulu/LuluCode');
    if (path) {
      await openWorkspace(path);
    }
  };

  const handleQuickRunTests = () => {
    startTask('Run full test suite and verify build');
  };

  return (
    <header className="h-12 bg-[#181b22] border-b border-[#2b313e] flex items-center justify-between px-4 select-none shrink-0">
      {/* Left: Brand & Workspace */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-bold text-sm tracking-wide text-gray-100">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow">
            <Sparkles size={14} />
          </div>
          <span>Lulu Code</span>
        </div>

        <div className="h-4 w-[1px] bg-[#2b313e]" />

        <button
          onClick={handleOpenFolder}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1f232d] hover:bg-[#282e3c] border border-[#2b313e] text-xs text-gray-300 transition"
          title="Open Project Folder"
        >
          <FolderOpen size={13} className="text-blue-400" />
          <span className="font-medium truncate max-w-[160px]">
            {projectMetadata ? projectMetadata.name : 'Open Project'}
          </span>
          {projectMetadata && (
            <span className="text-[10px] px-1 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {projectMetadata.language}
            </span>
          )}
        </button>
      </div>

      {/* Center: Quick Action / Status */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleQuickRunTests}
          disabled={state !== 'IDLE' && state !== 'COMPLETE'}
          className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-medium transition disabled:opacity-50"
        >
          <Play size={11} fill="currentColor" /> Run Tests
        </button>
      </div>

      {/* Right: AI Status, Permission, Settings */}
      <div className="flex items-center gap-3">
        {/* AI Provider Indicator */}
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-[#1f232d] border border-[#2b313e]">
          <Cpu size={13} className={ollamaStatus.is_available ? 'text-green-400' : 'text-gray-400'} />
          <span className="text-[11px] text-gray-300">
            {ollamaStatus.is_available ? selectedModel : 'Offline AI Engine'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              ollamaStatus.is_available ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            title={ollamaStatus.is_available ? 'Ollama Online' : 'Local Deterministic Fallback'}
          />
        </div>

        {/* Permission Mode Selector */}
        <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#1f232d] border border-[#2b313e]">
          <Shield size={12} className="text-cyan-400" />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as PermissionLevel)}
            className="bg-transparent text-gray-300 text-[11px] outline-none cursor-pointer"
          >
            <option value="READ_ONLY">Read Only</option>
            <option value="SAFE_EDIT">Safe Edit</option>
            <option value="FULL_EDIT">Full Edit</option>
            <option value="COMMAND_CONFIRM">Confirm Commands</option>
            <option value="AUTONOMOUS">Autonomous</option>
          </select>
        </div>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded text-gray-400 hover:text-gray-200 hover:bg-[#1f232d] transition"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
};
