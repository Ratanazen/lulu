import { MonitorInfo, Vector2D } from '../types';

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

export class MonitorService {
  private static cachedMonitors: MonitorInfo[] = [];

  public static async getMonitors(): Promise<MonitorInfo[]> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        const mons = await invoke<MonitorInfo[]>('get_monitors');
        if (mons && mons.length > 0) {
          this.cachedMonitors = mons;
          return mons;
        }
      } catch (e) {
        console.warn('[MonitorService] get_monitors failed, using fallback:', e);
      }
    }

    if (this.cachedMonitors.length > 0) {
      return this.cachedMonitors;
    }

    // Dev/browser fallback using window.screen
    const width = typeof window !== 'undefined' ? window.screen.width : 1920;
    const height = typeof window !== 'undefined' ? window.screen.height : 1080;
    const availWidth = typeof window !== 'undefined' ? window.screen.availWidth : 1920;
    const availHeight = typeof window !== 'undefined' ? window.screen.availHeight : 1040;
    const scale = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    const fallback: MonitorInfo[] = [
      {
        id: 'mon_primary',
        name: 'Main Display',
        x: 0,
        y: 0,
        width,
        height,
        scaleFactor: scale,
        refreshRate: 60,
        primary: true,
        workAreaX: 0,
        workAreaY: 0,
        workAreaWidth: availWidth,
        workAreaHeight: availHeight,
      },
    ];

    this.cachedMonitors = fallback;
    return fallback;
  }

  public static async getCurrentMonitor(): Promise<MonitorInfo | null> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        const current = await invoke<MonitorInfo | null>('get_current_monitor');
        if (current) return current;
      } catch (e) {
        console.warn('[MonitorService] get_current_monitor failed:', e);
      }
    }
    const mons = await this.getMonitors();
    return mons.find((m) => m.primary) || mons[0] || null;
  }

  public static getContainingMonitor(pos: Vector2D, monitors: MonitorInfo[]): MonitorInfo | null {
    for (const m of monitors) {
      const right = m.x + m.width;
      const bottom = m.y + m.height;
      if (pos.x >= m.x && pos.x <= right && pos.y >= m.y && pos.y <= bottom) {
        return m;
      }
    }
    return monitors.find((m) => m.primary) || monitors[0] || null;
  }

  public static async getLinuxDesktopInfo(): Promise<LinuxDesktopInfo | null> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        return await invoke<LinuxDesktopInfo>('get_linux_desktop_info');
      } catch (e) {
        console.warn('[MonitorService] get_linux_desktop_info failed:', e);
      }
    }
    return null;
  }
}

export interface LinuxDesktopInfo {
  desktopEnvironment: string;
  windowManager: string;
  sessionType: string;
  isSway: boolean;
  isHyprland: boolean;
  activeWorkspaces: string[];
}
