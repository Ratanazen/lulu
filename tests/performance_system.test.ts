import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePerformanceStore, DEFAULT_PERFORMANCE_CONFIG } from '../src/features/performance/performanceStore';
import { LrcParser } from '../src/features/lyrics/LrcParser';
import { MovementEngine } from '../src/movement/movementEngine';

describe('Performance System — Old Computer & Low-End Hardware Suite', () => {
  beforeEach(() => {
    usePerformanceStore.setState({
      mode: 'AUTO',
      tier: 'UNKNOWN',
      config: { ...DEFAULT_PERFORMANCE_CONFIG },
      runtime: {
        currentFps: 30,
        targetFps: 30,
        cpuUsage: 1.0,
        memoryRssMb: 80,
        mode: 'AUTO',
        tier: 'MEDIUM',
        animationQuality: 'NORMAL',
        rendererState: 'ACTIVE',
        dbusState: 'CONNECTED',
        mprisState: 'IDLE',
        lyricsState: 'ACTIVE',
        databaseWritesCount: 0,
        isPowerSaving: false,
        isAdaptiveDowngraded: false,
      },
    });
  });

  describe('Performance Mode Presets & Store', () => {
    it('initializes with AUTO mode and balanced fallback', () => {
      const state = usePerformanceStore.getState();
      expect(state.mode).toBe('AUTO');
      expect(state.config.performance.fps).toBe(30);
    });

    it('updates mode and configuration cleanly', async () => {
      const { setMode } = usePerformanceStore.getState();
      await setMode('POWER_SAVER');
      expect(usePerformanceStore.getState().mode).toBe('POWER_SAVER');
    });

    it('supports custom configuration edits and switches to CUSTOM mode', async () => {
      const { updatePerformanceSection } = usePerformanceStore.getState();
      await updatePerformanceSection({ fps: 20, shadows: false, blur: false });
      const current = usePerformanceStore.getState();
      expect(current.mode).toBe('CUSTOM');
      expect(current.config.performance.fps).toBe(20);
      expect(current.config.performance.shadows).toBe(false);
      expect(current.config.performance.blur).toBe(false);
    });

    it('resets configuration back to defaults', async () => {
      const { updatePerformanceSection, resetConfig } = usePerformanceStore.getState();
      await updatePerformanceSection({ fps: 15 });
      expect(usePerformanceStore.getState().config.performance.fps).toBe(15);

      await resetConfig();
      expect(usePerformanceStore.getState().mode).toBe('AUTO');
      expect(usePerformanceStore.getState().config.performance.fps).toBe(30);
    });

    it('updates adaptive renderer states (ACTIVE, IDLE, HIDDEN, BACKGROUND)', () => {
      const { setRendererState } = usePerformanceStore.getState();
      setRendererState('HIDDEN');
      expect(usePerformanceStore.getState().runtime.rendererState).toBe('HIDDEN');

      setRendererState('IDLE');
      expect(usePerformanceStore.getState().runtime.rendererState).toBe('IDLE');

      setRendererState('ACTIVE');
      expect(usePerformanceStore.getState().runtime.rendererState).toBe('ACTIVE');
    });
  });

  describe('Lyrics Binary Search Optimization', () => {
    const rawLrc = `
[00:00.00]First line
[00:05.00]Second line
[00:10.50]Third line
[00:20.00]Fourth line
[00:35.00]Fifth line
    `;

    const parsed = LrcParser.parse(rawLrc);

    it('correctly uses binary search to find exact and in-between timestamps in O(log N)', () => {
      expect(LrcParser.binarySearchIndex(parsed.lines, 0)).toBe(0);
      expect(LrcParser.binarySearchIndex(parsed.lines, 3000)).toBe(0);
      expect(LrcParser.binarySearchIndex(parsed.lines, 5000)).toBe(1);
      expect(LrcParser.binarySearchIndex(parsed.lines, 7500)).toBe(1);
      expect(LrcParser.binarySearchIndex(parsed.lines, 10500)).toBe(2);
      expect(LrcParser.binarySearchIndex(parsed.lines, 15000)).toBe(2);
      expect(LrcParser.binarySearchIndex(parsed.lines, 25000)).toBe(3);
      expect(LrcParser.binarySearchIndex(parsed.lines, 40000)).toBe(4);
    });

    it('returns -1 for timestamps before the first lyric', () => {
      expect(LrcParser.binarySearchIndex(parsed.lines, -500)).toBe(-1);
    });

    it('getLyricAtTime returns active and next lyrics seamlessly', () => {
      const res = LrcParser.getLyricAtTime(parsed.lines, 6000);
      expect(res.current?.text).toBe('Second line');
      expect(res.next?.text).toBe('Third line');
      expect(res.index).toBe(1);
    });
  });

  describe('Movement Engine Tick Pacing & Zero-Idle CPU', () => {
    it('stops tick loop when pet stops or is idle', () => {
      const engine = new MovementEngine();
      engine.walkTo({ x: 300, y: 300 });
      expect(engine.getState().isMoving).toBe(true);

      engine.stop();
      expect(engine.getState().isMoving).toBe(false);
      expect(engine.getState().targetPosition).toBeNull();
    });

    it('allows configuring movement tick frequency (e.g. 150ms for low-spec mode)', () => {
      const engine = new MovementEngine();
      engine.setMovementTickMs(150);
      expect(engine.getMovementTickMs()).toBe(150);

      engine.setMovementTickMs(25);
      expect(engine.getMovementTickMs()).toBe(25);
    });
  });
});
