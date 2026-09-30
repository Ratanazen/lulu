import { create } from 'zustand';
import { invokeCommand } from '../services/tauriBridge';

export type TerminalTabId = 'terminal-1' | 'terminal-2' | 'tests' | 'agent';

export interface TerminalOutputLine {
  id: string;
  type: 'cmd' | 'stdout' | 'stderr' | 'info' | 'error' | 'success';
  text: string;
  timestamp: string;
}

interface TerminalStore {
  activeTab: TerminalTabId;
  logs: Record<TerminalTabId, TerminalOutputLine[]>;
  isRunning: boolean;
  runningCommandId: string | null;

  setActiveTab: (tab: TerminalTabId) => void;
  appendLog: (tab: TerminalTabId, type: TerminalOutputLine['type'], text: string) => void;
  clearTab: (tab: TerminalTabId) => void;
  runCommandInTab: (tab: TerminalTabId, cmd: string, cwd: string) => Promise<{ exitCode: number; stdout: string; stderr: string }>;
  stopRunningCommand: () => Promise<void>;
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  activeTab: 'agent',
  logs: {
    'terminal-1': [],
    'terminal-2': [],
    tests: [],
    agent: [],
  },
  isRunning: false,
  runningCommandId: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  appendLog: (tab, type, text) => {
    const line: TerminalOutputLine = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    set((state) => {
      const existing = state.logs[tab] || [];
      const MAX_LINES = 5000;
      const updated = existing.length >= MAX_LINES 
        ? [...existing.slice(existing.length - MAX_LINES + 1), line]
        : [...existing, line];
      return {
        logs: {
          ...state.logs,
          [tab]: updated,
        },
      };
    });
  },

  clearTab: (tab) => {
    set((state) => ({
      logs: {
        ...state.logs,
        [tab]: [],
      },
    }));
  },

  runCommandInTab: async (tab, cmd, cwd) => {
    const cid = 'cmd_' + Date.now();
    set({ isRunning: true, runningCommandId: cid });
    get().appendLog(tab, 'cmd', `$ ${cmd}`);

    try {
      const res = await invokeCommand<{
        exit_code: number;
        stdout: string;
        stderr: string;
        duration_ms: number;
        timed_out: boolean;
      }>('run_process', {
        commandId: cid,
        command: cmd,
        cwd,
        timeoutSecs: 120,
      });

      if (res.stdout) {
        get().appendLog(tab, 'stdout', res.stdout);
      }
      if (res.stderr) {
        get().appendLog(tab, 'stderr', res.stderr);
      }

      if (res.exit_code === 0) {
        get().appendLog(tab, 'success', `[Command completed: exit code 0 (${res.duration_ms}ms)]`);
      } else {
        get().appendLog(tab, 'error', `[Command failed: exit code ${res.exit_code} (${res.duration_ms}ms)]`);
      }

      set({ isRunning: false, runningCommandId: null });
      return { exitCode: res.exit_code, stdout: res.stdout, stderr: res.stderr };
    } catch (e) {
      get().appendLog(tab, 'error', `Execution error: ${e}`);
      set({ isRunning: false, runningCommandId: null });
      return { exitCode: -1, stdout: '', stderr: String(e) };
    }
  },

  stopRunningCommand: async () => {
    const { runningCommandId } = get();
    if (!runningCommandId) return;
    try {
      await invokeCommand('stop_process', { commandId: runningCommandId });
      set({ isRunning: false, runningCommandId: null });
    } catch (e) {
      console.error('Failed to stop process:', e);
    }
  },
}));
