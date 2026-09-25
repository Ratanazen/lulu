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

export class StorageService {
  public static async get<T>(key: string, defaultValue: T): Promise<T> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        const val = await invoke<string | null>('storage_get', { key });
        if (val !== null && val !== undefined) {
          return JSON.parse(val) as T;
        }
      } catch (e) {
        console.warn(`[StorageService] SQLite get failed for key "${key}", checking localStorage fallback:`, e);
      }
    }

    if (typeof localStorage !== 'undefined') {
      const local = localStorage.getItem(`lulu_${key}`);
      if (local) {
        try {
          return JSON.parse(local) as T;
        } catch {
          // ignore parse error
        }
      }
    }

    return defaultValue;
  }

  public static async set<T>(key: string, value: T): Promise<void> {
    const jsonStr = JSON.stringify(value);
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('storage_set', { key, value: jsonStr });
      } catch (e) {
        console.warn(`[StorageService] SQLite set failed for key "${key}":`, e);
      }
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`lulu_${key}`, jsonStr);
      } catch {
        // ignore
      }
    }
  }

  public static async exportBackup(): Promise<string> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        return await invoke<string>('storage_export');
      } catch (e) {
        console.warn('[StorageService] SQLite backup export failed, generating from localStorage fallback:', e);
      }
    }

    // Fallback export from localStorage
    const dump: Record<string, any> = {};
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('lulu_')) {
          dump[k.replace('lulu_', '')] = localStorage.getItem(k);
        }
      }
    }
    return JSON.stringify({ version: 1, createdAt: new Date().toISOString(), fallbackData: dump }, null, 2);
  }

  public static async importBackup(backupJson: string): Promise<boolean> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('storage_import', { json: backupJson });
        return true;
      } catch (e) {
        console.warn('[StorageService] SQLite backup import failed:', e);
      }
    }

    // Fallback import
    try {
      const parsed = JSON.parse(backupJson);
      if (parsed.fallbackData && typeof localStorage !== 'undefined') {
        for (const [k, v] of Object.entries(parsed.fallbackData)) {
          localStorage.setItem(`lulu_${k}`, v as string);
        }
      }
      return true;
    } catch {
      return false;
    }
  }
}
