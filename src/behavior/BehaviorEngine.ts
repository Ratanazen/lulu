import { AnimationState, BehaviorMode, MoodType, PetNeeds } from '../types/pet';
import { MovementEngine } from '../movement/MovementEngine';

export interface LuluRoutine {
  id: string;
  animation: string;
  duration?: number;
  frames?: number;
  movement?: 'none' | 'left' | 'right' | 'wander';
  message?: string;
}

export const LULU_ROUTINE_POOL: LuluRoutine[] = [
  {
    id: 'flame-sprint-right',
    animation: 'run_sprint',
    frames: 40,
    movement: 'right',
    message: '40s flame check! Full victory dash!',
  },
  {
    id: 'flame-sprint-left',
    animation: 'run_sprint',
    frames: 40,
    movement: 'left',
    message: 'Acrobatic dash across the desktop!',
  },
  {
    id: 'happy-dance',
    animation: 'happy_dance',
    frames: 20,
    movement: 'none',
    message: 'Feeling fantastic! 20-frame flame dance! ✨',
  },
  {
    id: 'music-jam',
    animation: 'music_jam',
    frames: 20,
    movement: 'none',
    message: 'Vibing with the rhythm! Music dance session! 🎵🎧',
  },
  {
    id: 'protect-shield',
    animation: 'protect',
    frames: 5,
    movement: 'none',
    message: 'Susanoo shield active! Defending your workstation! 🛡️⚡',
  },
  {
    id: 'wave-salute',
    animation: 'wave',
    frames: 5,
    movement: 'none',
    message: "Ninja salute! Let's conquer the next goal! ⚡",
  },
  {
    id: 'sad-contemplate',
    animation: 'sad_contemplate',
    frames: 20,
    movement: 'none',
    message: 'Deep concentration mode... maintaining warrior focus! 🌧️⚔️',
  },
  {
    id: 'patrol-wander',
    animation: 'wander',
    frames: 5,
    movement: 'wander',
    message: 'Patrolling the desktop perimeter... all clear! 🐾',
  },
];

// Frame Priority Deterministic Order (Section 7)
export function resolveAnimationPriority(
  requestedAnimation: string,
  isRunning: boolean,
  isWalking: boolean,
  isDancing: boolean,
  isSleeping: boolean,
  isProtecting: boolean,
  isWaving: boolean,
  ambientMood?: MoodType,
  isSinging?: boolean
): string {
  if (isRunning) return 'run';
  if (isWalking) return 'walk';
  if (isSinging) return 'sing';
  if (isDancing) return 'dance';
  if (isSleeping) return 'sleep';
  if (isProtecting) return 'protect';
  if (isWaving) return 'wave';
  if (requestedAnimation && requestedAnimation !== 'idle') return requestedAnimation;
  if (ambientMood && (ambientMood === 'happy' || ambientMood === 'playful')) return 'happy';
  if (ambientMood && (ambientMood === 'sad' || ambientMood === 'tired')) return 'sad';
  return 'idle';
}

export interface BehaviorDecision {
  action: 'idle' | 'wander' | 'sleep' | 'wake' | 'happy_dance' | 'wave' | 'run_sprint' | 'protect' | 'sad_contemplate' | 'music_jam';
  animation: AnimationState;
  thought?: string;
}

export class BehaviorEngine {
  private lastActionTime: number = Date.now();
  private isAutonomousEnabled: boolean = true;
  private mode: BehaviorMode = 'NORMAL';

  public setMode(mode: BehaviorMode) {
    this.mode = mode;
  }

  public setAutonomous(enabled: boolean) {
    this.isAutonomousEnabled = enabled;
  }

  // Periodic Featured Random Event across all multi-frame styles ("1flam /40s")
  public getRandomFocusEvent(intervalSeconds: number = 40): BehaviorDecision {
    const label = intervalSeconds >= 60 ? `${Math.round(intervalSeconds / 60)}min` : `${intervalSeconds}s`;
    const pickedRoutine = LULU_ROUTINE_POOL[Math.floor(Math.random() * LULU_ROUTINE_POOL.length)];
    const animMap: Record<string, AnimationState> = {
      run_sprint: pickedRoutine.movement === 'left' ? 'run-left' : 'run-right',
      happy_dance: 'happy',
      music_jam: 'dance',
      protect: 'protect',
      wave: 'wave',
      sad_contemplate: 'sad',
      wander: 'walk-right',
    };

    return {
      action: pickedRoutine.animation as any,
      animation: animMap[pickedRoutine.animation] || 'idle',
      thought: pickedRoutine.message ? `${pickedRoutine.message} (${label})` : undefined,
    };
  }

  public evaluateNextStep(
    needs: PetNeeds,
    mood: MoodType,
    isSleeping: boolean,
    isMoving: boolean
  ): BehaviorDecision {
    if (!this.isAutonomousEnabled || this.mode === 'QUIET' || this.mode === 'FOCUSED') {
      return {
        action: 'idle',
        animation: isSleeping ? 'sleep' : 'idle',
      };
    }

    // If already moving, keep moving
    if (isMoving) {
      return {
        action: 'wander',
        animation: 'run-right',
      };
    }

    // Only sleep automatically if strictly in low energy and idle for long
    if (!isSleeping && needs.energy < 15 && this.mode === 'CALM') {
      return {
        action: 'sleep',
        animation: 'sleep',
        thought: 'Taking a peaceful rest... (Zzz) 🌙',
      };
    }

    // If sleeping but energy restored, wake up
    if (isSleeping && needs.energy >= 70) {
      return {
        action: 'wake',
        animation: 'wake',
        thought: 'Awake and ready for action! ⚡',
      };
    }

    // If currently sleeping, remain sleeping
    if (isSleeping) {
      return {
        action: 'sleep',
        animation: 'sleep',
      };
    }

    // Balanced Random Action Engine ("Redrom")
    const roll = Math.random();

    // 40% chance: 40-frame sprint or active wander
    if (roll < 0.40) {
      const isRun = Math.random() < 0.65;
      return {
        action: isRun ? 'run_sprint' : 'wander',
        animation: isRun ? 'run-right' : 'walk-right',
        thought: isRun ? 'Shinobi sprint dash! 💨' : 'Patrolling the desktop perimeter...',
      };
    }

    // 20% chance: Joyful celebration (20 frames)
    if (roll < 0.60) {
      return {
        action: 'happy_dance',
        animation: 'happy',
        thought: "Energy flowing! Feeling awesome today! ✨",
      };
    }

    // 15% chance: Wave / Kata
    if (roll < 0.75) {
      return {
        action: 'wave',
        animation: 'wave',
        thought: 'Sharp reflexes on duty! ⚡',
      };
    }

    // 25% chance: Calm idle observation
    return {
      action: 'idle',
      animation: 'idle',
    };
  }
}
