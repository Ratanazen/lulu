import { describe, it, expect } from 'vitest';
import { INITIAL_ACHIEVEMENTS, ProgressionEngine } from '../src/progression';
import { UserProgression } from '../src/types';

describe('ProgressionEngine', () => {
  const initialProgression: UserProgression = {
    xp: 0,
    level: 1,
    stars: 10,
    achievements: { ...INITIAL_ACHIEVEMENTS },
    lastDailyGreeting: null,
    lastDailyCare: null,
  };

  it('calculates levels dynamically based on XP', () => {
    expect(ProgressionEngine.calculateLevel(0)).toBe(1);
    expect(ProgressionEngine.calculateLevel(100)).toBe(2);
    expect(ProgressionEngine.calculateLevel(400)).toBe(3);
    expect(ProgressionEngine.calculateLevel(900)).toBe(4);
  });

  it('adds XP and triggers level-up stars', () => {
    const { updated, leveledUp } = ProgressionEngine.addXp(initialProgression, 150);
    expect(updated.xp).toBe(150);
    expect(updated.level).toBe(2);
    expect(leveledUp).toBe(true);
    expect(updated.stars).toBe(15);
  });

  it('tracks achievement progress and unlocks at threshold', () => {
    const { updated, justUnlocked } = ProgressionEngine.updateAchievement(
      initialProgression,
      'first_launch',
      1
    );
    expect(justUnlocked).toBe(true);
    expect(updated.achievements['first_launch'].unlocked).toBe(true);
  });
});
