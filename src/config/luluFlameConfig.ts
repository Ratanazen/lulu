import { AnimationState } from '../types/pet';

export interface LuluFlameStyle {
  id: string;
  name: string;
  animation: AnimationState;
  framesCount: number;
  fps: number;
  comboWith: string[];
  description: string;
}

export const LULU_FLAME_STYLES: Record<string, LuluFlameStyle> = {
  sprint_dash: {
    id: 'sprint_dash',
    name: 'High-Speed Sprint',
    animation: 'run-right',
    framesCount: 6,
    fps: 12,
    comboWith: ['celebration_cheer', 'spotify_sing', 'ninja_salute'],
    description: 'High-velocity sprint with boundary bounce physics',
  },
  spotify_sing: {
    id: 'spotify_sing',
    name: 'Spotify Synced Live Singing',
    animation: 'sing',
    framesCount: 6,
    fps: 5,
    comboWith: ['spotify_dance', 'celebration_cheer', 'ninja_salute'],
    description: 'Lip-synced singing to active Spotify synchronized LRC lyrics',
  },
  spotify_dance: {
    id: 'spotify_dance',
    name: 'Music Dance',
    animation: 'dance',
    framesCount: 6,
    fps: 6,
    comboWith: ['spotify_sing', 'sprint_dash'],
    description: 'Rhythmic chakra dance during music instrumental sections',
  },
  celebration_cheer: {
    id: 'celebration_cheer',
    name: 'Joyful Flame Celebration',
    animation: 'happy',
    framesCount: 6,
    fps: 5,
    comboWith: ['sprint_dash', 'spotify_sing'],
    description: 'Smiling celebration following sprint victory or focus milestone',
  },
  susanoo_defense: {
    id: 'susanoo_defense',
    name: 'Susanoo Energy Shield',
    animation: 'protect',
    framesCount: 6,
    fps: 4,
    comboWith: ['ninja_salute', 'sprint_dash'],
    description: 'Chakra energy barrier protecting the workstation',
  },
  ninja_salute: {
    id: 'ninja_salute',
    name: 'Ninja Wave Salute',
    animation: 'wave',
    framesCount: 6,
    fps: 4,
    comboWith: ['susanoo_defense', 'celebration_cheer'],
    description: 'Affectionate comrade salute and greeting',
  },
  deep_contemplate: {
    id: 'deep_contemplate',
    name: 'Deep Concentration Mode',
    animation: 'sad',
    framesCount: 6,
    fps: 4,
    comboWith: ['desktop_patrol', 'sprint_dash'],
    description: 'Warrior mental focus and meditation',
  },
  desktop_patrol: {
    id: 'desktop_patrol',
    name: 'Desktop Perimeter Patrol',
    animation: 'walk-right',
    framesCount: 6,
    fps: 4,
    comboWith: ['sprint_dash', 'celebration_cheer'],
    description: 'Gentle walking patrol along the desktop dock',
  },
  peaceful_rest: {
    id: 'peaceful_rest',
    name: 'Peaceful Rest / Sleep',
    animation: 'sleep',
    framesCount: 20,
    fps: 3,
    comboWith: ['celebration_cheer'],
    description: 'Energy recharging sleep cycle',
  },
};

export const DEFAULT_FLAME_SPEED_MULTIPLIER = 1.0; // Normal, balanced, and smooth cadence

export const FLAME_SPEED_PRESETS = {
  slow: { id: 'slow', label: '🐢 Relaxed (Slow)', multiplier: 0.75 },
  normal: { id: 'normal', label: '✨ Normal & Smooth', multiplier: 1.0 },
  turbo: { id: 'turbo', label: '⚡ Fast', multiplier: 1.25 },
} as const;

export function getEffectiveFps(baseFps: number, multiplier: number = DEFAULT_FLAME_SPEED_MULTIPLIER): number {
  return Math.max(1, Math.round(baseFps * multiplier * 10) / 10);
}

export function getEffectiveFrameIntervalMs(baseFps: number, multiplier: number = DEFAULT_FLAME_SPEED_MULTIPLIER): number {
  const fps = getEffectiveFps(baseFps, multiplier);
  return Math.round(1000 / fps);
}

/**
 * Tasks & Progression System: "in add tatk for unlock all"
 */
export interface LuluTask {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  unlockedItems: string[];
}

export const LULU_TASKS: LuluTask[] = [
  {
    id: 'unlock_all_flames',
    title: 'Unlock All Flames & Abilities',
    description: 'Activate all 9 master flame animations, 17 shinobi katas, and combo synergies.',
    isCompleted: true,
    unlockedItems: Object.keys(LULU_FLAME_STYLES),
  },
  {
    id: 'spotify_vocalist',
    title: 'Spotify Realtime Vocalist',
    description: 'Synchronize 20-frame singing lip-sync with live Spotify lyrics.',
    isCompleted: true,
    unlockedItems: ['spotify_sing', 'spotify_dance'],
  },
  {
    id: 'continuous_sprint_master',
    title: 'SHOW RUN Infinite Sprint',
    description: 'Autonomous wall-to-wall sprint with Wayland boundary bounce.',
    isCompleted: true,
    unlockedItems: ['sprint_dash'],
  },
];

/**
 * Returns a valid combo partner style that seamlessly follows the current action.
 */
export function getFlameCombo(currentStyleId: string): LuluFlameStyle {
  const current = LULU_FLAME_STYLES[currentStyleId];
  if (!current || !current.comboWith.length) {
    return LULU_FLAME_STYLES.celebration_cheer;
  }
  const nextId = current.comboWith[Math.floor(Math.random() * current.comboWith.length)];
  return LULU_FLAME_STYLES[nextId] || LULU_FLAME_STYLES.celebration_cheer;
}

/**
 * Validates whether two flame styles have an authentic combo synergy.
 */
export function isValidFlameCombo(styleA: string, styleB: string): boolean {
  const style = LULU_FLAME_STYLES[styleA];
  if (!style) return false;
  return style.comboWith.includes(styleB);
}

