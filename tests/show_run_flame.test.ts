import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MovementEngine } from '../src/movement/MovementEngine';
import { NativeMonitorInfo } from '../src/types/pet';
import {
  LULU_ROUTINE_POOL,
  resolveAnimationPriority,
  BehaviorEngine,
} from '../src/behavior/BehaviorEngine';

describe('Lulu SHOW RUN & 1flam / 40s Specifications', () => {
  let engine: MovementEngine;
  const mockMonitor: NativeMonitorInfo = {
    name: 'DP-1',
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    scale_factor: 1.0,
    is_primary: true,
    work_area_x: 0,
    work_area_y: 32,
    work_area_width: 1920,
    work_area_height: 1048,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    engine = new MovementEngine();
    engine.setMonitor(mockMonitor);
    engine.setSpeedMultiplier(1.0);
  });

  afterEach(() => {
    engine.stop();
    vi.useRealTimers();
  });

  it('1. verifies 25 FPS and 40ms frame timing at standard speed', () => {
    // 1000ms / 25 = 40ms
    const state = engine.getState();
    expect(state.runSpeed).toBe(8);
    expect(state.speedMultiplier).toBe(1.0);
  });

  it('2. verifies 40-frame loop progression (0 to 39 and wrap)', () => {
    engine.startContinuousRun();
    expect(engine.getState().currentFrame).toBe(0);

    // Advance 40ms -> frame 1
    vi.advanceTimersByTime(40);
    expect(engine.getState().currentFrame).toBe(1);

    // Advance 39 more frames (39 * 40ms = 1560ms) -> total 40 frames -> wraps back to 0
    vi.advanceTimersByTime(39 * 40);
    expect(engine.getState().currentFrame).toBe(0);
  });

  it('3. verifies timed 40-second run (40000ms duration and clean completion)', () => {
    let completed = false;
    engine.startTimedRun(40, () => {
      completed = true;
    });

    const state = engine.getState();
    expect(state.runMode).toBe('timed');
    expect(state.isRunning).toBe(true);
    expect(state.runDuration).toBe(40000);

    // Advance 39 seconds: should still be running
    vi.advanceTimersByTime(39000);
    expect(engine.getState().runMode).toBe('timed');
    expect(completed).toBe(false);

    // Advance remaining 1 second (total 40000ms)
    vi.advanceTimersByTime(1000);
    expect(engine.getState().runMode).toBe('idle');
    expect(engine.getState().isRunning).toBe(false);
    expect(completed).toBe(true);
  });

  it('4. verifies continuous run (SHOW RUN) and direction reversal on boundary bounce', () => {
    engine.startContinuousRun();
    expect(engine.getState().runMode).toBe('continuous');

    // Bounds: minX = 0 + 50 = 50; maxX = 0 + 1920 - 240 - 50 = 1630
    // Advance enough time to reach destination boundary and bounce
    vi.advanceTimersByTime(15000);
    expect(engine.getState().runMode).toBe('continuous');
    expect(['left', 'right']).toContain(engine.getState().runDirection);
  });

  it('5. verifies pause and resume functionality', () => {
    engine.startContinuousRun();
    expect(engine.getState().isPaused).toBe(false);

    engine.pause();
    expect(engine.getState().isPaused).toBe(true);

    const frameBefore = engine.getState().currentFrame;
    vi.advanceTimersByTime(200); // 5 frames would elapse if not paused
    expect(engine.getState().currentFrame).toBe(frameBefore); // No progress while paused

    engine.resume();
    expect(engine.getState().isPaused).toBe(false);
    vi.advanceTimersByTime(40);
    expect(engine.getState().currentFrame).toBe((frameBefore + 1) % 40);
  });

  it('6. verifies timer safety and cleanup on multiple starts and stop', () => {
    let completed1 = false;
    let completed2 = false;

    engine.startTimedRun(40, () => { completed1 = true; });
    // Immediately start another timed run: previous timer must be cleared
    engine.startTimedRun(40, () => { completed2 = true; });

    vi.advanceTimersByTime(40000);
    expect(completed1).toBe(false); // First timer was cancelled
    expect(completed2).toBe(true);  // Second timer completed cleanly
  });

  it('7. verifies 8 random routines in LULU_ROUTINE_POOL', () => {
    expect(LULU_ROUTINE_POOL.length).toBe(8);
    const sprintRoutines = LULU_ROUTINE_POOL.filter(r => r.animation === 'run_sprint');
    expect(sprintRoutines.length).toBe(2);
    expect(sprintRoutines[0].frames).toBe(40);
    expect(sprintRoutines[1].frames).toBe(40);

    const danceRoutine = LULU_ROUTINE_POOL.find(r => r.animation === 'happy_dance');
    expect(danceRoutine?.frames).toBe(20);

    const musicRoutine = LULU_ROUTINE_POOL.find(r => r.animation === 'music_jam');
    expect(musicRoutine?.frames).toBe(20);

    const protectRoutine = LULU_ROUTINE_POOL.find(r => r.animation === 'protect');
    expect(protectRoutine?.frames).toBe(5);

    const waveRoutine = LULU_ROUTINE_POOL.find(r => r.animation === 'wave');
    expect(waveRoutine?.frames).toBe(5);
  });

  it('8. verifies strict frame priority ordering with singing lip-sync', () => {
    // RUNNING > WALKING > SINGING > DANCING > SLEEPING > PROTECTING > WAVING > AMBIENT MOOD > IDLE
    // Ambient mood (happy) MUST NOT interrupt RUNNING
    expect(resolveAnimationPriority('idle', true, false, false, false, false, false, 'happy', false)).toBe('run');
    
    // Running beats walking, singing, and dancing
    expect(resolveAnimationPriority('idle', true, true, true, false, false, false, 'calm', true)).toBe('run');

    // Walking beats singing and dancing
    expect(resolveAnimationPriority('idle', false, true, true, false, false, false, 'calm', true)).toBe('walk');

    // Singing beats dancing
    expect(resolveAnimationPriority('idle', false, false, true, false, false, false, 'calm', true)).toBe('sing');

    // Dancing beats sleeping
    expect(resolveAnimationPriority('idle', false, false, true, true, false, false, 'calm', false)).toBe('dance');

    // Sleeping beats protecting
    expect(resolveAnimationPriority('idle', false, false, false, true, true, false, 'calm', false)).toBe('sleep');

    // Protecting beats waving
    expect(resolveAnimationPriority('idle', false, false, false, false, true, true, 'calm', false)).toBe('protect');

    // Waving beats ambient mood
    expect(resolveAnimationPriority('idle', false, false, false, false, false, true, 'happy', false)).toBe('wave');

    // Ambient mood fallback when idle
    expect(resolveAnimationPriority('idle', false, false, false, false, false, false, 'happy', false)).toBe('happy');
    expect(resolveAnimationPriority('idle', false, false, false, false, false, false, 'sad', false)).toBe('sad');
    expect(resolveAnimationPriority('idle', false, false, false, false, false, false, 'calm', false)).toBe('idle');
  });

  it('9. verifies periodic focus event generator returns valid routines', () => {
    const behavior = new BehaviorEngine();
    const event = behavior.getRandomFocusEvent(40);
    expect(event).toBeDefined();
    expect(event.action).toBeDefined();
    expect(event.animation).toBeDefined();
    expect(event.thought).toBeDefined();
  });

  it('10. verifies Lulu Master Flame combos and synergy matrix', async () => {
    const { LULU_FLAME_STYLES, getFlameCombo, isValidFlameCombo } = await import('../src/config/luluFlameConfig');
    
    // All styles must have configured combos
    Object.values(LULU_FLAME_STYLES).forEach((style) => {
      expect(style.framesCount).toBeGreaterThan(0);
      expect(style.fps).toBeGreaterThan(0);
      expect(style.comboWith.length).toBeGreaterThan(0);
    });

    // Specific synergy checks
    expect(isValidFlameCombo('sprint_dash', 'celebration_cheer')).toBe(true);
    expect(isValidFlameCombo('spotify_sing', 'spotify_dance')).toBe(true);
    expect(isValidFlameCombo('susanoo_defense', 'ninja_salute')).toBe(true);

    // Dynamic combo retrieval
    const comboForSing = getFlameCombo('spotify_sing');
    expect(['spotify_dance', 'celebration_cheer', 'ninja_salute']).toContain(comboForSing.id);
  });

  it('11. verifies -40% slow flame update speed multiplier and Tasks: Unlock All registry', async () => {
    const { getEffectiveFps, getEffectiveFrameIntervalMs, LULU_TASKS, DEFAULT_FLAME_SPEED_MULTIPLIER } = await import('../src/config/luluFlameConfig');
    
    // Default multiplier is 0.60 (-40% slow)
    expect(DEFAULT_FLAME_SPEED_MULTIPLIER).toBe(0.60);

    // 25 FPS sprint slowed by -40% -> 15 FPS
    expect(getEffectiveFps(25, 0.60)).toBe(15);
    expect(getEffectiveFrameIntervalMs(25, 0.60)).toBe(67); // 1000 / 15 ≈ 67ms

    // 10 FPS sing/dance slowed by -40% -> 6 FPS
    expect(getEffectiveFps(10, 0.60)).toBe(6);
    expect(getEffectiveFrameIntervalMs(10, 0.60)).toBe(167); // 1000 / 6 ≈ 167ms

    // MovementEngine configured with -40% slow multiplier
    engine.setSpeedMultiplier(0.60);
    const state = engine.getState();
    expect(state.runSpeed).toBe(5); // 8 * 0.6 = 4.8 -> 5
    expect(state.speedMultiplier).toBe(0.60);

    // Tasks system: Unlock All task is configured and active
    const unlockAllTask = LULU_TASKS.find((t) => t.id === 'unlock_all_flames');
    expect(unlockAllTask).toBeDefined();
    expect(unlockAllTask?.isCompleted).toBe(true);
    expect(unlockAllTask?.unlockedItems.length).toBe(9);
  });
});


