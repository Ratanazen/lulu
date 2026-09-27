import React from 'react';
import { useAgentStore } from '../../stores/useAgentStore';
import { CheckCircle2, Circle, Clock, AlertCircle, XCircle } from 'lucide-react';

export const PlanChecklist: React.FC = () => {
  const { activeTask } = useAgentStore();

  if (!activeTask || activeTask.plan.length === 0) {
    return (
      <div className="p-3 text-xs text-gray-500 italic">
        No active plan. Start a task to generate a plan.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2 select-none">
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Active Execution Plan
      </div>
      <div className="space-y-1.5">
        {activeTask.plan.map((step, idx) => {
          let icon = <Circle size={14} className="text-gray-500" />;
          let textClass = 'text-gray-400';

          if (step.status === 'running') {
            icon = <Clock size={14} className="text-blue-400 animate-spin" />;
            textClass = 'text-blue-300 font-medium';
          } else if (step.status === 'completed') {
            icon = <CheckCircle2 size={14} className="text-emerald-400" />;
            textClass = 'text-gray-300';
          } else if (step.status === 'failed') {
            icon = <XCircle size={14} className="text-red-400" />;
            textClass = 'text-red-300';
          } else if (step.status === 'skipped') {
            icon = <AlertCircle size={14} className="text-amber-400" />;
            textClass = 'text-gray-500 line-through';
          }

          return (
            <div
              key={step.id}
              className="flex items-start gap-2 p-1.5 rounded hover:bg-[#1f232d] text-xs transition"
            >
              <div className="pt-0.5 shrink-0">{icon}</div>
              <div className="flex-1">
                <span className={textClass}>
                  {idx + 1}. {step.title}
                </span>
                {step.output && (
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{step.output}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
