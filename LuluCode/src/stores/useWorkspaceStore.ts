import { create } from 'zustand';
import { FileNode, ProjectMetadata } from '../types/workspace';
import { invokeCommand } from '../services/tauriBridge';

interface WorkspaceStore {
  rootPath: string | null;
  projectMetadata: ProjectMetadata | null;
  fileTree: FileNode[];
  selectedPath: string | null;
  isLoading: boolean;
  error: string | null;

  openWorkspace: (path: string) => Promise<void>;
  refreshFileTree: () => Promise<void>;
  selectFile: (path: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  rootPath: null,
  projectMetadata: null,
  fileTree: [],
  selectedPath: null,
  isLoading: false,
  error: null,

  openWorkspace: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const meta = await invokeCommand<ProjectMetadata>('open_workspace', { path });
      const tree = await invokeCommand<FileNode[]>('list_directory', { workspace: path, maxDepth: 4 });
      set({
        rootPath: path,
        projectMetadata: meta,
        fileTree: tree,
        isLoading: false,
      });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  refreshFileTree: async () => {
    const { rootPath } = get();
    if (!rootPath) return;
    try {
      const tree = await invokeCommand<FileNode[]>('list_directory', { workspace: rootPath, maxDepth: 4 });
      set({ fileTree: tree });
    } catch (e) {
      console.error('Failed to refresh file tree:', e);
    }
  },

  selectFile: (path: string) => {
    set({ selectedPath: path });
  },
}));
