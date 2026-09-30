import { create } from 'zustand';
import { ComprehensiveSystemInfo } from '../types/system';
import { invokeCommand } from '../services/tauriBridge';
import { copyToClipboard } from '../utils/clipboard';

interface SystemStore {
  systemInfo: ComprehensiveSystemInfo | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  refreshSystemInfo: () => Promise<void>;
  copyReport: () => Promise<boolean>;
}

export const useSystemStore = create<SystemStore>((set, get) => ({
  systemInfo: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  refreshSystemInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const info = await invokeCommand<ComprehensiveSystemInfo>('get_system_info');
      set({
        systemInfo: info,
        isLoading: false,
        lastUpdated: new Date().toLocaleTimeString(),
      });
    } catch (e: any) {
      set({
        isLoading: false,
        error: e?.message || String(e),
      });
    }
  },

  copyReport: async () => {
    try {
      const report = await invokeCommand<string>('get_system_report');
      await copyToClipboard(report);
      return true;
    } catch (e) {
      console.error('Failed to copy report:', e);
      return false;
    }
  },
}));
