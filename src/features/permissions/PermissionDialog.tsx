import React from 'react';
import { usePermissionStore } from '../../stores/usePermissionStore';
import { ShieldAlert, Check, X, ShieldCheck } from 'lucide-react';

export const PermissionDialog: React.FC = () => {
  const { pendingRequest, resolveRequest } = usePermissionStore();

  if (!pendingRequest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#181b22] border border-[#2b313e] rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 p-4 bg-[#1f232d] border-b border-[#2b313e]">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Permission Required</h3>
            <p className="text-xs text-gray-400">Lulu Code requires your authorization</p>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div>
            <span className="text-gray-400 block mb-1">Action:</span>
            <div className="px-3 py-2 rounded bg-[#12141a] border border-[#2b313e] font-mono text-gray-200">
              <span className="text-cyan-400 font-bold">{pendingRequest.toolName}</span>: {pendingRequest.target}
            </div>
          </div>

          <div>
            <span className="text-gray-400 block mb-1">Description:</span>
            <p className="text-gray-300 leading-relaxed bg-[#12141a]/50 p-2.5 rounded border border-[#2b313e]/50">
              {pendingRequest.description}
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#14161d] border-t border-[#2b313e] flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => resolveRequest(true, 'once')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition"
            >
              <Check size={14} /> Allow Once
            </button>
            <button
              onClick={() => resolveRequest(true, 'task')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#242b38] hover:bg-[#2e3748] text-gray-200 text-xs transition"
            >
              <ShieldCheck size={14} /> Allow for Task
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => resolveRequest(true, 'project')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1f242e] hover:bg-[#282f3d] text-gray-300 text-xs transition"
            >
              Allow for Project
            </button>
            <button
              onClick={() => resolveRequest(false)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs transition"
            >
              <X size={14} /> Deny
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
