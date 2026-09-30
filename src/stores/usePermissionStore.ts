import { create } from 'zustand';
import { PermissionLevel, PermissionRequest } from '../types/permissions';
import { invokeCommand } from '../services/tauriBridge';

interface PermissionStore {
  level: PermissionLevel;
  pendingRequest: PermissionRequest | null;
  allowedScopes: Set<string>;

  setLevel: (level: PermissionLevel) => Promise<void>;
  requestPermission: (req: PermissionRequest) => Promise<boolean>;
  resolveRequest: (allow: boolean, scopeAction?: 'once' | 'task' | 'project') => void;
}

export const usePermissionStore = create<PermissionStore>((set, get) => ({
  level: 'SAFE_EDIT',
  pendingRequest: null,
  allowedScopes: new Set<string>(),

  setLevel: async (level) => {
    set({ level });
    try {
      await invokeCommand('set_permission_level', { level });
    } catch (e) {
      console.error('Failed to set permission level in native backend:', e);
    }
  },

  requestPermission: (req) => {
    const { level, allowedScopes } = get();

    if (level === 'AUTONOMOUS') {
      return Promise.resolve(true);
    }

    if (allowedScopes.has(`${req.toolName}:${req.target}`)) {
      return Promise.resolve(true);
    }

    return new Promise<boolean>((resolve) => {
      set({ pendingRequest: req });

      const checkInterval = setInterval(() => {
        const state = get();
        if (!state.pendingRequest) {
          clearInterval(checkInterval);
          resolve(get().allowedScopes.has(`${req.toolName}:${req.target}`));
        }
      }, 100);
    });
  },

  resolveRequest: (allow, scopeAction = 'once') => {
    const { pendingRequest, allowedScopes } = get();
    if (!pendingRequest) return;

    if (allow) {
      if (scopeAction === 'task' || scopeAction === 'project') {
        const newScopes = new Set(allowedScopes);
        newScopes.add(`${pendingRequest.toolName}:${pendingRequest.target}`);
        set({ allowedScopes: newScopes });
      }
    }

    set({ pendingRequest: null });
  },
}));
