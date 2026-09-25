import { describe, it, expect } from 'vitest';
import { BehaviorEngine } from '../src/behavior/behaviorEngine';
import { DEFAULT_NEEDS } from '../src/behavior/needsEngine';
import { LULU_DEFAULT_CHARACTER } from '../src/character';

describe('BehaviorEngine', () => {
  const personality = LULU_DEFAULT_CHARACTER.personality;

  it('selects valid action in normal mode', () => {
    const engine = new BehaviorEngine();
    const action = engine.evaluateNextAction(DEFAULT_NEEDS, personality, 'calm', 'NORMAL');
    expect([
      'idle',
      'explore',
      'rest',
      'react',
      'play',
      'returnHome',
      'yawn',
      'read',
      'meditate',
    ]).toContain(action);
  });

  it('prioritizes sleep when companion energy is low', () => {
    const engine = new BehaviorEngine();
    const exhaustedNeeds = { ...DEFAULT_NEEDS, energy: 10 };
    const action = engine.evaluateNextAction(exhaustedNeeds, personality, 'sleepy', 'NORMAL');
    expect(action).toBe('sleep');
  });

  it('respects QUIET mode by dampening active actions', () => {
    const engine = new BehaviorEngine();
    const action = engine.evaluateNextAction(DEFAULT_NEEDS, personality, 'calm', 'QUIET');
    expect(['idle', 'rest', 'sleep', 'meditate']).toContain(action);
  });

  it('supports yawn behavior when sleepy or moderately tired', () => {
    const engine = new BehaviorEngine();
    const tiredNeeds = { ...DEFAULT_NEEDS, energy: 38 };
    const action = engine.evaluateNextAction(tiredNeeds, personality, 'sleepy', 'NORMAL');
    expect(['sleep', 'yawn', 'rest']).toContain(action);
  });

  it('favors focus or read behavior in FOCUSED mode', () => {
    const engine = new BehaviorEngine();
    const action = engine.evaluateNextAction(DEFAULT_NEEDS, personality, 'focused', 'FOCUSED');
    expect(['focus', 'read', 'rest']).toContain(action);
  });
});
