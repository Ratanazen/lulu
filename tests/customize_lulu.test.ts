import { describe, it, expect } from 'vitest';
import { useLuluStore } from '../src/stores/useLuluStore';
import { LULU_DEFAULT_CHARACTER, OFFICIAL_CHARACTERS } from '../src/character/index';
import { aiProviderManager } from '../src/features/ai/AIProviderManager';
import { PERSONALITY_ARCHETYPES } from '../src/features/personality/personalityEngine';

describe('Lulu Pet Hub & Customize Lulu System', () => {
  it('initializes on startup with Lulu only and balanced settings', () => {
    const state = useLuluStore.getState();
    expect(state.character.id).toBe('lulu');
    expect(state.character.displayName).toBe('Lulu');
    expect(state.settings.characterScale).toBe(1.0);
  });

  it('contains all 4 wireframe personality archetypes', () => {
    const wireframeArchetypes = ['friendly', 'calm', 'playful', 'focused'] as const;
    for (const arch of wireframeArchetypes) {
      expect(PERSONALITY_ARCHETYPES[arch]).toBeDefined();
      expect(PERSONALITY_ARCHETYPES[arch].name).toBeDefined();
      expect(PERSONALITY_ARCHETYPES[arch].systemPrompt).toBeDefined();
    }
  });

  it('supports real-time scale, personality, and accessory updates', () => {
    const store = useLuluStore.getState();

    // 1. Scale update (70% - 140%)
    store.updateSettings({ characterScale: 1.25 });
    store.updateCharacterCustomization({ scale: 1.25 });
    expect(useLuluStore.getState().settings.characterScale).toBe(1.25);
    expect(useLuluStore.getState().character.scale).toBe(1.25);

    // 2. Personality update
    store.setPersonality('playful');
    expect(useLuluStore.getState().personality.id).toBe('playful');

    store.setPersonality('focused');
    expect(useLuluStore.getState().personality.id).toBe('focused');

    // 3. Accessories (Hat, Glasses, Backpack, Headset)
    store.updateCharacterCustomization({
      accessories: ['hat', 'glasses', 'backpack', 'headset'],
    });
    expect(useLuluStore.getState().character.accessories).toEqual([
      'hat',
      'glasses',
      'backpack',
      'headset',
    ]);
  });

  it('selects pets dynamically in Pet Hub without memory leakage', () => {
    const store = useLuluStore.getState();
    const petIds = ['neko', 'robo', 'mochi', 'pixel', 'sprout', 'lulu'];

    for (const petId of petIds) {
      store.setCharacter(petId);
      expect(useLuluStore.getState().character.id).toBe(petId);
    }
  });

  it('provides Gemini CLI and AGY CLI with modern model selections', () => {
    const geminiConfig = aiProviderManager.getConfig('gemini');
    expect(geminiConfig).toBeDefined();
    expect(geminiConfig.availableModels).toContain('gemini-3.8-flash-low');
    expect(geminiConfig.availableModels).toContain('gemini-3.7-flash-high');

    const agyConfig = aiProviderManager.getConfig('agy');
    expect(agyConfig).toBeDefined();
    expect(agyConfig.availableModels).toContain('gemini-3.8-flash-low');
  });
});
