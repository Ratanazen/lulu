import React, { useEffect } from 'react';
import { useAgentStore } from '../../stores/useAgentStore';
import { Clock, CheckCircle2, XCircle, AlertCircle, RotateCcw } from 'lucide-react';

export const TaskHistoryList: React.FC = () => {
  const { tasks, loadTaskHistory, startTask } = useAgentStore();

  useEffect(() => {
    loadTaskHistory();
  }, [loadTaskHistory]);

  return (
    <div className="flex flex-col h-full bg-[#14161d] select-none text-xs">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2b313e]">
        <span className="font-semibold text-gray-400 uppercase tracking-wider text-[11px]">
          TASK HISTORY ({tasks.length})
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tasks.length === 0 ? (
          <div className="p-4 text-center text-gray-500 italic">No previous tasks recorded.</div>
        ) : (
          tasks.map((task) => {
            const isSuccess = task.status === 'COMPLETED';
            const isFailed = task.status === 'FAILED';

            return (
              <div
                key={task.id}
                className="p-2.5 rounded-lg bg-[#181b22] border border-[#2b313e] hover:border-gray-600 transition flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-200 truncate">{task.title}</span>
                  <div className="flex items-center gap-1">
                    {isSuccess && <CheckCircle2 size={13} className="text-emerald-400" />}
                    {isFailed && <XCircle size={13} className="text-red-400" />}
                    {!isSuccess && !isFailed && <Clock size={13} className="text-blue-400" />}
                    <span className="text-[10px] text-gray-400">{task.status}</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 line-clamp-2">{task.prompt}</p>

                <div className="flex items-center justify-between pt-1 border-t border-[#2b313e]/40 text-[10px] text-gray-500">
                  <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => startTask(task.prompt)}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition"
                  >
                    <RotateCcw size={11} /> Re-run
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
