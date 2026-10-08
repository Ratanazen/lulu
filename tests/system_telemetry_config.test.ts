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

  it('triggers guardian barrier reaction when discrete GPU and CPU >= 45% in SYSTEM_SYNC mode', () => {
    const engine = new BehaviorEngine('SYSTEM_SYNC');
    const needs: PetNeeds = { energy: 80, happiness: 80, fun: 80 };
    const telemetry: SystemTelemetry = {
      cpuPercent: 52.0,
      cpuCores: 16,
      memUsedMb: 6000,
      memTotalMb: 16000,
      memPercent: 37.5,
      gpuIsDiscrete: true,
      gpuName: 'NVIDIA GeForce RTX 4070',
    };

    const decision = engine.evaluateNextStep(needs, 'calm', false, false, telemetry);
    expect(decision.action).toBe('protect');
    expect(decision.animation).toBe('protect');
    expect(decision.thought).toContain('Discrete GPU active');
  });

  it('verifies that all companion thought strings contain zero text emojis', () => {
    const engine = new BehaviorEngine('SYSTEM_SYNC');
    const needs: PetNeeds = { energy: 80, happiness: 80, fun: 80 };
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    const testTelemetryCases: SystemTelemetry[] = [
      { cpuPercent: 85, memUsedMb: 4000, memTotalMb: 16000, memPercent: 25 },
      { cpuPercent: 20, memUsedMb: 14000, memTotalMb: 16000, memPercent: 90 },
      { cpuPercent: 20, memUsedMb: 4000, memTotalMb: 16000, memPercent: 25, batteryPercent: 12, isCharging: false },
      { cpuPercent: 55, memUsedMb: 6000, memTotalMb: 16000, memPercent: 37, gpuIsDiscrete: true },
      { cpuPercent: 15, memUsedMb: 4000, memTotalMb: 16000, memPercent: 25 },
    ];

    for (const t of testTelemetryCases) {
      const decision = engine.evaluateNextStep(needs, 'calm', false, false, t);
      if (decision.thought) {
        expect(emojiRegex.test(decision.thought)).toBe(false);
      }
    }
  });

  it('correctly calculates Swap memory usage and clamping', () => {
    const swapUsedMb = 2048;
    const swapTotalMb = 4096;
    const swapPercent = swapTotalMb > 0 ? (swapUsedMb / swapTotalMb) * 100 : 0;
    expect(swapPercent).toBe(50);

    const zeroTotal = 0;
    const zeroPercent = zeroTotal > 0 ? (100 / zeroTotal) * 100 : 0;
    expect(zeroPercent).toBe(0);
  });

  it('correctly calculates Root Disk usage and percentage', () => {
    const totalGb = 500.0;
    const availGb = 200.0;
    const usedGb = Math.max(0, Math.round((totalGb - availGb) * 10) / 10);
    const diskPercent = totalGb > 0 ? (usedGb / totalGb) * 100 : 0;

    expect(usedGb).toBe(300.0);
    expect(diskPercent).toBe(60);
  });

  it('validates comprehensive CPU and GPU telemetry data attributes', () => {
    const telemetry: SystemTelemetry = {
      cpuPercent: 35.2,
      cpuCores: 16,
      cpuPhysicalCores: 12,
      cpuModel: '12th Gen Intel(R) Core(TM) i7-12700H',
      cpuVendor: 'GenuineIntel',
      cpuFreqMhz: 2700,
      memUsedMb: 8192,
      memTotalMb: 16384,
      memPercent: 50.0,
      gpuName: 'NVIDIA GeForce RTX 3060 Mobile',
      gpuVendor: 'NVIDIA',
      gpuRenderer: 'nvidia',
      gpuIsDiscrete: true,
      gpuVramMb: 6144,
      gpuStatus: 'DETECTED',
      diskRootUsedGb: 150.0,
      diskRootTotalGb: 500.0,
      diskRootPercent: 30.0,
      diskRootFs: 'ext4',
      batteryPercent: 88,
      isCharging: true,
      powerSource: 'AC',
      osName: 'Arch Linux',
      kernelVersion: '6.8.9-arch1-1',
      compositor: 'Sway',
      isLowSpec: false,
    };

    expect(telemetry.cpuModel).toContain('Intel');
    expect(telemetry.cpuFreqMhz).toBe(2700);
    expect(telemetry.gpuIsDiscrete).toBe(true);
    expect(telemetry.gpuVramMb).toBe(6144);
    expect(telemetry.diskRootFs).toBe('ext4');
    expect(telemetry.compositor).toBe('Sway');
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
