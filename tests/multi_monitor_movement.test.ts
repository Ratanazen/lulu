import { describe, it, expect, beforeEach } from 'vitest';
import { MovementEngine } from '../src/movement/MovementEngine';
import { NativeMonitorInfo } from '../src/types/pet';

describe('MovementEngine Multi-Monitor & Screen Wrapping (Phase 8)', () => {
  let engine: MovementEngine;

  const mockMonitors: NativeMonitorInfo[] = [
    {
      name: 'eDP-1',
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      scale_factor: 1.0,
      is_primary: true,
      work_area_x: 0,
      work_area_y: 0,
      work_area_width: 1920,
      work_area_height: 1080,
    },
    {
      name: 'HDMI-A-1',
      x: 1920,
      y: 0,
      width: 2560,
      height: 1440,
      scale_factor: 1.0,
      is_primary: false,
      work_area_x: 1920,
      work_area_y: 0,
      work_area_width: 2560,
      work_area_height: 1440,
    },
  ];

  beforeEach(() => {
    engine = new MovementEngine();
  });

  it('initializes with bounce physics mode by default', () => {
    expect(engine.getBoundaryPhysicsMode()).toBe('bounce');
    expect(engine.getState().boundaryPhysicsMode).toBe('bounce');
  });

  it('updates boundary physics mode between bounce, wrap, and roam_multi', () => {
    engine.setBoundaryPhysicsMode('wrap');
    expect(engine.getBoundaryPhysicsMode()).toBe('wrap');

    engine.setBoundaryPhysicsMode('roam_multi');
    expect(engine.getBoundaryPhysicsMode()).toBe('roam_multi');

    engine.setBoundaryPhysicsMode('bounce');
    expect(engine.getBoundaryPhysicsMode()).toBe('bounce');
  });

  it('correctly registers multiple monitors and sets active monitor', () => {
    engine.setMonitors(mockMonitors);
    expect(engine.getMonitors()).toHaveLength(2);
    expect(engine.getActiveMonitor()?.name).toBe('eDP-1');
  });

  it('accurately computes composite bounds across all connected displays', () => {
    engine.setMonitors(mockMonitors);
    const composite = engine.getCompositeBounds();

    expect(composite.minX).toBe(0);
    expect(composite.maxX).toBe(1920 + 2560); // 4480
    expect(composite.minY).toBe(0);
    expect(composite.maxY).toBe(1440);
    expect(composite.totalWidth).toBe(4480);
    expect(composite.totalHeight).toBe(1440);
  });

  it('calculates single-monitor effective bounds for bounce and wrap modes', () => {
    engine.setMonitors(mockMonitors);
    engine.setBoundaryPhysicsMode('bounce');

    const bounds = engine.getEffectiveBounds();
    // In single-monitor mode with activeMonitor eDP-1 (1920x1080)
    expect(bounds.minX).toBe(50); // edgePadding 50
    expect(bounds.maxX).toBe(1920 - 290 - 50); // 1580
    expect(bounds.minY).toBe(50);
    expect(bounds.maxY).toBe(1080 - 350 - 50); // 680
  });

  it('spans composite multi-screen virtual width in roam_multi mode', () => {
    engine.setMonitors(mockMonitors);
    engine.setBoundaryPhysicsMode('roam_multi');

    const bounds = engine.getEffectiveBounds();
    expect(bounds.minX).toBe(50);
    expect(bounds.maxX).toBe(4480 - 290 - 50); // 4140
    expect(bounds.maxY).toBe(1440 - 350 - 50); // 1040
  });

  it('handles jumping to external monitor output', async () => {
    engine.setMonitors(mockMonitors);
    const jumped = await engine.jumpToMonitor('HDMI-A-1');

    expect(jumped).toBe(true);
    expect(engine.getActiveMonitor()?.name).toBe('HDMI-A-1');

    const pos = engine.getPosition();
    // Center of HDMI-A-1: 1920 + Math.floor((2560 - 290) / 2) = 1920 + 1135 = 3055
    expect(pos.x).toBe(1920 + Math.floor((2560 - 290) / 2));
  });

  it('returns false when jumping to non-existent monitor', async () => {
    engine.setMonitors(mockMonitors);
    const jumped = await engine.jumpToMonitor('NON_EXISTENT_DISPLAY');
    expect(jumped).toBe(false);
  });

  it('allows registering onWrap callback listener', () => {
    let wrapFired = false;
    expect(() => {
      engine.setOnWrap(() => {
        wrapFired = true;
      });
    }).not.toThrow();
    expect(wrapFired).toBe(false);
  });
});
