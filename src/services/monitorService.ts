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

  public static async getHostHardwareInfo(): Promise<HostHardwareInfo | null> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        return await invoke<HostHardwareInfo>('get_host_hardware_info');
      } catch (e) {
        console.warn('[MonitorService] get_host_hardware_info failed:', e);
      }
    }
    return {
      hostname: 'desktop-host',
      osName: 'Linux',
      osVersion: '6.x',
      kernelVersion: '6.12-arch',
      desktopEnvironment: 'sway',
      windowManager: 'Sway (Wayland)',
      sessionType: 'wayland',
      uptimeSeconds: 84600,
      processCount: 180,
      batteryPercentage: 91,
      batteryState: 'Charging',
      acOnline: true,
      cpu: {
        brand: 'AMD Ryzen 5 7520U with Radeon Graphics',
        cores: 4,
        threads: 8,
        frequencyMhz: 2800,
        usagePercentage: 14.5,
        perCoreUsage: [12.0, 15.2, 11.8, 18.0, 10.5, 14.0, 16.2, 18.3],
      },
      memory: {
        totalMb: 15252,
        usedMb: 5585,
        availableMb: 9667,
        freeMb: 1024,
        usagePercentage: 36.6,
        swapTotalMb: 15251,
        swapUsedMb: 855,
        swapPercentage: 5.6,
      },
      gpu: {
        vendor: 'AMD',
        model: 'AMD Mendocino [Radeon 610M]',
        driver: 'amdgpu',
        usagePercentage: 3.5,
        vramTotalMb: 512,
        vramUsedMb: 403,
        gttTotalMb: 7626,
        gttUsedMb: 332,
        temperatureC: 66.0,
        powerWatts: 18.25,
        clockMhz: 200,
      },
    };
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

export interface HostCpuInfo {
  brand: string;
  cores: number;
  threads: number;
  frequencyMhz: number;
  usagePercentage: number;
  perCoreUsage: number[];
}

export interface HostMemoryInfo {
  totalMb: number;
  usedMb: number;
  availableMb: number;
  freeMb: number;
  usagePercentage: number;
  swapTotalMb: number;
  swapUsedMb: number;
  swapPercentage: number;
}

export interface HostGpuInfo {
  vendor: string;
  model: string;
  driver: string;
  usagePercentage: number;
  vramTotalMb: number;
  vramUsedMb: number;
  gttTotalMb: number;
  gttUsedMb: number;
  temperatureC?: number | null;
  powerWatts?: number | null;
  clockMhz?: number | null;
}

export interface HostHardwareInfo {
  hostname: string;
  osName: string;
  osVersion: string;
  kernelVersion: string;
  desktopEnvironment: string;
  windowManager: string;
  sessionType: string;
  uptimeSeconds: number;
  processCount: number;
  batteryPercentage?: number | null;
  batteryState?: string | null;
  acOnline: boolean;
  cpu: HostCpuInfo;
  memory: HostMemoryInfo;
  gpu: HostGpuInfo;
}

