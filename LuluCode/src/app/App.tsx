import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { WorkspacePanel } from '../features/workspace/WorkspacePanel';
import { ChatPanel } from '../features/chat/ChatPanel';
import { InspectorPanel } from '../features/diagnostics/InspectorPanel';
import { TerminalPanel } from '../features/terminal/TerminalPanel';
import { PermissionDialog } from '../features/permissions/PermissionDialog';
import { SettingsModal } from '../features/settings/SettingsModal';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { useProviderStore } from '../stores/useProviderStore';
import { PanelBottomClose, PanelBottomOpen } from 'lucide-react';

export const App: React.FC = () => {
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { openWorkspace } = useWorkspaceStore();
  const { detectOllama } = useProviderStore();

  useEffect(() => {
    // Initial workspace load
    const initialPath = '/home/reny/Documents/Lulu/LuluCode';
    openWorkspace(initialPath);
    detectOllama();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openWorkspace, detectOllama]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#12141a] text-gray-200 overflow-hidden font-sans">
      {/* Top Header */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Workspace + Agent Chat + Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Workspace Panel (Files / Search / Git / Tasks) */}
        <WorkspacePanel />

        {/* Center: Agent Chat + Embedded Terminal */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#12141a]">
          {/* Subheader / Terminal toggle */}
          <div className="h-8 bg-[#181b22] border-b border-[#2b313e] flex items-center justify-between px-3 shrink-0 select-none">
            <span className="text-xs font-semibold text-gray-300">Agent & Chat</span>
            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-gray-400 hover:text-gray-200 hover:bg-[#1f232d] transition"
              title="Toggle Terminal"
            >
              {isTerminalOpen ? <PanelBottomClose size={13} /> : <PanelBottomOpen size={13} />}
              <span>{isTerminalOpen ? 'Hide Terminal' : 'Show Terminal'}</span>
            </button>
          </div>

          {/* Center Chat Viewport */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatPanel onOpenSettings={() => setIsSettingsOpen(true)} />
          </div>

          {/* Embedded Bottom Terminal */}
          {isTerminalOpen && (
            <div className="h-60 shrink-0 border-t border-[#2b313e]">
              <TerminalPanel />
            </div>
          )}
        </div>

        {/* Right: Inspector (Plan, Diagnostics, System Hardware) */}
        <InspectorPanel onOpenSettings={() => setIsSettingsOpen(true)} />
      </div>

      {/* Global Modals */}
      <PermissionDialog />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
