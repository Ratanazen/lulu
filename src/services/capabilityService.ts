export type CapabilityStatus =
  | 'supported'
  | 'partial'
  | 'unsupported'
  | 'experimental'
  | 'disabled'
  | 'requires_permission'
  | 'requires_dependency';

export type PrivacyLevel =
  | 'local_only'
  | 'user_controlled'
  | 'requires_permission'
  | 'network_required';

export type EffectiveState =
  | 'enabled'
  | 'disabled'
  | 'unavailable'
  | 'requires_permission'
  | 'requires_dependency';

export interface RuntimeCapability {
  id: string;
  name: string;
  category: string;
  status: CapabilityStatus;
  platform: string;
  windowSystem: string;
  dependencies: Record<string, boolean>;
  permission: string;
  fallback?: string;
  privacy: PrivacyLevel;
  reason?: string;
}

export interface EffectiveCapability {
  capability: string;
  availability: CapabilityStatus;
  userEnabled: boolean;
  effectiveState: EffectiveState;
  fallback?: string;
  reason?: string;
}

export interface CapabilityDiagnosticsReport {
  application: string;
  version: string;
  os: string;
  architecture: string;
  windowSystem: string;
  desktopEnvironment: string;
  windowManager: string;
  dbusAvailable: boolean;
  mprisAvailable: boolean;
  notificationServiceAvailable: boolean;
  ollamaAvailable: boolean;
  ttsAvailable: boolean;
  sttAvailable: boolean;
  monitorCount: number;
  capabilities: RuntimeCapability[];
  timestamp: string;
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

export class CapabilityService {
  private static cachedCapabilities: RuntimeCapability[] | null = null;

