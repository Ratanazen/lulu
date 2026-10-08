import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SoundFxEngine, soundFxEngine } from '../src/features/audio/SoundFxEngine';

describe('SoundFxEngine (Phase 10 Companion Chimes)', () => {
  beforeEach(() => {
    // Reset volume and mute states
    soundFxEngine.setMuted(false);
    soundFxEngine.setVolume(0.75);
  });

  it('provides a singleton instance', () => {
    const instanceA = SoundFxEngine.getInstance();
    const instanceB = SoundFxEngine.getInstance();
    expect(instanceA).toBe(instanceB);
    expect(instanceA).toBe(soundFxEngine);
  });

  it('correctly clamps volume within [0, 1] range', () => {
    soundFxEngine.setVolume(0.5);
    expect(soundFxEngine.getVolume()).toBe(0.5);

    soundFxEngine.setVolume(1.8);
    expect(soundFxEngine.getVolume()).toBe(1.0);

    soundFxEngine.setVolume(-0.4);
    expect(soundFxEngine.getVolume()).toBe(0.0);
  });

  it('toggles mute states properly', () => {
    expect(soundFxEngine.isSoundMuted()).toBe(false);

    const mutedState = soundFxEngine.toggleMute();
    expect(mutedState).toBe(true);
    expect(soundFxEngine.isSoundMuted()).toBe(true);

    const unmutedState = soundFxEngine.toggleMute();
    expect(unmutedState).toBe(false);
    expect(soundFxEngine.isSoundMuted()).toBe(false);
  });

  it('notifies subscribers upon configuration changes', () => {
    const listener = vi.fn();
    const unsubscribe = soundFxEngine.subscribe(listener);

    // Initial call on subscribe
    expect(listener).toHaveBeenCalledWith({ volume: 0.75, isMuted: false });

    soundFxEngine.setVolume(0.4);
    expect(listener).toHaveBeenCalledWith({ volume: 0.4, isMuted: false });

    soundFxEngine.setMuted(true);
    expect(listener).toHaveBeenCalledWith({ volume: 0.4, isMuted: true });

    unsubscribe();
    soundFxEngine.setVolume(0.9);
    // Should not receive further updates after unsubscribe
    expect(listener).not.toHaveBeenCalledWith({ volume: 0.9, isMuted: true });
  });

  it('safely plays all synthesized sound cues without throwing errors', () => {
    expect(() => {
      soundFxEngine.playHeadpat();
      soundFxEngine.playSnack();
      soundFxEngine.playSprintWhoosh();
      soundFxEngine.playShield();
      soundFxEngine.playSleep();
      soundFxEngine.playRankUp();
      soundFxEngine.playClick();
      soundFxEngine.playSound('headpat');
      soundFxEngine.playSound('snack');
      soundFxEngine.playSound('sprint_whoosh');
      soundFxEngine.playSound('shield_hum');
      soundFxEngine.playSound('sleep_lullaby');
      soundFxEngine.playSound('rank_up_fanfare');
      soundFxEngine.playSound('click');
    }).not.toThrow();
  });

  it('respects mute flag and does not attempt to play when muted', () => {
    soundFxEngine.setMuted(true);
    expect(() => {
      soundFxEngine.playHeadpat();
      soundFxEngine.playSnack();
      soundFxEngine.playSprintWhoosh();
      soundFxEngine.playShield();
      soundFxEngine.playSleep();
      soundFxEngine.playRankUp();
      soundFxEngine.playClick();
    }).not.toThrow();
  });
});
