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
    name: '40-Frame High-Speed Sprint',
    animation: 'run-right',
    framesCount: 40,
    fps: 25, // 40ms/frame
    comboWith: ['celebration_cheer', 'spotify_sing', 'ninja_salute'],
    description: 'High-velocity 40-frame sprint with boundary bounce physics',
  },
  spotify_sing: {
    id: 'spotify_sing',
    name: 'Spotify Synced Live Singing',
    animation: 'sing',
    framesCount: 20,
    fps: 10,
    comboWith: ['spotify_dance', 'celebration_cheer', 'ninja_salute'],
    description: 'Lip-synced singing to active Spotify synchronized LRC lyrics',
  },
  spotify_dance: {
    id: 'spotify_dance',
    name: '20-Frame Music Dance',
    animation: 'dance',
    framesCount: 20,
    fps: 10,
    comboWith: ['spotify_sing', 'sprint_dash'],
    description: 'Rhythmic chakra dance during music instrumental sections',
  },
  celebration_cheer: {
    id: 'celebration_cheer',
    name: 'Joyful Flame Celebration',
    animation: 'happy',
    framesCount: 20,
    fps: 8,
    comboWith: ['sprint_dash', 'spotify_sing'],
    description: 'Smiling celebration following sprint victory or focus milestone',
  },
  susanoo_defense: {
    id: 'susanoo_defense',
    name: 'Susanoo Energy Shield',
    animation: 'protect',
    framesCount: 5,
    fps: 5,
    comboWith: ['ninja_salute', 'sprint_dash'],
    description: 'Chakra energy barrier protecting the workstation',
  },
  ninja_salute: {
    id: 'ninja_salute',
    name: 'Ninja Wave Salute',
    animation: 'wave',
    framesCount: 5,
    fps: 5,
    comboWith: ['susanoo_defense', 'celebration_cheer'],
    description: 'Affectionate comrade salute and greeting',
  },
  deep_contemplate: {
    id: 'deep_contemplate',
    name: 'Deep Concentration Mode',
    animation: 'sad',
    framesCount: 20,
    fps: 5,
    comboWith: ['desktop_patrol', 'sprint_dash'],
    description: 'Warrior mental focus and meditation',
  },
  desktop_patrol: {
    id: 'desktop_patrol',
    name: 'Desktop Perimeter Patrol',
    animation: 'walk-right',
    framesCount: 5,
    fps: 6,
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
