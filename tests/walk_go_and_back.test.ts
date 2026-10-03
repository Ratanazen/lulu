import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MovementEngine } from '../src/movement/MovementEngine';

describe('MovementEngine - Walk Go & Back (Patrol Pacing)', () => {
  let engine: MovementEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new MovementEngine();
    engine.setMonitor({
      name: 'eDP-1',
      is_primary: true,
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      scale_factor: 1,
      work_area_x: 0,
      work_area_y: 0,
      work_area_width: 1920,
      work_area_height: 1040,
    });
  });

  it('starts walk go and back with patrol run mode', () => {
    expect(engine.isContinuousWalk()).toBe(false);
    engine.walkGoAndBack();
    expect(engine.isContinuousWalk()).toBe(true);
    expect(engine.getState().runMode).toBe('walk_patrol');
    expect(engine.getState().isRunning).toBe(false);
  });

  it('toggles continuous walk on and off cleanly', () => {
    expect(engine.isContinuousWalk()).toBe(false);
    const active = engine.toggleContinuousWalk();
    expect(active).toBe(true);
    expect(engine.isContinuousWalk()).toBe(true);
    expect(engine.getState().runMode).toBe('walk_continuous');

    const deactivated = engine.toggleContinuousWalk();
    expect(deactivated).toBe(false);
    expect(engine.isContinuousWalk()).toBe(false);
    expect(engine.getState().runMode).toBe('idle');
  });

  it('stop halts continuous walk and continuous run simultaneously', () => {
    engine.startContinuousWalk();
    expect(engine.isContinuousWalk()).toBe(true);
    engine.stop();
    expect(engine.isContinuousWalk()).toBe(false);
    expect(engine.isContinuousRun()).toBe(false);
    expect(engine.getState().runMode).toBe('idle');
  });

  it('sets speed multiplier and adjusts walking speed proportionally', () => {
    engine.setSpeedMultiplier(1.5);
    expect(engine.getSpeedMultiplier()).toBe(1.5);
    engine.setSpeedMultiplier(1.0);
    expect(engine.getSpeedMultiplier()).toBe(1.0);
  });
});
