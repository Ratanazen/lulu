import { Achievement, UserProgression } from '../types';

export const INITIAL_ACHIEVEMENTS: Record<string, Achievement> = {
  first_launch: {
    id: 'first_launch',
    title: 'Hello Lulu!',
    description: 'Launched Lulu desktop companion for the first time.',
    icon: '✨',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  first_chat: {
    id: 'first_chat',
    title: 'Work Assistant',
    description: 'Chatted with Lulu using Gemini CLI for daily work.',
    icon: '💬',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  explorer: {
    id: 'explorer',
    title: 'Desktop Explorer',
    description: 'Allowed Lulu to wander or explore across monitors 5 times.',
    icon: '🧭',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  coding_companion: {
    id: 'coding_companion',
    title: 'Coding Companion',
    description: 'Paired with Lulu for daily coding and development tasks.',
    icon: '💻',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  friendly_visitor: {
    id: 'friendly_visitor',
    title: 'Friendly Bond',
    description: 'Interacted with Lulu 25 times.',
    icon: '💖',
    unlocked: false,
    progress: 0,
    maxProgress: 25,
  },
  caring_friend: {
    id: 'caring_friend',
    title: 'Caring Companion',
    description: 'Fed, groomed, or rested Lulu 10 times in Pet Care.',
    icon: '🌟',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  night_owl: {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Kept Lulu company late at night after 11 PM.',
    icon: '🌙',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
  early_bird: {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Started a productive morning with Lulu before 8 AM.',
    icon: '🌅',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
  },
};

export class ProgressionEngine {
  public static calculateLevel(xp: number): number {
    // Level formula: Level = Math.floor(Math.sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  public static getXpForNextLevel(currentLevel: number): number {
    return currentLevel * currentLevel * 100;
  }

  public static addXp(progression: UserProgression, amount: number): {
    updated: UserProgression;
    leveledUp: boolean;
  } {
    const oldLevel = progression.level;
    const newXp = progression.xp + amount;
    const newLevel = this.calculateLevel(newXp);
    const leveledUp = newLevel > oldLevel;

    return {
      updated: {
        ...progression,
        xp: newXp,
        level: newLevel,
        stars: leveledUp ? progression.stars + 5 : progression.stars,
      },
      leveledUp,
    };
  }

  public static updateAchievement(
    progression: UserProgression,
    id: string,
    delta: number = 1
  ): { updated: UserProgression; justUnlocked: boolean } {
    const ach = progression.achievements[id];
    if (!ach || ach.unlocked) {
      return { updated: progression, justUnlocked: false };
    }

    const nextProgress = Math.min(ach.maxProgress, ach.progress + delta);
    const justUnlocked = nextProgress >= ach.maxProgress;

    const updatedAch: Achievement = {
      ...ach,
      progress: nextProgress,
      unlocked: justUnlocked,
      unlockedAt: justUnlocked ? new Date().toISOString() : ach.unlockedAt,
    };

    let updatedProg: UserProgression = {
      ...progression,
      achievements: {
        ...progression.achievements,
        [id]: updatedAch,
      },
    };

    if (justUnlocked) {
      const { updated } = this.addXp(updatedProg, 150);
      updatedProg = updated;
    }

    return { updated: updatedProg, justUnlocked };
  }
}
