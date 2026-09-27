import { create } from 'zustand';
import { invokeCommand } from '../services/tauriBridge';

export interface GitStatusState {
  branch: string;
  staged_files: string[];
  unstaged_files: string[];
  untracked_files: string[];
  is_clean: boolean;
}

interface GitStore {
  status: GitStatusState | null;
  activeDiff: string;
  isLoading: boolean;

  refreshStatus: (repoPath: string) => Promise<void>;
  fetchDiff: (repoPath: string, filePath?: string, staged?: boolean) => Promise<void>;
  commit: (repoPath: string, message: string, files?: string[]) => Promise<string>;
}

export const useGitStore = create<GitStore>((set) => ({
  status: null,
  activeDiff: '',
  isLoading: false,

  refreshStatus: async (repoPath: string) => {
    set({ isLoading: true });
    try {
      const res = await invokeCommand<GitStatusState>('git_status', { repoPath });
      set({ status: res, isLoading: false });
    } catch {
      set({ status: null, isLoading: false });
    }
  },

  fetchDiff: async (repoPath, filePath, staged = false) => {
    try {
      const diff = await invokeCommand<string>('git_diff', {
        repoPath,
        filePath,
        staged,
      });
      set({ activeDiff: diff });
    } catch (e) {
      console.error('Failed to fetch git diff:', e);
    }
  },

  commit: async (repoPath, message, files) => {
    const res = await invokeCommand<string>('git_commit', {
      repoPath,
      message,
      files,
    });
    return res;
  },
}));
