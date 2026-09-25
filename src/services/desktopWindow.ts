import { WindowPosition, WindowSize } from '../types';

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

export class DesktopWindowService {
  private static mockPos: WindowPosition = { x: 100, y: 100 };
  private static mockSize: WindowSize = { width: 240, height: 260 };

  public static async getPosition(label: string = 'main'): Promise<WindowPosition> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        return await invoke<WindowPosition>('get_window_position', { label });
      } catch (e) {
        console.warn('[DesktopWindowService] get_window_position failed, using cached/mock:', e);
      }
    }
    return { ...this.mockPos };
  }

  public static async setPosition(x: number, y: number, label: string = 'main'): Promise<void> {
    const invoke = await getInvoke();
    this.mockPos = { x: Math.round(x), y: Math.round(y) };
    if (invoke) {
      try {
        await invoke('set_window_position', { label, x: Math.round(x), y: Math.round(y) });
      } catch (e) {
        console.warn('[DesktopWindowService] set_window_position failed:', e);
      }
    }
  }

  public static async getSize(label: string = 'main'): Promise<WindowSize> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        return await invoke<WindowSize>('get_window_size', { label });
      } catch (e) {
        console.warn('[DesktopWindowService] get_window_size failed:', e);
      }
    }
    return { ...this.mockSize };
  }

  public static async setSize(width: number, height: number, label: string = 'main'): Promise<void> {
    const invoke = await getInvoke();
    this.mockSize = { width: Math.round(width), height: Math.round(height) };
    if (invoke) {
      try {
        await invoke('set_window_size', { label, width: Math.round(width), height: Math.round(height) });
      } catch (e) {
        console.warn('[DesktopWindowService] set_window_size failed:', e);
      }
    }
  }

  public static async setAlwaysOnTop(onTop: boolean, label: string = 'main'): Promise<void> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('set_always_on_top', { label, onTop });
      } catch (e) {
        console.warn('[DesktopWindowService] set_always_on_top failed:', e);
      }
    }
  }

  public static async setClickThrough(ignore: boolean, label: string = 'main'): Promise<void> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('set_click_through', { label, ignore });
      } catch (e) {
        console.warn('[DesktopWindowService] set_click_through failed:', e);
      }
    }
  }

  public static async show(label: string = 'main'): Promise<void> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('show_window', { label });
      } catch (e) {
        console.warn('[DesktopWindowService] show_window failed:', e);
      }
    }
  }

  public static async hide(label: string = 'main'): Promise<void> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('hide_window', { label });
      } catch (e) {
        console.warn('[DesktopWindowService] hide_window failed:', e);
      }
    }
  }

  public static async startDragging(label: string = 'main'): Promise<void> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('start_dragging', { label });
      } catch (e) {
        console.warn('[DesktopWindowService] start_dragging failed:', e);
      }
    }
  }

  public static async exit(): Promise<void> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('exit_app');
        return;
      } catch (e) {
        console.warn('[DesktopWindowService] exit_app failed:', e);
      }
    }
    if (typeof window !== 'undefined') {
      window.close();
    }
  }

  public static async isAutostartEnabled(): Promise<boolean> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        return await invoke<boolean>('is_autostart_enabled');
      } catch (e) {
        console.warn('[DesktopWindowService] is_autostart_enabled failed:', e);
      }
    }
    return false;
  }

  public static async setAutostartEnabled(enabled: boolean): Promise<void> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('set_autostart_enabled', { enabled });
      } catch (e) {
        console.warn('[DesktopWindowService] set_autostart_enabled failed:', e);
      }
    }
  }
}

