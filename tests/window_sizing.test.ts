import { describe, it, expect } from 'vitest';
import {
  DesktopWindowService,
  WINDOW_MODE_DIMENSIONS,
  WindowMode,
} from '../src/services/desktopWindow';

describe('Centralized Window Sizing System', () => {
  it('defines standard dimensions for all required window modes', () => {
    const modes: WindowMode[] = ['mascot', 'quick-actions', 'chat', 'onboarding', 'control-center'];

    for (const mode of modes) {
      const dim = WINDOW_MODE_DIMENSIONS[mode];
      expect(dim).toBeDefined();
      expect(dim.width).toBeGreaterThanOrEqual(200);
      expect(dim.height).toBeGreaterThanOrEqual(250);
      if (dim.minWidth) expect(dim.width).toBeGreaterThanOrEqual(dim.minWidth);
      if (dim.maxWidth) expect(dim.width).toBeLessThanOrEqual(dim.maxWidth);
      if (dim.minHeight) expect(dim.height).toBeGreaterThanOrEqual(dim.minHeight);
      if (dim.maxHeight) expect(dim.height).toBeLessThanOrEqual(dim.maxHeight);
    }
  });

  it('matches required specifications for window modes', () => {
    expect(WINDOW_MODE_DIMENSIONS['mascot'].width).toBe(260);
    expect(WINDOW_MODE_DIMENSIONS['mascot'].height).toBe(320);

    expect(WINDOW_MODE_DIMENSIONS['quick-actions'].width).toBe(360);
    expect(WINDOW_MODE_DIMENSIONS['quick-actions'].height).toBe(440);

    expect(WINDOW_MODE_DIMENSIONS['chat'].width).toBe(460);
    expect(WINDOW_MODE_DIMENSIONS['chat'].height).toBe(600);

    expect(WINDOW_MODE_DIMENSIONS['onboarding'].width).toBe(540);
    expect(WINDOW_MODE_DIMENSIONS['onboarding'].height).toBe(660);

    expect(WINDOW_MODE_DIMENSIONS['control-center'].width).toBe(960);
    expect(WINDOW_MODE_DIMENSIONS['control-center'].height).toBe(680);
  });

  it('tracks active mode and applies dimensions', async () => {
    await DesktopWindowService.setMode('chat');
    expect(DesktopWindowService.getMode()).toBe('chat');

    const sz = await DesktopWindowService.getSize();
    expect(sz.width).toBe(460);
    expect(sz.height).toBe(600);

    await DesktopWindowService.setMode('control-center');
    expect(DesktopWindowService.getMode()).toBe('control-center');

    const ccSz = await DesktopWindowService.getSize();
    expect(ccSz.width).toBe(960);
    expect(ccSz.height).toBe(680);

    await DesktopWindowService.setMode('mascot');
    expect(DesktopWindowService.getMode()).toBe('mascot');

    const mascotSz = await DesktopWindowService.getSize();
    expect(mascotSz.width).toBe(260);
    expect(mascotSz.height).toBe(320);
  });
});
