import React, { useState } from 'react';
import { useDiagnosticsStore } from '../../stores/useDiagnosticsStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { copyToClipboard } from '../../utils/clipboard';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, Copy, Check } from 'lucide-react';

export const DiagnosticsList: React.FC = () => {
  const { diagnostics, filter, setFilter } = useDiagnosticsStore();
  const { openFile } = useEditorStore();
  const { rootPath } = useWorkspaceStore();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const filtered = diagnostics.filter((d) => {
    if (filter === 'all') return true;
    return d.severity === filter;
  });

  const handleSelect = async (file: string) => {
    if (rootPath) {
      await openFile(rootPath, file);
    }
  };

  const handleCopyDiag = async (e: React.MouseEvent, diag: any, idx: number) => {
    e.stopPropagation();
    const text = `[${diag.source}] ${diag.file}:${diag.line}:${diag.column} - ${diag.message}`;
    await copyToClipboard(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#14161d] select-none text-xs">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2b313e]">
        <span className="font-semibold text-gray-400 uppercase tracking-wider text-[11px]">
          DIAGNOSTICS ({diagnostics.length})
        </span>
        <div className="flex items-center gap-1 bg-[#181b22] p-0.5 rounded border border-[#2b313e]">
          {(['all', 'error', 'warning'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-medium transition ${
                filter === f ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-gray-500 flex flex-col items-center gap-2">
            <CheckCircle2 size={24} className="text-emerald-500/50" />
            <p className="italic">No diagnostics or compiler errors found.</p>
          </div>
        ) : (
          filtered.map((diag, i) => {
            const isErr = diag.severity === 'error';
            return (
              <div
                key={i}
                onClick={() => handleSelect(diag.file)}
                className="group p-2.5 rounded-lg bg-[#181b22] hover:bg-[#1f232d] border border-[#2b313e] cursor-pointer transition flex items-start gap-2.5"
              >
                <div className="pt-0.5 shrink-0">
                  {isErr ? (
                    <AlertCircle size={14} className="text-red-400" />
                  ) : (
                    <AlertTriangle size={14} className="text-amber-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono text-cyan-300 truncate">
                      {diag.file}:{diag.line}:{diag.column}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleCopyDiag(e, diag, i)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition"
                        title="Copy Diagnostic Text"
                      >
                        {copiedIndex === i ? (
                          <Check size={11} className="text-emerald-400" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-white/5 text-gray-400 uppercase">
                        {diag.source}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-snug break-words select-text">{diag.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
