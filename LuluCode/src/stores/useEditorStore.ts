import { create } from 'zustand';
import { invokeCommand } from '../services/tauriBridge';

export interface EditorTab {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  language: string;
}

interface EditorStore {
  tabs: EditorTab[];
  activePath: string | null;
  diffMode: boolean;
  diffOriginal: string;
  diffModified: string;

  openFile: (workspace: string, path: string) => Promise<void>;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
  updateContent: (path: string, content: string) => void;
  saveFile: (workspace: string, path: string) => Promise<void>;
  showDiff: (original: string, modified: string) => void;
  closeDiff: () => void;
}

function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'rs': return 'rust';
    case 'c':
    case 'h': return 'c';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'hh':
    case 'hxx': return 'cpp';
    case 'ts':
    case 'tsx': return 'typescript';
    case 'js':
    case 'jsx': return 'javascript';
    case 'py': return 'python';
    case 'go': return 'go';
    case 'json': return 'json';
    case 'md': return 'markdown';
    case 'toml': return 'toml';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'sql': return 'sql';
    case 'sh': return 'shell';
    case 'yaml':
    case 'yml': return 'yaml';
    default: return 'plaintext';
  }
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  tabs: [],
  activePath: null,
  diffMode: false,
  diffOriginal: '',
  diffModified: '',

  openFile: async (workspace: string, path: string) => {
    const existing = get().tabs.find((t) => t.path === path);
    if (existing) {
      set({ activePath: path, diffMode: false });
      return;
    }

    try {
      const content = await invokeCommand<string>('read_file', { workspace, path });
      const name = path.split('/').pop() || path;
      const language = detectLanguage(path);

      const newTab: EditorTab = {
        path,
        name,
        content,
        originalContent: content,
        isDirty: false,
        language,
      };

      set((state) => ({
        tabs: [...state.tabs, newTab],
        activePath: path,
        diffMode: false,
      }));
    } catch (e) {
      console.error('Failed to open file:', e);
    }
  },

  closeTab: (path: string) => {
    set((state) => {
      const filtered = state.tabs.filter((t) => t.path !== path);
      let nextActive = state.activePath;
      if (state.activePath === path) {
        nextActive = filtered.length > 0 ? filtered[filtered.length - 1].path : null;
      }
      return { tabs: filtered, activePath: nextActive };
    });
  },

  setActiveTab: (path: string) => {
    set({ activePath: path, diffMode: false });
  },

  updateContent: (path: string, content: string) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.path === path
          ? { ...t, content, isDirty: content !== t.originalContent }
          : t
      ),
    }));
  },

  saveFile: async (workspace: string, path: string) => {
    const tab = get().tabs.find((t) => t.path === path);
    if (!tab) return;

    try {
      await invokeCommand('write_file', { workspace, path, content: tab.content });
      set((state) => ({
        tabs: state.tabs.map((t) =>
          t.path === path ? { ...t, originalContent: tab.content, isDirty: false } : t
        ),
      }));
    } catch (e) {
      console.error('Failed to save file:', e);
    }
  },

  showDiff: (original: string, modified: string) => {
    set({ diffMode: true, diffOriginal: original, diffModified: modified });
  },

  closeDiff: () => {
    set({ diffMode: false });
  },
}));
