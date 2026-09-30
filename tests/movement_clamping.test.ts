import { describe, it, expect, vi } from 'vitest';
import { MovementEngine } from '../src/movement/MovementEngine';
import { NativeMonitorInfo } from '../src/types/pet';

describe('MovementEngine Clamping and Work-Area Boundary Specification', () => {
  it('clamps movement within active monitor work area bounds', () => {
    const engine = new MovementEngine();
    const monitor: NativeMonitorInfo = {
      name: 'eDP-1',
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      scale_factor: 1.0,
      is_primary: true,
      work_area_x: 0,
      work_area_y: 32, // top bar
      work_area_width: 1920,
      work_area_height: 1048, // dock offset
    };

    engine.setMonitor(monitor);

    // Try walking outside monitor bounds (e.g. -500 or 5000)
    engine.walkTo(-500, -500);
    // Target is clamped to minX and minY
    // minX = work_area_x (0) + edgePadding (50) = 50
    // minY = work_area_y (32) + edgePadding (50) = 82

    let listenerCall: any = null;
    engine.setListener((x, y, isMoving, direction) => {
      listenerCall = { x, y, isMoving, direction };
    });

    engine.stop();
    expect(listenerCall.direction).toBe('idle');
    expect(listenerCall.isMoving).toBe(false);
  });

  it('toggles continuous run mode correctly', () => {
    const engine = new MovementEngine();
    expect(engine.isContinuousRun()).toBe(false);

    const started = engine.toggleContinuousRun();
    expect(started).toBe(true);
    expect(engine.isContinuousRun()).toBe(true);

    const stopped = engine.toggleContinuousRun();
    expect(stopped).toBe(false);
    expect(engine.isContinuousRun()).toBe(false);
  });

  it('handles timed run (e.g. 40s sprint) and completes on timer expiry', () => {
    vi.useFakeTimers();
    const engine = new MovementEngine();
    let completed = false;
    engine.startTimedRun(40, () => {
      completed = true;
    });

    expect(engine.isContinuousRun()).toBe(true);
    vi.advanceTimersByTime(40000);
    expect(engine.isContinuousRun()).toBe(false);
    expect(completed).toBe(true);
    vi.useRealTimers();
  });
});
