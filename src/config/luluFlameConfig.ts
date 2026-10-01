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
    framesCount: 1,
    fps: 1,
    comboWith: ['celebration_cheer', 'spotify_sing', 'ninja_salute'],
    description: 'High-velocity sprint with boundary bounce physics',
  },
  spotify_sing: {
    id: 'spotify_sing',
    name: 'Spotify Synced Live Singing',
    animation: 'sing',
    framesCount: 1,
    fps: 1,
    comboWith: ['spotify_dance', 'celebration_cheer', 'ninja_salute'],
    description: 'Lip-synced singing to active Spotify synchronized LRC lyrics',
  },
  spotify_dance: {
    id: 'spotify_dance',
    name: 'Music Dance',
    animation: 'dance',
    framesCount: 1,
    fps: 1,
    comboWith: ['spotify_sing', 'sprint_dash'],
    description: 'Rhythmic chakra dance during music instrumental sections',
  },
  celebration_cheer: {
    id: 'celebration_cheer',
    name: 'Joyful Flame Celebration',
    animation: 'happy',
    framesCount: 1,
    fps: 1,
    comboWith: ['sprint_dash', 'spotify_sing'],
    description: 'Smiling celebration following sprint victory or focus milestone',
  },
  susanoo_defense: {
    id: 'susanoo_defense',
    name: 'Susanoo Energy Shield',
    animation: 'protect',
    framesCount: 1,
    fps: 1,
    comboWith: ['ninja_salute', 'sprint_dash'],
    description: 'Chakra energy barrier protecting the workstation',
  },
  ninja_salute: {
    id: 'ninja_salute',
    name: 'Ninja Wave Salute',
    animation: 'wave',
    framesCount: 1,
    fps: 1,
    comboWith: ['susanoo_defense', 'celebration_cheer'],
    description: 'Affectionate comrade salute and greeting',
  },
  deep_contemplate: {
    id: 'deep_contemplate',
    name: 'Deep Concentration Mode',
    animation: 'sad',
    framesCount: 1,
    fps: 1,
    comboWith: ['desktop_patrol', 'sprint_dash'],
    description: 'Warrior mental focus and meditation',
  },
  desktop_patrol: {
    id: 'desktop_patrol',
    name: 'Desktop Perimeter Patrol',
    animation: 'walk-right',
    framesCount: 1,
    fps: 1,
    comboWith: ['sprint_dash', 'celebration_cheer'],
    description: 'Gentle walking patrol along the desktop dock',
  },
  peaceful_rest: {
    id: 'peaceful_rest',
    name: 'Peaceful Rest / Sleep',
    animation: 'sleep',
    framesCount: 1,
    fps: 1,
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
  imageKey: 'idle' | 'run' | 'happy' | 'sleep' | 'sing' | 'sad' | 'protect';
  reward: string;
  actionId: string;
  category: string;
}

export const LULU_TASKS: LuluTask[] = [
  {
    id: 'unlock_all_flames',
    title: 'Unlock All Flames & Abilities',
    description: 'Activate all 9 master flame animations, 17 shinobi katas, and combo synergies.',
    isCompleted: true,
    unlockedItems: Object.keys(LULU_FLAME_STYLES),
    imageKey: 'happy',
    reward: 'All 9 Master Flames & Abilities Unlocked',
    actionId: 'celebration_cheer',
    category: 'Mastery',
  },
  {
    id: 'continuous_sprint_master',
    title: 'SHOW RUN Infinite Sprint',
    description: 'Autonomous wall-to-wall sprint with Wayland boundary bounce physics.',
    isCompleted: true,
    unlockedItems: ['sprint_dash'],
    imageKey: 'run',
    reward: 'High-Speed Dust Trail & Aerodynamic Stride',
    actionId: 'sprint_dash',
    category: 'Movement',
  },
  {
    id: 'spotify_vocalist',
    title: 'Spotify Realtime Vocalist',
    description: 'Synchronize real-time singing and rhythmic sway with live Spotify lyrics.',
    isCompleted: true,
    unlockedItems: ['spotify_sing', 'spotify_dance'],
    imageKey: 'sing',
    reward: 'Live MPRIS Karaoke Lip-Sync',
    actionId: 'spotify_sing',
    category: 'Audio',
  },
  {
    id: 'peaceful_zen_sleep',
    title: 'Deep Zen Sleep & Recharge',
    description: 'Restful sleeping mode with floating zzz bubbles for full energy recovery.',
    isCompleted: true,
    unlockedItems: ['peaceful_rest'],
    imageKey: 'sleep',
    reward: 'Full Energy & Happiness Recovery',
    actionId: 'peaceful_rest',
    category: 'Vitals',
  },
  {
    id: 'susanoo_chakra_defense',
    title: 'Susanoo Energy Barrier',
    description: 'Summon the glowing polygonal chakra shield to defend the workstation.',
    isCompleted: true,
    unlockedItems: ['susanoo_defense'],
    imageKey: 'protect',
    reward: 'Protective Chakra Barrier',
    actionId: 'susanoo_defense',
    category: 'Combat',
  },
  {
    id: 'celebration_victory_cheer',
    title: 'Flame Victory Celebration',
    description: 'Joyful cheer with hands raised and celebratory confetti after focus milestones.',
    isCompleted: true,
    unlockedItems: ['celebration_cheer'],
    imageKey: 'happy',
    reward: 'Victory Confetti & Blushing Smile',
    actionId: 'celebration_cheer',
    category: 'Mood',
  },
  {
    id: 'desktop_perimeter_patrol',
    title: 'Desktop Perimeter Patrol',
    description: 'Gentle walking patrol along the desktop perimeter to ensure workstation safety.',
    isCompleted: true,
    unlockedItems: ['desktop_patrol'],
    imageKey: 'run',
    reward: 'Autonomous Perimeter Patrol',
    actionId: 'desktop_patrol',
    category: 'Movement',
  },
  {
    id: 'warrior_deep_focus',
    title: 'Deep Concentration Mode',
    description: 'Stationary ninja concentration with sharp Sharingan perception.',
    isCompleted: true,
    unlockedItems: ['deep_contemplate'],
    imageKey: 'protect',
    reward: '100% Deep Focus State',
    actionId: 'deep_contemplate',
    category: 'Focus',
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

