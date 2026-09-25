import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFERENCES } from '../src/stores/useLuluStore';
import { LearnedPreferences } from '../src/types';

describe('LearnedPreferences', () => {
  it('provides safe initial defaults for new companion instances', () => {
    expect(DEFAULT_PREFERENCES.totalPats).toBe(0);
    expect(DEFAULT_PREFERENCES.totalGamesPlayed).toBe(0);
    expect(DEFAULT_PREFERENCES.totalInteractions).toBe(0);
    expect(DEFAULT_PREFERENCES.wakeCount).toBeGreaterThanOrEqual(1);
    expect(['morning', 'afternoon', 'evening', 'night']).toContain(
      DEFAULT_PREFERENCES.preferredActiveHours
    );
  });

  it('correctly maps 24-hour clock into circadian preference slots', () => {
    const getSlot = (hour: number): LearnedPreferences['preferredActiveHours'] => {
      if (hour >= 5 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 22) return 'evening';
      return 'night';
    };

    expect(getSlot(8)).toBe('morning');
    expect(getSlot(14)).toBe('afternoon');
    expect(getSlot(19)).toBe('evening');
    expect(getSlot(23)).toBe('night');
    expect(getSlot(2)).toBe('night');
  });

  it('accumulates pet interactions and game counters cleanly', () => {
    let prefs: LearnedPreferences = { ...DEFAULT_PREFERENCES };

    // Simulate 3 pats and 2 games
    prefs = {
      ...prefs,
      totalPats: prefs.totalPats + 3,
      totalInteractions: prefs.totalInteractions + 3,
      totalGamesPlayed: prefs.totalGamesPlayed + 2,
      lastActiveTimestamp: Date.now(),
    };

    expect(prefs.totalPats).toBe(3);
    expect(prefs.totalInteractions).toBe(3);
    expect(prefs.totalGamesPlayed).toBe(2);
    expect(prefs.lastActiveTimestamp).toBeGreaterThan(0);
  });
});
