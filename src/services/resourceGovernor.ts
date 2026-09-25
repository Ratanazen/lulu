import { StorageService } from './storageService';

export type PerformancePreset = 'low' | 'balanced' | 'performance' | 'custom';

export interface ResourceGovernorSettings {
  preset: PerformancePreset;
  targetFps: number;
  cpuFriendlyMode: boolean;
  throttleBackgroundPolling: boolean;
  maxMemoryCacheMb: number;
  autoThrottleEnabled: boolean;
}

export interface ResourceGovernorState {
  currentEffectiveFps: number;
  isThrottled: boolean;
  throttleReason: string | null;
  lastCpuCheck: number;
  lastMemoryCheck: number;
}

export const DEFAULT_GOVERNOR_SETTINGS: ResourceGovernorSettings = {
  preset: 'balanced',
  targetFps: 60,
  cpuFriendlyMode: false,
  throttleBackgroundPolling: false,
  maxMemoryCacheMb: 128,
  autoThrottleEnabled: true,
};

export class ResourceGovernor {
  private settings: ResourceGovernorSettings = { ...DEFAULT_GOVERNOR_SETTINGS };
  private state: ResourceGovernorState = {
    currentEffectiveFps: 60,
    isThrottled: false,
    throttleReason: null,
    lastCpuCheck: 0,
    lastMemoryCheck: 0,
  };

  private listeners = new Set<(state: ResourceGovernorState) => void>();

  constructor() {
    this.loadSettings();
  }

  public async loadSettings(): Promise<void> {
    const saved = await StorageService.get<ResourceGovernorSettings>(
      'lulu_resource_governor',
      DEFAULT_GOVERNOR_SETTINGS
    );
    if (saved) {
      this.settings = { ...DEFAULT_GOVERNOR_SETTINGS, ...saved };
      this.applyPreset(this.settings.preset);
    }
  }

  public async updateSettings(partial: Partial<ResourceGovernorSettings>): Promise<void> {
    this.settings = { ...this.settings, ...partial };
    if (partial.preset && partial.preset !== 'custom') {
      this.applyPreset(partial.preset);
    }
    await StorageService.set('lulu_resource_governor', this.settings);
    this.notify();
  }

  public applyPreset(preset: PerformancePreset): void {
    this.settings.preset = preset;
    switch (preset) {
      case 'low':
        this.settings.targetFps = 24;
        this.settings.cpuFriendlyMode = true;
        this.settings.throttleBackgroundPolling = true;
        this.settings.maxMemoryCacheMb = 64;
        break;
      case 'balanced':
        this.settings.targetFps = 60;
        this.settings.cpuFriendlyMode = false;
        this.settings.throttleBackgroundPolling = false;
        this.settings.maxMemoryCacheMb = 128;
        break;
      case 'performance':
        this.settings.targetFps = 120;
        this.settings.cpuFriendlyMode = false;
        this.settings.throttleBackgroundPolling = false;
        this.settings.maxMemoryCacheMb = 256;
        break;
      case 'custom':
        // Keep current custom numbers
        break;
    }
    this.state.currentEffectiveFps = this.settings.targetFps;
  }

  /**
   * Evaluates real-time telemetry and triggers automatic CPU/RAM safety throttling
   */
  public evaluateMetrics(cpuUsage: number, memoryPct: number): void {
    this.state.lastCpuCheck = cpuUsage;
    this.state.lastMemoryCheck = memoryPct;

    if (!this.settings.autoThrottleEnabled) {
      this.state.isThrottled = false;
      this.state.throttleReason = null;
      this.state.currentEffectiveFps = this.settings.targetFps;
      this.notify();
      return;
    }

    // High CPU Safety Throttle (>80%)
    if (cpuUsage > 80.0) {
      this.state.isThrottled = true;
      this.state.throttleReason = `Host CPU elevated (${cpuUsage.toFixed(1)}%). Lowering companion render rate to 15 FPS.`;
      this.state.currentEffectiveFps = 15;
    }
    // High RAM Safety Cache Flush (>85%)
    else if (memoryPct > 85.0) {
      this.state.isThrottled = true;
      this.state.throttleReason = `Host Memory elevated (${memoryPct.toFixed(1)}%). Flushed in-memory caches.`;
      this.state.currentEffectiveFps = Math.min(30, this.settings.targetFps);
    }
    // Stabilized
    else if (cpuUsage < 65.0 && memoryPct < 75.0 && this.state.isThrottled) {
      this.state.isThrottled = false;
      this.state.throttleReason = null;
      this.state.currentEffectiveFps = this.settings.targetFps;
    } else if (!this.state.isThrottled) {
      this.state.currentEffectiveFps = this.settings.targetFps;
    }

    this.notify();
  }

  public getSettings(): ResourceGovernorSettings {
    return { ...this.settings };
  }

  public getState(): ResourceGovernorState {
    return { ...this.state };
  }

  public subscribe(cb: (state: ResourceGovernorState) => void): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((l) => {
      l(this.getState());
    });
  }
}

export const resourceGovernor = new ResourceGovernor();
