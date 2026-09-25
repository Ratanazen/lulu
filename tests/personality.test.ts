import { describe, it, expect, beforeEach } from 'vitest';
import { PersonalityEngine, PERSONALITY_ARCHETYPES } from '../src/features/personality/personalityEngine';
import { PersonalityArchetype } from '../src/features/personality/types';

describe('PersonalityEngine', () => {
  let engine: PersonalityEngine;

  beforeEach(() => {
    engine = new PersonalityEngine();
  });

  it('contains all 10 standard archetypes', () => {
    const expected = [
      'friendly',
      'cute',
      'professional',
      'funny',
      'calm',
      'energetic',
      'study_buddy',
      'coding_buddy',
      'minimal',
      'custom',
    ];
    for (const id of expected) {
      expect(PERSONALITY_ARCHETYPES[id as PersonalityArchetype]).toBeDefined();
    }
  });

  it('switches active archetype properly', () => {
    expect(engine.getActiveArchetype()).toBe('friendly');
    engine.setActiveArchetype('coding_buddy');
    expect(engine.getActiveArchetype()).toBe('coding_buddy');
    expect(engine.getProfile().name).toContain('Senior Dev');
  });

  it('assembles complete system prompt with emotional state and memory context', () => {
    engine.setActiveArchetype('cute');
    const prompt = engine.assembleSystemPrompt(
      '\n- [FACT] Loves cats',
      'excited'
    );

    expect(prompt).toContain('Lulu, an ultra-cute tiny desktop companion');
    expect(prompt).toContain('[CURRENT EMOTIONAL STATE]: Lulu is currently feeling excited');
    expect(prompt).toContain('Loves cats');
  });

  it('supports custom persona prompt', () => {
    engine.setActiveArchetype('custom');
    engine.setCustomPrompt('You are a pirate AI companion. Say Ahoy!');
    expect(engine.getProfile().systemPrompt).toBe('You are a pirate AI companion. Say Ahoy!');
  });
});
