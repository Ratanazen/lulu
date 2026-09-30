import { create } from 'zustand';
import { CCppToolchainInfo, CCppProjectDetails } from '../types/c_cpp';
import { invokeCommand } from '../services/tauriBridge';

interface CCppStore {
  toolchain: CCppToolchainInfo | null;
  projectDetails: CCppProjectDetails | null;
  isLoading: boolean;
  error: string | null;

  refreshToolchain: () => Promise<void>;
  detectProject: (workspacePath: string) => Promise<void>;
  formatFile: (filePath: string) => Promise<string>;
}

export const useCCppStore = create<CCppStore>((set) => ({
  toolchain: null,
  projectDetails: null,
  isLoading: false,
  error: null,

  refreshToolchain: async () => {
    set({ isLoading: true, error: null });
    try {
      const tc = await invokeCommand<CCppToolchainInfo>('get_c_cpp_toolchain');
      set({ toolchain: tc, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e?.message || String(e) });
    }
  },

  detectProject: async (workspacePath: string) => {
    try {
      const details = await invokeCommand<CCppProjectDetails | null>('detect_c_cpp_project', {
        path: workspacePath,
      });
      set({ projectDetails: details });
    } catch (e: any) {
      console.warn('C/C++ project detection failed:', e);
    }
  },

  formatFile: async (filePath: string) => {
    return await invokeCommand<string>('format_c_cpp_file', { path: filePath });
  },
}));
