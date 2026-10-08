import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AudioReactiveEngine, AudioReactiveState } from '../src/features/audio/AudioReactiveEngine';

describe('AudioReactiveEngine & Frequency Visualizer', () => {
  let engine: AudioReactiveEngine;

  beforeEach(() => {
    engine = new AudioReactiveEngine();
  });

  afterEach(() => {
    engine.stopLoop();
  });

  it('1. initializes with safe defaults and zero energy when idle', () => {
    const state = engine.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.beatPulse).toBe(0);
    expect(state.audioEnergy).toBe(0);
    expect(state.bands16.length).toBe(16);
    expect(state.bands8.length).toBe(8);
    expect(state.bpm).toBe(120);
    expect(engine.getMode()).toBe('beat_bounce');
  });

  it('2. generates realistic beat pulses and 16 frequency bands during playback', () => {
    engine.updatePlayback(true, 500, 120);
    const frame = engine.computeFrame();

    expect(frame.isPlaying).toBe(true);
    expect(frame.beatPulse).toBeGreaterThanOrEqual(0);
    expect(frame.beatPulse).toBeLessThanOrEqual(1.0);
    expect(frame.audioEnergy).toBeGreaterThan(0);
    expect(frame.audioEnergy).toBeLessThanOrEqual(1.0);

    expect(frame.bands16.length).toBe(16);
    for (const val of frame.bands16) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1.0);
    }

    expect(frame.bands8.length).toBe(8);
    for (const val of frame.bands8) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1.0);
    }
  });

  it('3. downsamples 16 bands to 8 bands accurately', () => {
    engine.updatePlayback(true, 1000, 120);
    const frame = engine.computeFrame();

    for (let i = 0; i < 8; i++) {
      const expectedAvg = (frame.bands16[i * 2] + frame.bands16[i * 2 + 1]) / 2;
      expect(frame.bands8[i]).toBeCloseTo(expectedAvg, 5);
    }
  });

  it('4. attenuates energy and beat pulse in gentle_ambient mode', () => {
    engine.updatePlayback(true, 500, 120);
    engine.setMode('beat_bounce');
    const bouncyState = engine.computeFrame();

    engine.setMode('gentle_ambient');
    const gentleState = engine.computeFrame();

    expect(engine.getMode()).toBe('gentle_ambient');
    expect(gentleState.beatPulse).toBeLessThanOrEqual(bouncyState.beatPulse + 0.1);
  });

  it('5. completely zeroes frequency spectrum when mode is set to off', () => {
    engine.updatePlayback(true, 500, 120);
    engine.setMode('off');
    
    // Multiple decays to simulate drain
    for (let i = 0; i < 20; i++) {
      engine.computeFrame();
    }

    const state = engine.getState();
    expect(state.beatPulse).toBe(0);
    expect(state.audioEnergy).toBe(0);
    for (const val of state.bands16) {
      expect(val).toBe(0);
    }
  });

  it('6. scales spectrum with sensitivity multiplier while respecting [0..1] clamping', () => {
    engine.updatePlayback(true, 500, 120);
    engine.setSensitivity(2.0);
    expect(engine.getSensitivity()).toBe(2.0);

    const highState = engine.computeFrame();
    expect(highState.beatPulse).toBeLessThanOrEqual(1.0);
    expect(highState.audioEnergy).toBeLessThanOrEqual(1.0);
    for (const val of highState.bands16) {
      expect(val).toBeLessThanOrEqual(1.0);
    }
  });

  it('7. notifies listeners on computeFrame and cleans up subscription', () => {
    let callCount = 0;
    let lastState: AudioReactiveState | null = null;

    const unsubscribe = engine.subscribe((state) => {
      callCount++;
      lastState = state;
    });

    engine.updatePlayback(true, 200, 120);
    engine.computeFrame();

    expect(callCount).toBe(1);
    expect(lastState).not.toBeNull();
    expect((lastState as AudioReactiveState | null)?.isPlaying).toBe(true);

    unsubscribe();
    engine.computeFrame();
    expect(callCount).toBe(1); // Not called after unsubscribe
  });
});
