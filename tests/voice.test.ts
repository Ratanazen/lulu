import { describe, it, expect, beforeEach } from 'vitest';
import { VoiceManager } from '../src/features/voice/VoiceManager';

describe('VoiceManager', () => {
  let voice: VoiceManager;

  beforeEach(() => {
    voice = new VoiceManager();
  });

  it('provides sensible voice defaults', () => {
    const settings = voice.getSettings();
    expect(settings.enabled).toBe(true);
    expect(settings.volume).toBeGreaterThan(0);
    expect(settings.pitch).toBeGreaterThan(0);
    expect(settings.rate).toBeGreaterThan(0);
  });

  it('updates voice settings properly', () => {
    voice.updateSettings({ volume: 0.9, autoSpeak: true });
    const settings = voice.getSettings();
    expect(settings.volume).toBe(0.9);
    expect(settings.autoSpeak).toBe(true);
  });

  it('safely handles voice speech call without crashing', async () => {
    // In headless jsdom, window.speechSynthesis may be absent or mocked
    await expect(voice.speak('Test speech')).resolves.not.toThrow();
  });

  it('reports initial voice state without errors', () => {
    const state = voice.getState();
    expect(state.isListening).toBe(false);
    expect(state.isSpeaking).toBe(false);
  });
});
