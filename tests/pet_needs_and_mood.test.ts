import { describe, it, expect } from 'vitest';
import { NeedSystem } from '../src/behavior/NeedSystem';
import { MoodSystem } from '../src/behavior/MoodSystem';

describe('Lulu Needs & Mood Systems', () => {
  it('decays energy when active and recovers energy when sleeping', () => {
    const sys = new NeedSystem({ energy: 50, happiness: 50, fun: 50 });

    // Active movement decay
    sys.decayTick(false, true);
    expect(sys.getNeeds().energy).toBeLessThan(50);

    // Sleep recovery
    const lowSys = new NeedSystem({ energy: 20 });
    lowSys.decayTick(true, false);
    expect(lowSys.getNeeds().energy).toBeGreaterThan(20);
  });

  it('replenishes happiness and fun on petting and snacks', () => {
    const sys = new NeedSystem({ happiness: 50, fun: 50 });
    sys.petInteraction();
    expect(sys.getNeeds().happiness).toBe(58);
    expect(sys.getNeeds().fun).toBe(54);

    sys.feedSnack();
    expect(sys.getNeeds().happiness).toBe(68);
  });

  it('determines mood based on needs', () => {
    expect(MoodSystem.calculateMood({ energy: 15, happiness: 80, fun: 80 }, false)).toBe('tired');
    expect(MoodSystem.calculateMood({ energy: 90, happiness: 90, fun: 85 }, false)).toBe('happy');
    expect(MoodSystem.calculateMood({ energy: 80, happiness: 70, fun: 30 }, false)).toBe('playful');
    expect(MoodSystem.calculateMood({ energy: 85, happiness: 65, fun: 60 }, false)).toBe('curious');
    expect(MoodSystem.calculateMood({ energy: 50, happiness: 50, fun: 50 }, false)).toBe('calm');
  });

  it('reacts to computer system telemetry in SYSTEM_SYNC mode', async () => {
    const { BehaviorEngine } = await import('../src/behavior/BehaviorEngine');
    const engine = new BehaviorEngine();
    engine.setMode('SYSTEM_SYNC');

    // High CPU (>65%) triggers sprint
    const highCpu = engine.evaluateNextStep(
      { energy: 90, happiness: 90, fun: 90 },
      'calm',
      false,
      false,
      { cpuPercent: 82, memUsedMb: 4000, memTotalMb: 16000, memPercent: 25 }
    );
    expect(highCpu.action).toBe('run_sprint');
    expect(highCpu.animation).toBe('run-right');
    expect(highCpu.thought).toContain('CPU load');

    // Low battery (<20% discharging) triggers sleep
    const lowBattery = engine.evaluateNextStep(
      { energy: 90, happiness: 90, fun: 90 },
      'calm',
      false,
      false,
      { cpuPercent: 15, memUsedMb: 4000, memTotalMb: 16000, memPercent: 25, batteryPercent: 12, isCharging: false }
    );
    expect(lowBattery.action).toBe('sleep');
    expect(lowBattery.animation).toBe('sleep');
    expect(lowBattery.thought).toContain('Battery low');
  });
});
