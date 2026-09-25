// Daily Streak Tracking & Rewards Engine for Lulu Desktop
import { StorageService } from '../services/storageService';

export interface StreakState {
  currentStreak: number;
  maxStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalDaysActive: number;
}

export interface StreakUpdateResult {
  currentStreak: number;
  maxStreak: number;
  isNewDay: boolean;
  bonusXp: number;
  milestoneReached: string | null;
}

const DEFAULT_STREAK: StreakState = {
  currentStreak: 1,
  maxStreak: 1,
  lastActiveDate: '',
  totalDaysActive: 1,
};

export class StreakTracker {
  private static STORAGE_KEY = 'lulu_streak_state';

  private static getTodayDateString(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private static getDayDifference(dateStr1: string, dateStr2: string): number {
    if (!dateStr1 || !dateStr2) return 999;
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  public static async checkAndUpdateStreak(): Promise<StreakUpdateResult> {
    const today = this.getTodayDateString();
    const saved = await StorageService.get<StreakState>(this.STORAGE_KEY, DEFAULT_STREAK);

    if (!saved.lastActiveDate) {
      // First run ever
      const newState: StreakState = {
        currentStreak: 1,
        maxStreak: 1,
        lastActiveDate: today,
        totalDaysActive: 1,
      };
      await StorageService.set(this.STORAGE_KEY, newState);
      return {
        currentStreak: 1,
        maxStreak: 1,
        isNewDay: true,
        bonusXp: 15,
        milestoneReached: 'Welcome to Lulu! Day 1 Streak Started ✨',
      };
    }

    if (saved.lastActiveDate === today) {
      // Already active today
      return {
        currentStreak: saved.currentStreak,
        maxStreak: saved.maxStreak,
        isNewDay: false,
        bonusXp: 0,
        milestoneReached: null,
      };
    }

    const dayDiff = this.getDayDifference(saved.lastActiveDate, today);

    let newStreak = saved.currentStreak;
    let bonusXp = 0;
    let milestone: string | null = null;

    if (dayDiff === 1) {
      // Consecutive day!
      newStreak += 1;
      bonusXp = 10 + Math.min(newStreak * 2, 50);

      if (newStreak === 3) {
        milestone = '🔥 3-Day Focus Streak!';
        bonusXp += 25;
      } else if (newStreak === 7) {
        milestone = '🌟 1-Week Companion Streak! (+50 XP)';
        bonusXp += 50;
      } else if (newStreak === 14) {
        milestone = '⚡ 2-Week Dev Streak! (+100 XP)';
        bonusXp += 100;
      } else if (newStreak === 30) {
        milestone = '👑 1-Month Celestial Master Streak! (+250 XP)';
        bonusXp += 250;
      }
    } else {
      // Streak broken
      newStreak = 1;
      bonusXp = 5;
    }

    const maxStreak = Math.max(saved.maxStreak, newStreak);
    const newState: StreakState = {
      currentStreak: newStreak,
      maxStreak,
      lastActiveDate: today,
      totalDaysActive: saved.totalDaysActive + 1,
    };

    await StorageService.set(this.STORAGE_KEY, newState);

    return {
      currentStreak: newStreak,
      maxStreak,
      isNewDay: true,
      bonusXp,
      milestoneReached: milestone,
    };
  }

  public static async getStreakState(): Promise<StreakState> {
    return await StorageService.get<StreakState>(this.STORAGE_KEY, DEFAULT_STREAK);
  }
}
