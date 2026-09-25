import { describe, it, expect, beforeEach } from 'vitest';
import { EmotionEngine } from '../src/features/emotion/emotionEngine';

describe('EmotionEngine', () => {
  let engine: EmotionEngine;

  beforeEach(() => {
    engine = new EmotionEngine();
  });

  it('starts with positive default baseline metrics', () => {
    const metrics = engine.getMetrics();
    expect(metrics.happiness).toBeGreaterThanOrEqual(70);
    expect(metrics.energy).toBeGreaterThanOrEqual(70);
    expect(engine.getCurrentEmotion()).toBe('happy');
  });

  it('increases happiness and friendship on pat', () => {
    const prev = engine.getMetrics().happiness;
    const newEmotion = engine.onUserPat();
    expect(engine.getMetrics().happiness).toBeGreaterThan(prev);
    expect(['happy', 'excited']).toContain(newEmotion);
  });

  it('triggers excited emotion on game win', () => {
    const emotion = engine.onGameWon();
    expect(emotion).toBe('excited');
    expect(engine.getSuggestedAnimation()).toBe('celebrate');
  });

  it('triggers confused emotion on error', () => {
    const emotion = engine.onError();
    expect(emotion).toBe('confused');
    expect(engine.getSuggestedAnimation()).toBe('confused');
  });

  it('decays energy on prolonged inactivity', () => {
    const prev = engine.getMetrics().energy;
    engine.onInactivityDecay();
    expect(engine.getMetrics().energy).toBeLessThan(prev);
  });

  it('maps emotions to valid animation states', () => {
    engine.onGameWon();
    expect(engine.getSuggestedAnimation()).toBe('celebrate');

    engine.onError();
    expect(engine.getSuggestedAnimation()).toBe('confused');
  });
});
