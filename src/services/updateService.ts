// Update Service for Lulu Desktop Companion
// Connects UI with Tauri native check_for_updates & run_update_task commands.

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  currentCommit: string;
  remoteCommit: string;
  commitsBehind: number;
  isClean: boolean;
  statusMessage: string;
}

export interface UpdateTaskResult {
  success: boolean;
  message: string;
  outputLog: string;
}

let tauriInvoke: (<T = any>(cmd: string, args?: Record<string, unknown>) => Promise<T>) | null = null;

async function getInvoke() {
  if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
    return null;
  }
  if (tauriInvoke) return tauriInvoke;
  try {
    const core = await import('@tauri-apps/api/core');
    tauriInvoke = core.invoke;
    return tauriInvoke;
  } catch {
    return null;
  }
}

export class UpdateService {
  private static instance: UpdateService;

  public static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  public async checkForUpdates(path?: string): Promise<UpdateCheckResult> {
    const invoke = await getInvoke();
    if (!invoke) {
      return {
        hasUpdate: false,
        currentVersion: '0.1.0',
        currentCommit: 'dev-local',
        remoteCommit: 'dev-local',
        commitsBehind: 0,
        isClean: true,
        statusMessage: 'Lulu is running in development mode (up to date)',
      };
    }

    try {
      return await invoke<UpdateCheckResult>('check_for_updates', { path });
    } catch (err: any) {
      return {
        hasUpdate: false,
        currentVersion: '0.1.0',
        currentCommit: 'unknown',
        remoteCommit: 'unknown',
        commitsBehind: 0,
        isClean: false,
        statusMessage: `Update check failed: ${err?.message || String(err)}`,
      };
    }
  }

  public async runUpdateTask(path?: string): Promise<UpdateTaskResult> {
    const invoke = await getInvoke();
    if (!invoke) {
      return {
        success: true,
        message: 'Mock update succeeded in browser mode',
        outputLog: '[Mock Update Task]\nStep 1: Check repo\nStep 2: Build assets\nStep 3: Complete\nStatus: OK',
      };
    }

    try {
      return await invoke<UpdateTaskResult>('run_update_task', { path, full: false });
    } catch (err: any) {
      return {
        success: false,
        message: `Update execution error: ${err?.message || String(err)}`,
        outputLog: `Error: ${err?.message || String(err)}`,
      };
    }
  }

  public async runFullUpdateTask(path?: string): Promise<UpdateTaskResult> {
    const invoke = await getInvoke();
    if (!invoke) {
      return {
        success: true,
        message: 'Mock full update succeeded in browser mode',
        outputLog: '[Mock Full Update Task]\n[1/7] Git check\n[2/7] Build Lulu\n[3/7] Build Lulu Code\n[4/7] Install desktop binaries\nStatus: OK',
      };
    }

    try {
      return await invoke<UpdateTaskResult>('run_update_task', { path, full: true });
    } catch (err: any) {
      return {
        success: false,
        message: `Full update execution error: ${err?.message || String(err)}`,
        outputLog: `Error: ${err?.message || String(err)}`,
      };
    }
  }
}

export const updateService = UpdateService.getInstance();
