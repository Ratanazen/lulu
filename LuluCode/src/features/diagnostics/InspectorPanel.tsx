import React, { useState } from 'react';
import { PlanChecklist } from '../plans/PlanChecklist';
import { DiagnosticsList } from './DiagnosticsList';
import { useDiagnosticsStore } from '../../stores/useDiagnosticsStore';
import { ListChecks, AlertCircle } from 'lucide-react';

export const InspectorPanel: React.FC = () => {
  const [tab, setTab] = useState<'plan' | 'diagnostics'>('plan');
  const { diagnostics } = useDiagnosticsStore();

  return (
    <div className="w-80 h-full bg-[#14161d] border-l border-[#2b313e] flex flex-col shrink-0 select-none">
      {/* Header Tabs */}
      <div className="h-9 bg-[#181b22] border-b border-[#2b313e] flex items-center px-2 gap-1 shrink-0">
        <button
          onClick={() => setTab('plan')}
          className={`flex-1 py-1 px-2 text-xs rounded transition flex items-center justify-center gap-1.5 ${
            tab === 'plan' ? 'bg-[#1f232d] text-blue-400 font-medium' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <ListChecks size={13} />
          <span>Plan</span>
        </button>

        <button
          onClick={() => setTab('diagnostics')}
          className={`flex-1 py-1 px-2 text-xs rounded transition flex items-center justify-center gap-1.5 ${
            tab === 'diagnostics' ? 'bg-[#1f232d] text-blue-400 font-medium' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <AlertCircle size={13} />
          <span>Issues ({diagnostics.length})</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'plan' && <PlanChecklist />}
        {tab === 'diagnostics' && <DiagnosticsList />}
      </div>
    </div>
  );
};
