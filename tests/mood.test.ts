import { describe, it, expect } from 'vitest';
import { MoodEngine } from '../src/behavior/moodEngine';
import { DEFAULT_NEEDS } from '../src/behavior/needsEngine';
import { LULU_DEFAULT_CHARACTER } from '../src/character';

describe('MoodEngine', () => {
  const personality = LULU_DEFAULT_CHARACTER.personality;

  it('evaluates calm/happy mood under balanced conditions', () => {
    const mood = MoodEngine.calculateMood(DEFAULT_NEEDS, personality);
    expect(['happy', 'curious', 'calm', 'playful']).toContain(mood);
  });

  it('detects sleepy mood when energy is critically depleted', () => {
    const lowEnergy = { ...DEFAULT_NEEDS, energy: 10 };
    const mood = MoodEngine.calculateMood(lowEnergy, personality);
    expect(mood).toBe('sleepy');
  });

  it('detects worried mood when hunger or cleanliness is critical', () => {
    const starving = { ...DEFAULT_NEEDS, hunger: 15 };
    const mood = MoodEngine.calculateMood(starving, personality);
    expect(mood).toBe('worried');
  });

  it('responds with excited mood after winning a game', () => {
    const mood = MoodEngine.calculateMood(DEFAULT_NEEDS, personality, 'GAME_WON');
    expect(mood).toBe('excited');
  });
});
