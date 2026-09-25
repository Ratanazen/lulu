import { describe, it, expect, vi } from 'vitest';
import { MovementEngine } from '../src/movement/movementEngine';
import { MonitorInfo } from '../src/types';

describe('MovementEngine', () => {
  const mockMonitors: MonitorInfo[] = [
    {
      id: 'mon1',
      name: 'Primary Display',
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      scaleFactor: 1.0,
      primary: true,
      workAreaX: 0,
      workAreaY: 0,
      workAreaWidth: 1920,
      workAreaHeight: 1040,
    },
  ];

  it('initializes with default state at rest', () => {
    const engine = new MovementEngine();
    const state = engine.getState();
    expect(state.isMoving).toBe(false);
    expect(state.mode).toBe('idle');
    expect(state.velocity).toEqual({ x: 0, y: 0 });
  });

  it('initiates walk movement towards target', () => {
    const engine = new MovementEngine();
    engine.setMonitors(mockMonitors);
    engine.walkTo({ x: 500, y: 400 });

    const state = engine.getState();
    expect(state.isMoving).toBe(true);
    expect(state.mode).toBe('walk');
    expect(state.targetPosition).toEqual({ x: 500, y: 400 });
  });

  it('updates facing direction based on destination', () => {
    const engine = new MovementEngine();
    engine.setMonitors(mockMonitors);
    engine.setPositionDirect({ x: 300, y: 300 });

    engine.walkTo({ x: 100, y: 300 });
    expect(engine.getState().facing).toBe('left');

    engine.walkTo({ x: 600, y: 300 });
    expect(engine.getState().facing).toBe('right');
  });

  it('simulates physics step and arrives at target', () => {
    const engine = new MovementEngine({ walkSpeed: 1000, acceleration: 5000, deceleration: 5000 });
    engine.setMonitors(mockMonitors);
    engine.setPositionDirect({ x: 100, y: 100 });
    engine.walkTo({ x: 102, y: 100 });

    const now = performance.now();
    // Simulate tick with positive delta
    engine.tick(now + 50);
    engine.tick(now + 100);

    const state = engine.getState();
    expect(state.isMoving).toBe(false);
    expect(state.currentPosition.x).toBe(102);
  });

  it('perches on taskbar at the bottom work area', () => {
    const engine = new MovementEngine();
    engine.setMonitors(mockMonitors);
    engine.perchOnTaskbar();

    const state = engine.getState();
    expect(state.isMoving).toBe(true);
    expect(state.targetPosition).toBeDefined();
    // In mockMonitors, workAreaHeight is 1040, windowSize height is 260
    expect(state.targetPosition!.y).toBe(1040 - 260);
  });

  it('docks cleanly to display edges', () => {
    const engine = new MovementEngine();
    engine.setMonitors(mockMonitors);

    engine.dockToEdge('left');
    expect(engine.getState().targetPosition!.x).toBe(0);

    engine.dockToEdge('top');
    expect(engine.getState().targetPosition!.y).toBe(0);

    engine.dockToEdge('right');
    // 1920 - 240 window width = 1680
    expect(engine.getState().targetPosition!.x).toBe(1680);
  });

  it('dispatches to designated monitor in multi-monitor setups', () => {
    const multiMonitors: MonitorInfo[] = [
      ...mockMonitors,
      {
        id: 'mon2',
        name: 'Secondary Display',
        x: 1920,
        y: 0,
        width: 1920,
        height: 1080,
        scaleFactor: 1.0,
        primary: false,
        workAreaX: 1920,
        workAreaY: 0,
        workAreaWidth: 1920,
        workAreaHeight: 1040,
      },
    ];

    const engine = new MovementEngine();
    engine.setMonitors(multiMonitors);
    engine.sendToMonitor('mon2');

    const state = engine.getState();
    expect(state.isMoving).toBe(true);
    expect(state.mode).toBe('run');
    expect(state.targetPosition!.x).toBeGreaterThan(1920);
  });
});
