import { create } from 'zustand';

export type PerformanceMode = 'AUTO' | 'POWER_SAVER' | 'LOW' | 'BALANCED' | 'HIGH' | 'CUSTOM';
export type PerformanceTier = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
export type AnimationQuality = 'NONE' | 'MINIMAL' | 'SIMPLE' | 'NORMAL' | 'FULL';

export interface PerformanceConfig {
  performance: {
    mode: string;
    fps: number;
    animations: boolean;
    shadows: boolean;
    blur: boolean;
    glow: boolean;
    particles: boolean;
    background_effects: boolean;
    power_saving: boolean;
  };
  pet: {
    walking: boolean;
    walking_speed: number;
    idle_animation: boolean;
    music_animation: boolean;
    movement_tick_ms: number;
  };
  notifications: {
    enabled: boolean;
    animation: string;
  };
  system: {
    monitoring: boolean;
    monitoring_interval: number;
  };
  music: {
    mpris: boolean;
    position_poll_interval: number;
  };
  developer: {
    debug_logging: boolean;
    performance_overlay: boolean;
  };
}

export interface RuntimePerformance {
  currentFps: number;
  targetFps: number;
  cpuUsage: number;
  memoryRssMb: number;
  mode: string;
  tier: string;
  animationQuality: string;
  rendererState: 'ACTIVE' | 'IDLE' | 'HIDDEN' | 'BACKGROUND';
  dbusState: string;
  mprisState: string;
  lyricsState: string;
  databaseWritesCount: number;
  isPowerSaving: boolean;
  isAdaptiveDowngraded: boolean;
  cpuTempCelsius: number | null;
  thermalState: string; // "COOL", "NORMAL", "WARM", "HOT", "UNKNOWN"
}

export interface HardwareInfo {
  cpu: {
    vendor: string;
    model: string;
    physicalCores: number;
    logicalCores: number;
    frequencyMhz: number;
    performanceTier: PerformanceTier;
  };
  ram: {
    totalMb: number;
    availableMb: number;
    swapTotalMb: number;
    swapUsedMb: number;
  };
  gpu: {
    vendor: string;
    model: string;
    driver: string;
    isDiscrete: boolean;
    vramTotalMb: number;
  };
  display: {
    monitorCount: number;
    resolution: string;
    refreshRateHz: number;
  };
  os: {
    distro: string;
    kernel: string;
    sessionType: string;
  };
  desktop: {
    desktopEnvironment: string;
    windowManager: string;
  };
  power: {
    acOnline: boolean;
    hasBattery: boolean;
    batteryPercentage: number | null;
    batteryState: string | null;
  };
  thermal?: {
    cpuTempCelsius: number | null;
    thermalState: string;
    isThermalThrottling: boolean;
  };
  overallTier: PerformanceTier;
}

export interface PowerState {
  acOnline: boolean;
  hasBattery: boolean;
  batteryPercentage: number | null;
  batteryState: string | null;
  isPowerSavingActive: boolean;
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  performance: {
    mode: 'auto',
    fps: 30,
    animations: true,
    shadows: false,
    blur: false,
    glow: true,
    particles: true,
    background_effects: true,
    power_saving: true,
  },
  pet: {
    walking: true,
    walking_speed: 1.0,
    idle_animation: true,
    music_animation: true,
    movement_tick_ms: 60,
  },
  notifications: {
    enabled: true,
    animation: 'normal',
  },
  system: {
    monitoring: true,
    monitoring_interval: 3000,
  },
  music: {
    mpris: true,
    position_poll_interval: 350,
  },
  developer: {
    debug_logging: false,
    performance_overlay: false,
  },
};

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

interface PerformanceStoreState {
  mode: PerformanceMode;
  tier: PerformanceTier;
  config: PerformanceConfig;
  runtime: RuntimePerformance;
  hardware: HardwareInfo | null;
  power: PowerState;
  isInitialized: boolean;

  // Actions
  init: () => Promise<void>;
  setMode: (mode: PerformanceMode) => Promise<void>;
  updateConfig: (patch: Partial<PerformanceConfig>, newMode?: PerformanceMode) => Promise<void>;
  updatePerformanceSection: (patch: Partial<PerformanceConfig['performance']>) => Promise<void>;
  updatePetSection: (patch: Partial<PerformanceConfig['pet']>) => Promise<void>;
  updateSystemSection: (patch: Partial<PerformanceConfig['system']>) => Promise<void>;
  updateMusicSection: (patch: Partial<PerformanceConfig['music']>) => Promise<void>;
  updateDeveloperSection: (patch: Partial<PerformanceConfig['developer']>) => Promise<void>;
  resetConfig: () => Promise<void>;
  refreshHardware: () => Promise<void>;
  refreshRuntime: () => Promise<void>;
  setRendererState: (state: 'ACTIVE' | 'IDLE' | 'HIDDEN' | 'BACKGROUND') => void;
  applyCoolAndSilent: () => Promise<void>;
}

