import { create } from 'zustand';
import { Diagnostic } from '../types/diagnostics';
import { invokeCommand } from '../services/tauriBridge';

interface DiagnosticsStore {
  diagnostics: Diagnostic[];
  filter: 'all' | 'error' | 'warning';

  parseOutput: (output: string) => Promise<void>;
  clearDiagnostics: () => void;
  setFilter: (f: 'all' | 'error' | 'warning') => void;
}

export const useDiagnosticsStore = create<DiagnosticsStore>((set) => ({
  diagnostics: [],
  filter: 'all',

  parseOutput: async (output) => {
    try {
      const parsed = await invokeCommand<Diagnostic[]>('get_diagnostics', { output });
      set({ diagnostics: parsed });
    } catch (e) {
      console.error('Failed to parse diagnostics:', e);
    }
  },

  clearDiagnostics: () => set({ diagnostics: [] }),
  setFilter: (filter) => set({ filter }),
}));
