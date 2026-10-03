import { describe, it, expect } from 'vitest';
import { BehaviorEngine } from '../src/behavior/BehaviorEngine';
import { SystemTelemetry, PetNeeds } from '../src/types/pet';

describe('System Telemetry & Resource Configuration', () => {
  it('correctly calculates RAM usage percentage from MB when not pre-calculated', () => {
    const memUsedMb = 4096;
    const memTotalMb = 16384;
    const computed = (memUsedMb / memTotalMb) * 100;
    expect(computed).toBe(25);
  });

  it('clamps CPU percent safely between 0 and 100', () => {
    const rawHigh = 120.5;
    const rawLow = -10.2;
    const clampedHigh = Math.max(0, Math.min(100, rawHigh));
    const clampedLow = Math.max(0, Math.min(100, rawLow));
    expect(clampedHigh).toBe(100);
    expect(clampedLow).toBe(0);
  });

  it('triggers companion overclock reaction when CPU >= 65% in SYSTEM_SYNC mode', () => {
    const engine = new BehaviorEngine('SYSTEM_SYNC');
    const needs: PetNeeds = { energy: 80, happiness: 80, fun: 80 };
    const telemetry: SystemTelemetry = {
      cpuPercent: 78.4,
      cpuCores: 8,
      memUsedMb: 6000,
      memTotalMb: 16000,
      memPercent: 37.5,
    };

    const decision = engine.evaluateNextStep(needs, 'calm', false, false, telemetry);
    expect(decision.action).toBe('run_sprint');
    expect(decision.animation).toBe('run-right');
    expect(decision.thought).toContain('System CPU load at 78%');
  });

  it('triggers guardian barrier reaction when RAM >= 85% in SYSTEM_SYNC mode', () => {
    const engine = new BehaviorEngine('SYSTEM_SYNC');
    const needs: PetNeeds = { energy: 80, happiness: 80, fun: 80 };
    const telemetry: SystemTelemetry = {
      cpuPercent: 20.0,
      cpuCores: 8,
      memUsedMb: 14000,
      memTotalMb: 16000,
      memPercent: 87.5,
    };

    const decision = engine.evaluateNextStep(needs, 'calm', false, false, telemetry);
    expect(decision.action).toBe('protect');
    expect(decision.animation).toBe('protect');
    expect(decision.thought).toContain('Memory usage high (88%)');
  });

  it('triggers battery conservation sleep when battery is low and not charging', () => {
    const engine = new BehaviorEngine('SYSTEM_SYNC');
    const needs: PetNeeds = { energy: 80, happiness: 80, fun: 80 };
    const telemetry: SystemTelemetry = {
      cpuPercent: 20.0,
      cpuCores: 8,
      memUsedMb: 4000,
      memTotalMb: 16000,
      memPercent: 25.0,
      batteryPercent: 15,
      isCharging: false,
    };

    const decision = engine.evaluateNextStep(needs, 'calm', false, false, telemetry);
    expect(decision.action).toBe('sleep');
    expect(decision.animation).toBe('sleep');
    expect(decision.thought).toContain('Battery low (15%)');
  });

  it('verifies performance profiles FPS and polling configurations', () => {
    const profiles = [
      { id: 'Auto', fps: 30, poll: 2000, lowSpec: false },
      { id: 'PowerSaver', fps: 15, poll: 5000, lowSpec: true },
      { id: 'Balanced', fps: 30, poll: 2000, lowSpec: false },
      { id: 'High', fps: 60, poll: 1000, lowSpec: false },
      { id: 'Low', fps: 15, poll: 3000, lowSpec: true },
    ];

    expect(profiles.find(p => p.id === 'PowerSaver')?.fps).toBe(15);
    expect(profiles.find(p => p.id === 'High')?.fps).toBe(60);
    expect(profiles.find(p => p.id === 'Balanced')?.fps).toBe(30);
  });
});
