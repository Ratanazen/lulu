import React, { useState, useEffect } from 'react';
import { PlanChecklist } from '../plans/PlanChecklist';
import { DiagnosticsList } from './DiagnosticsList';
import { useDiagnosticsStore } from '../../stores/useDiagnosticsStore';
import { useSystemStore } from '../../stores/useSystemStore';
import { useGitStore } from '../../stores/useGitStore';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ListChecks, AlertCircle, Activity, Cpu, HardDrive, Zap, ChevronRight, FileDiff, Plus, Edit2, HelpCircle } from 'lucide-react';

interface InspectorPanelProps {
  onOpenSettings?: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ onOpenSettings }) => {
  const [tab, setTab] = useState<'changes' | 'diagnostics' | 'plan'>('changes');
  const { diagnostics } = useDiagnosticsStore();
  const { systemInfo, refreshSystemInfo } = useSystemStore();
  const { status: gitStatus, refreshStatus: refreshGit } = useGitStore();
  const { rootPath } = useWorkspaceStore();

  useEffect(() => {
    refreshSystemInfo();
    if (rootPath) {
      refreshGit(rootPath);
    }
  }, [refreshSystemInfo, refreshGit, rootPath]);

  const ramUsedGb = systemInfo ? (systemInfo.memory.used_mb / 1024).toFixed(1) : '--';
  const ramTotalGb = systemInfo ? (systemInfo.memory.total_mb / 1024).toFixed(1) : '--';
  const cpuPercent = systemInfo ? `${Math.round(systemInfo.cpu.usage_percent)}%` : '--';
  const gpuLabel = systemInfo?.gpu ? (systemInfo.gpu.name || systemInfo.gpu.vendor || '--') : '--';
  const profile = systemInfo?.active_profile || systemInfo?.recommended_profile || 'LOW';

  const profileColor: Record<string, string> = {
    POWER_SAVER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    VERY_LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    BALANCED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    HIGH: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  const badgeStyle = profileColor[profile] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';

  const totalChanges = gitStatus ? (gitStatus.staged_files.length + gitStatus.unstaged_files.length + gitStatus.untracked_files.length) : 0;

  return (
    <div className="w-80 h-full bg-[#14161d] border-l border-[#2b313e] flex flex-col shrink-0 select-none">
      {/* Header Tabs */}
      <div className="h-9 bg-[#181b22] border-b border-[#2b313e] flex items-center px-2 gap-1 shrink-0">
        <button
          onClick={() => setTab('changes')}
          className={`flex-1 py-1 px-2 text-xs rounded transition flex items-center justify-center gap-1 ${
            tab === 'changes' ? 'bg-[#1f232d] text-blue-400 font-medium' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <FileDiff size={12} />
          <span>Changes ({totalChanges})</span>
        </button>

        <button
          onClick={() => setTab('diagnostics')}
          className={`flex-1 py-1 px-2 text-xs rounded transition flex items-center justify-center gap-1 ${
            tab === 'diagnostics' ? 'bg-[#1f232d] text-blue-400 font-medium' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <AlertCircle size={12} />
          <span>Issues ({diagnostics.length})</span>
        </button>

        <button
          onClick={() => setTab('plan')}
          className={`flex-1 py-1 px-2 text-xs rounded transition flex items-center justify-center gap-1 ${
            tab === 'plan' ? 'bg-[#1f232d] text-blue-400 font-medium' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <ListChecks size={12} />
          <span>Plan</span>
        </button>
      </div>

      {/* Main Content (Changes, Diagnostics, or Plan) */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {tab === 'changes' && (
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Project Changes
            </div>

            {totalChanges === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Working directory clean. No modified files.
              </div>
            ) : (
              <div className="space-y-1 font-mono text-xs">
                {gitStatus?.staged_files.map((f) => (
                  <div key={f} className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="font-bold">+</span>
                    <span className="truncate">{f}</span>
                  </div>
                ))}
                {gitStatus?.unstaged_files.map((f) => (
                  <div key={f} className="flex items-center gap-2 px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <span className="font-bold">~</span>
                    <span className="truncate">{f}</span>
                  </div>
                ))}
                {gitStatus?.untracked_files.map((f) => (
                  <div key={f} className="flex items-center gap-2 px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <span className="font-bold">?</span>
                    <span className="truncate">{f}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'diagnostics' && <DiagnosticsList />}
        {tab === 'plan' && <PlanChecklist />}
      </div>

      {/* System Hardware Mini-Monitor Widget */}
      <div className="border-t border-[#2b313e] bg-[#101217] p-3 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
            <Activity size={13} className="text-blue-400" />
            <span>System Hardware</span>
          </div>
          <button
            onClick={onOpenSettings}
            className="flex items-center text-[10px] text-gray-400 hover:text-blue-400 transition"
            title="Open System Check & Toolchain Details"
          >
            <span>Details</span>
            <ChevronRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#181b22] border border-[#2b313e]/70 rounded p-1.5">
            <span className="text-gray-500 block text-[10px]">CPU</span>
            <span className="font-mono text-gray-200 font-medium">{cpuPercent}</span>
          </div>

          <div className="bg-[#181b22] border border-[#2b313e]/70 rounded p-1.5">
            <span className="text-gray-500 block text-[10px]">RAM</span>
            <span className="font-mono text-gray-200 font-medium">{ramUsedGb} / {ramTotalGb}GB</span>
          </div>

          <div className="bg-[#181b22] border border-[#2b313e]/70 rounded p-1.5">
            <span className="text-gray-500 block text-[10px]">GPU</span>
            <span className="font-mono text-gray-200 font-medium truncate block" title={gpuLabel}>
              {gpuLabel}
            </span>
          </div>

          <div className="bg-[#181b22] border border-[#2b313e]/70 rounded p-1.5 flex flex-col justify-between">
            <span className="text-gray-500 block text-[10px]">PROFILE</span>
            <span className={`text-[9px] px-1 py-0.5 rounded border font-semibold text-center uppercase ${badgeStyle}`}>
              {profile}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

