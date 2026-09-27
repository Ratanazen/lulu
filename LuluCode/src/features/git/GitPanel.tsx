import React, { useState, useEffect } from 'react';
import { useGitStore } from '../../stores/useGitStore';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { GitBranch, GitCommit, RefreshCw, FileDiff, Check, Plus, AlertCircle } from 'lucide-react';

export const GitPanel: React.FC = () => {
  const { status, refreshStatus, commit, fetchDiff, activeDiff } = useGitStore();
  const { rootPath } = useWorkspaceStore();
  const { showDiff } = useEditorStore();
  const [commitMsg, setCommitMsg] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);

  useEffect(() => {
    if (rootPath) {
      refreshStatus(rootPath);
    }
  }, [rootPath, refreshStatus]);

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootPath || !commitMsg.trim() || isCommitting) return;
    setIsCommitting(true);
    try {
      await commit(rootPath, commitMsg.trim());
      setCommitMsg('');
      await refreshStatus(rootPath);
    } catch (e) {
      alert(`Commit error: ${e}`);
    } finally {
      setIsCommitting(false);
    }
  };

  const handleViewDiff = async (file: string, staged: boolean) => {
    if (!rootPath) return;
    await fetchDiff(rootPath, file, staged);
    const freshDiff = useGitStore.getState().activeDiff;
    showDiff('// Base commit version', freshDiff || '// Proposed changes');
  };

  if (!status) {
    return (
      <div className="p-4 text-xs text-gray-500 text-center">
        <GitBranch size={24} className="mx-auto mb-2 opacity-50" />
        No Git repository detected or repository not loaded.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#14161d] select-none text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2b313e]">
        <div className="flex items-center gap-1.5 text-gray-300 font-medium">
          <GitBranch size={13} className="text-blue-400" />
          <span>{status.branch}</span>
        </div>
        <button
          onClick={() => rootPath && refreshStatus(rootPath)}
          className="p-1 rounded hover:bg-[#1f232d] text-gray-400 hover:text-gray-200 transition"
          title="Refresh Git status"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Staged Changes */}
        <div>
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Staged Changes ({status.staged_files.length})</span>
          </div>
          {status.staged_files.length === 0 ? (
            <p className="text-[11px] text-gray-600 italic">No staged changes</p>
          ) : (
            <div className="space-y-1">
              {status.staged_files.map((file) => (
                <div
                  key={file}
                  onClick={() => handleViewDiff(file, true)}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-[#1f232d] cursor-pointer text-emerald-400"
                >
                  <span className="truncate">{file}</span>
                  <FileDiff size={12} className="opacity-60" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unstaged Changes */}
        <div>
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Changes ({status.unstaged_files.length})</span>
          </div>
          {status.unstaged_files.length === 0 ? (
            <p className="text-[11px] text-gray-600 italic">No unstaged changes</p>
          ) : (
            <div className="space-y-1">
              {status.unstaged_files.map((file) => (
                <div
                  key={file}
                  onClick={() => handleViewDiff(file, false)}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-[#1f232d] cursor-pointer text-amber-400"
                >
                  <span className="truncate">{file}</span>
                  <FileDiff size={12} className="opacity-60" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commit Box */}
      <form onSubmit={handleCommit} className="p-3 bg-[#181b22] border-t border-[#2b313e] space-y-2">
        <textarea
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          placeholder="Commit message..."
          rows={2}
          className="w-full bg-[#12141a] border border-[#2b313e] rounded p-2 text-xs text-gray-200 outline-none resize-none focus:border-blue-500 placeholder:text-gray-600"
        />
        <button
          type="submit"
          disabled={!commitMsg.trim() || isCommitting || status.is_clean}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition disabled:opacity-40"
        >
          <GitCommit size={13} /> Commit Changes
        </button>
      </form>
    </div>
  );
};