export const usePerformanceStore = create<PerformanceStoreState>((set, get) => ({
  mode: 'AUTO',
  tier: 'UNKNOWN',
  config: { ...DEFAULT_PERFORMANCE_CONFIG },
  runtime: {
    currentFps: 30,
    targetFps: 30,
    cpuUsage: 1.2,
    memoryRssMb: 85,
    mode: 'AUTO',
    tier: 'UNKNOWN',
    animationQuality: 'NORMAL',
    rendererState: 'ACTIVE',
    dbusState: 'CONNECTED',
    mprisState: 'IDLE',
    lyricsState: 'ACTIVE',
    databaseWritesCount: 0,
    isPowerSaving: false,
    isAdaptiveDowngraded: false,
    cpuTempCelsius: null,
    thermalState: 'NORMAL',
  },
  hardware: null,
  power: {
    acOnline: true,
    hasBattery: false,
    batteryPercentage: null,
    batteryState: null,
    isPowerSavingActive: false,
  },
  isInitialized: false,

  init: async () => {
    if (get().isInitialized) return;

    const invoke = await getInvoke();
    if (!invoke) {
      set({ isInitialized: true });
      return;
    }

    try {
      const [hw, cfg, pwr, rt] = await Promise.all([
        invoke<HardwareInfo>('get_hardware_info').catch(() => null),
        invoke<PerformanceConfig>('get_performance_config').catch(() => DEFAULT_PERFORMANCE_CONFIG),
        invoke<PowerState>('get_power_state').catch(() => ({
          acOnline: true,
          hasBattery: false,
          batteryPercentage: null,
          batteryState: null,
          isPowerSavingActive: false,
        })),
        invoke<RuntimePerformance>('get_runtime_performance').catch(() => null),
      ]);

      const mode = (cfg.performance.mode.toUpperCase() as PerformanceMode) || 'AUTO';
      const tier = hw ? hw.overallTier : 'UNKNOWN';

      set({
        hardware: hw,
        config: cfg,
        mode,
        tier,
        power: pwr,
        runtime: rt ? { ...get().runtime, ...rt } : get().runtime,
        isInitialized: true,
      });

      // Listen for backend events
      try {
        const { listen } = await import('@tauri-apps/api/event');
        listen<PerformanceConfig>('performance:profile_changed', (event) => {
          set({ config: event.payload });
        });
        listen<string>('performance:mode_changed', (event) => {
          set({ mode: event.payload.toUpperCase() as PerformanceMode });
        });
      } catch {
        // Ignored in non-tauri test environments
      }
    } catch (e) {
      console.warn('[PerformanceStore] Init error:', e);
      set({ isInitialized: true });
    }
  },

  setMode: async (mode: PerformanceMode) => {
    set({ mode });
    const invoke = await getInvoke();
    if (!invoke) return;

    try {
      const modeStr = mode.toLowerCase();
      const updated = await invoke<PerformanceConfig>('apply_performance_profile', { mode: modeStr });
      set({ config: updated });
    } catch (e) {
      console.warn('[PerformanceStore] apply_performance_profile failed:', e);
    }
  },

  updateConfig: async (patch: Partial<PerformanceConfig>, newMode?: PerformanceMode) => {
    const current = get().config;
    const merged: PerformanceConfig = {
      ...current,
      ...patch,
      performance: { ...current.performance, ...patch.performance },
      pet: { ...current.pet, ...patch.pet },
      notifications: { ...current.notifications, ...patch.notifications },
      system: { ...current.system, ...patch.system },
      music: { ...current.music, ...patch.music },
      developer: { ...current.developer, ...patch.developer },
    };

    const targetMode = newMode ?? (patch.performance?.mode ? (patch.performance.mode.toUpperCase() as PerformanceMode) : 'CUSTOM');
    set({ config: merged, mode: targetMode });
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('set_performance_config', { config: merged });
      } catch (e) {
        console.warn('[PerformanceStore] set_performance_config failed:', e);
      }
    }
  },

  updatePerformanceSection: async (patch) => {
    const current = get().config;
    await get().updateConfig({
      performance: { ...current.performance, ...patch, mode: 'custom' },
    });
  },

  updatePetSection: async (patch) => {
    const current = get().config;
    await get().updateConfig({
      pet: { ...current.pet, ...patch },
    });
  },

  updateSystemSection: async (patch) => {
    const current = get().config;
    await get().updateConfig({
      system: { ...current.system, ...patch },
    });
  },

  updateMusicSection: async (patch) => {
    const current = get().config;
    await get().updateConfig({
      music: { ...current.music, ...patch },
    });
  },

  updateDeveloperSection: async (patch) => {
    const current = get().config;
    await get().updateConfig({
      developer: { ...current.developer, ...patch },
    });
  },

  resetConfig: async () => {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        const defaultCfg = await invoke<PerformanceConfig>('reset_performance_config');
        set({ config: defaultCfg, mode: 'AUTO' });
        return;
      } catch (e) {
        console.warn('[PerformanceStore] reset_performance_config failed:', e);
      }
    }
    set({ config: { ...DEFAULT_PERFORMANCE_CONFIG }, mode: 'AUTO' });
  },

  refreshHardware: async () => {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        const hw = await invoke<HardwareInfo>('get_hardware_info');
        set({ hardware: hw, tier: hw.overallTier });
      } catch (e) {
        console.warn('[PerformanceStore] refreshHardware failed:', e);
      }
    }
  },

  refreshRuntime: async () => {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        const rt = await invoke<RuntimePerformance>('get_runtime_performance');
        set((state) => ({ runtime: { ...state.runtime, ...rt } }));
      } catch (e) {
        console.warn('[PerformanceStore] refreshRuntime failed:', e);
      }
    }
  },

  setRendererState: (rendererState) => {
    set((state) => ({
      runtime: { ...state.runtime, rendererState },
    }));
  },

  applyCoolAndSilent: async () => {
    await get().setMode('POWER_SAVER');
    await get().updateConfig({
      performance: {
        ...get().config.performance,
        fps: 20,
        glow: false,
        blur: false,
        particles: false,
        background_effects: false,
        power_saving: true,
        mode: 'power_saver',
      },
      pet: {
        ...get().config.pet,
        movement_tick_ms: 100,
      },
      system: {
        ...get().config.system,
        monitoring_interval: 6000,
      },
    }, 'POWER_SAVER');
  },
}));