  /**
   * Fetches authoritative runtime capabilities from native Rust backend
   */
  public static async getCapabilities(): Promise<RuntimeCapability[]> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        const caps = await invoke<RuntimeCapability[]>('get_capabilities');
        if (caps && Array.isArray(caps) && caps.length > 0) {
          this.cachedCapabilities = caps;
          return caps;
        }
      } catch (e) {
        console.warn('[CapabilityService] get_capabilities IPC failed, falling back:', e);
      }
    }

    if (this.cachedCapabilities) {
      return this.cachedCapabilities;
    }

    // Honest Browser/Dev fallback (never faking native D-Bus/MPRIS support)
    const fallbackList: RuntimeCapability[] = [
      {
        id: 'pet.transparent_window',
        name: 'Transparent Pet Window',
        category: 'pet',
        status: 'partial',
        platform: 'web',
        windowSystem: 'browser',
        dependencies: {},
        permission: 'not_required',
        fallback: 'normal_window',
        privacy: 'local_only',
        reason: 'Running in browser preview shell',
      },
      {
        id: 'pet.always_on_top',
        name: 'Always On Top',
        category: 'window',
        status: 'unsupported',
        platform: 'web',
        windowSystem: 'browser',
        dependencies: {},
        permission: 'not_required',
        fallback: 'normal_window',
        privacy: 'local_only',
        reason: 'Native window layering not available in web context',
      },
      {
        id: 'notifications.dbus',
        name: 'Linux Desktop Notifications',
        category: 'notifications',
        status: 'unsupported',
        platform: 'web',
        windowSystem: 'browser',
        dependencies: { dbus: false },
        permission: 'not_required',
        fallback: 'disabled',
        privacy: 'user_controlled',
        reason: 'Native Linux D-Bus unavailable in web sandbox',
      },
      {
        id: 'music.mpris',
        name: 'MPRIS Music Detection',
        category: 'music',
        status: 'unsupported',
        platform: 'web',
        windowSystem: 'browser',
        dependencies: { dbus: false, mpris: false },
        permission: 'not_required',
        fallback: 'music_metadata_unavailable',
        privacy: 'local_only',
        reason: 'MPRIS interface requires native desktop environment',
      },
      {
        id: 'lyrics.lrc',
        name: 'Local LRC Lyrics',
        category: 'lyrics',
        status: 'supported',
        platform: 'web',
        windowSystem: 'browser',
        dependencies: {},
        permission: 'not_required',
        fallback: 'lyrics_unavailable',
        privacy: 'local_only',
      },
      {
        id: 'ai.ollama',
        name: 'Ollama Local AI',
        category: 'ai',
        status: 'requires_dependency',
        platform: 'web',
        windowSystem: 'browser',
        dependencies: { ollama: false },
        permission: 'not_required',
        fallback: 'ai_offline',
        privacy: 'local_only',
        reason: 'Local Ollama service check in browser environment',
      },
      {
        id: 'voice.tts',
        name: 'Text To Speech',
        category: 'voice',
        status: typeof window !== 'undefined' && 'speechSynthesis' in window ? 'supported' : 'unsupported',
        platform: 'web',
        windowSystem: 'browser',
        dependencies: {},
        permission: 'not_required',
        fallback: 'text_only',
        privacy: 'user_controlled',
      },
      {
        id: 'tools.calculator',
        name: 'Safe Math Calculator',
        category: 'tools',
        status: 'supported',
        platform: 'web',
        windowSystem: 'browser',
        dependencies: {},
        permission: 'not_required',
        fallback: 'disabled',
        privacy: 'local_only',
      },
      {
        id: 'storage.sqlite',
        name: 'Offline SQLite Persistence',
        category: 'storage',
        status: 'partial',
        platform: 'web',
        windowSystem: 'browser',
        dependencies: {},
        permission: 'not_required',
        fallback: 'in_memory_storage',
        privacy: 'local_only',
        reason: 'Using localStorage fallback in web context',
      },
      {
        id: 'context.browser',
        name: 'Browser Page Context',
        category: 'context',
        status: 'disabled',
        platform: 'web',
        windowSystem: 'browser',
        dependencies: {},
        permission: 'requires_permission',
        fallback: 'disabled',
        privacy: 'requires_permission',
        reason: 'Disabled by default - Lulu does not track or inspect browser activity',
      },
    ];

    this.cachedCapabilities = fallbackList;
    return fallbackList;
  }

  /**
   * Retrieves single capability by ID
   */
  public static async getCapability(id: string): Promise<RuntimeCapability | null> {
    const list = await this.getCapabilities();
    return list.find((c) => c.id === id) || null;
  }

  /**
   * Evaluates deterministic effective state: Capability Availability + User Preference
   */
  public static computeEffectiveState(
    capability: RuntimeCapability,
    userEnabled: boolean
  ): EffectiveCapability {
    let effectiveState: EffectiveState = 'disabled';

    if (capability.status === 'unsupported') {
      effectiveState = 'unavailable';
    } else if (capability.status === 'requires_dependency') {
      effectiveState = 'requires_dependency';
    } else if (capability.status === 'requires_permission') {
      effectiveState = 'requires_permission';
    } else if (capability.status === 'disabled') {
      effectiveState = 'disabled';
    } else {
      // 'supported' or 'partial'
      effectiveState = userEnabled ? 'enabled' : 'disabled';
    }

    return {
      capability: capability.id,
      availability: capability.status,
      userEnabled,
      effectiveState,
      fallback: capability.fallback,
      reason: capability.reason,
    };
  }

  /**
   * Feature gating helper: returns true ONLY if feature is natively available AND user enabled
   */
  public static isFeatureUsable(
    capability: RuntimeCapability | null | undefined,
    userEnabled: boolean = true
  ): boolean {
    if (!capability) return false;
    const isAvailable = capability.status === 'supported' || capability.status === 'partial';
    return isAvailable && userEnabled;
  }

  /**
   * Fetches clean diagnostics report (guaranteed zero secrets or private data)
   */
  public static async getDiagnosticsReport(): Promise<CapabilityDiagnosticsReport | null> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        return await invoke<CapabilityDiagnosticsReport>('get_capability_diagnostics');
      } catch (e) {
        console.warn('[CapabilityService] get_capability_diagnostics failed:', e);
      }
    }

    const caps = await this.getCapabilities();
    return {
      application: 'Lulu',
      version: '0.1.0',
      os: 'web',
      architecture: 'browser',
      windowSystem: 'browser',
      desktopEnvironment: 'none',
      windowManager: 'none',
      dbusAvailable: false,
      mprisAvailable: false,
      notificationServiceAvailable: false,
      ollamaAvailable: false,
      ttsAvailable: typeof window !== 'undefined' && 'speechSynthesis' in window,
      sttAvailable: false,
      monitorCount: 1,
      capabilities: caps,
      timestamp: new Date().toISOString(),
    };
  }
}
