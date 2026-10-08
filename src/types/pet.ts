export type AnimationState =
  | 'idle'
  | 'walk-left'
  | 'walk-right'
  | 'run-left'
  | 'run-right'
  | 'jump'
  | 'sit'
  | 'sleep'
  | 'wake'
  | 'happy'
  | 'angry'
  | 'surprised'
  | 'dance'
  | 'sing'
  | 'think'
  | 'talk'
  | 'wave'
  | 'protect'
  | 'sad';

export type MoodType = 'calm' | 'happy' | 'curious' | 'tired' | 'playful' | 'sad';

export type BehaviorMode =
  | 'OFF'
  | 'CALM'
  | 'NORMAL'
  | 'ACTIVE'
  | 'PLAYFUL'
  | 'FOCUSED'
  | 'QUIET'
  | 'SYSTEM_SYNC';

export interface SystemTelemetry {
  // CPU Telemetry
  cpuPercent: number;
  cpuCores?: number;
  cpuPhysicalCores?: number;
  cpuModel?: string;
  cpuVendor?: string;
  cpuFreqMhz?: number;

  // Memory & Swap Telemetry
  memUsedMb: number;
  memTotalMb: number;
  memPercent: number;
  memAvailableMb?: number;
  swapUsedMb?: number;
  swapTotalMb?: number;
  swapPercent?: number;

  // GPU Telemetry
  gpuName?: string;
  gpuVendor?: string;
  gpuRenderer?: string;
  gpuIsDiscrete?: boolean;
  gpuVramMb?: number | null;
  gpuDriver?: string;
  gpuStatus?: string;

  // Storage Telemetry
  diskRootUsedGb?: number;
  diskRootTotalGb?: number;
  diskRootAvailGb?: number;
  diskRootPercent?: number;
  diskRootFs?: string;

  // Power & Battery Telemetry
  batteryPercent?: number;
  isCharging?: boolean;
  powerSource?: string;
  powerStatus?: string;
  autoPowerSave?: boolean;

  // Environment & Session Telemetry
  osName?: string;
  kernelVersion?: string;
  compositor?: string;
  sessionType?: string;
  desktopEnv?: string;
  profile?: string;
  isLowSpec?: boolean;
}

export interface PersonalityTraits {
  curiosity: number;   // 0 - 100
  friendliness: number;
  playfulness: number;
  calmness: number;
  energy: number;
  focus: number;
  social: number;
}

export interface CharacterProfile {
  id: string;
  displayName: string;
  description: string;
  personality: PersonalityTraits;
  scale: number;
  defaultPosition: { x: number; y: number };
}

export interface PetNeeds {
  energy: number;     // 0 - 100
  happiness: number;  // 0 - 100
  fun: number;        // 0 - 100
}

export interface PetState {
  needs: PetNeeds;
  mood: MoodType;
  animation: AnimationState;
  isSleeping: boolean;
  isMoving: boolean;
  homePosition: { x: number; y: number };
  lastInteractionTs: number;
}

export interface NativeMonitorInfo {
  name: string;
  x: i32;
  y: i32;
  width: number;
  height: number;
  scale_factor: number;
  is_primary: boolean;
  work_area_x: number;
  work_area_y: number;
  work_area_width: number;
  work_area_height: number;
}

type i32 = number;

export type CharacterStyle = 'shadow_shinobi' | 'anime_chibi' | 'celestial_kitsune';

export type PerformanceProfileType = 'Auto' | 'PowerSaver' | 'Balanced' | 'High' | 'Low';

export interface PetPreferences {
  scale: number;
  theme: string;
  character_style?: CharacterStyle;
  behavior_mode: BehaviorMode;
  wander_speed: number;
  speech_enabled: boolean;
  show_text?: boolean;
  lyrics_mode?: 'auto_lyrics' | 'normal_text';
  speed_multiplier?: number;
  sound_volume: number;
  always_on_top: boolean;
  fps_limit: number;
  performance_profile?: PerformanceProfileType;
  telemetry_interval_ms?: number;
  low_spec_mode?: boolean;
}

export interface SpeechMessage {
  id: string;
  text: string;
  mood: MoodType;
  durationMs: number;
}
