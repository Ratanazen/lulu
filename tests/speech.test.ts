import { describe, it, expect } from 'vitest';
import { SpeechSystem, SPEECH_POOLS } from '../src/interaction/speechSystem';
import { SpeechCategory } from '../src/types';

describe('SpeechSystem', () => {
  const allCategories: SpeechCategory[] = [
    'greeting',
    'idle',
    'success',
    'failure',
    'game',
    'music',
    'exploration',
    'encouragement',
    'sleep',
    'settings',
    'morning',
    'night',
    'study',
    'weather',
    'break',
  ];

  it('contains populated dialogue pools for all 15 categories', () => {
    for (const cat of allCategories) {
      expect(SPEECH_POOLS[cat]).toBeDefined();
      expect(SPEECH_POOLS[cat].length).toBeGreaterThanOrEqual(3);
    }
  });

  it('generates well-formed speech messages with expected category and duration', () => {
    const system = new SpeechSystem();
    const msg = system.getRandomMessage('morning', 'happy', 5000);

    expect(msg.category).toBe('morning');
    expect(msg.mood).toBe('happy');
    expect(msg.durationMs).toBe(5000);
    expect(msg.text.length).toBeGreaterThan(5);
    expect(msg.id).toContain('msg_');
  });

  it('suggests circadian speech categories based on time of day', () => {
    const system = new SpeechSystem();

    // Morning check (hour 7)
    const morningCategories = new Set<string>();
    for (let i = 0; i < 20; i++) {
      morningCategories.add(system.getSuggestedSpontaneousCategory(7));
    }
    expect(morningCategories.has('morning')).toBe(true);

    // Night check (hour 23)
    const nightCategories = new Set<string>();
    for (let i = 0; i < 20; i++) {
      nightCategories.add(system.getSuggestedSpontaneousCategory(23));
    }
    expect(nightCategories.has('night')).toBe(true);
  });
});
