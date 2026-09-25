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

  it('computes 0..100 continuous MoodVariables for happiness, energy, curiosity, affection, boredom, stress', () => {
    const vars = MoodEngine.computeMoodVariables(DEFAULT_NEEDS, personality);
    expect(vars.happiness).toBeGreaterThanOrEqual(0);
    expect(vars.happiness).toBeLessThanOrEqual(100);
    expect(vars.energy).toBeGreaterThanOrEqual(0);
    expect(vars.energy).toBeLessThanOrEqual(100);
    expect(vars.curiosity).toBeGreaterThanOrEqual(0);
    expect(vars.curiosity).toBeLessThanOrEqual(100);
    expect(vars.affection).toBeGreaterThanOrEqual(0);
    expect(vars.affection).toBeLessThanOrEqual(100);
    expect(vars.boredom).toBeGreaterThanOrEqual(0);
    expect(vars.boredom).toBeLessThanOrEqual(100);
    expect(vars.stress).toBeGreaterThanOrEqual(0);
    expect(vars.stress).toBeLessThanOrEqual(100);
  });

  it('derives expression, animation, voice style, and conversation tone from mood variables', () => {
    const highStressVars = {
      happiness: 20,
      energy: 40,
      curiosity: 30,
      affection: 20,
      boredom: 30,
      stress: 85,
    };
    const guidance = MoodEngine.deriveMoodGuidance(highStressVars, personality);
    expect(guidance.primaryMood).toBe('worried');
    expect(guidance.recommendedAnimation).toBe('pout');
    expect(guidance.voiceStyle.pitchMod).toBeGreaterThan(1.0);
    expect(guidance.conversationTone).toContain('anxious');
  });
});
