import { describe, it, expect } from 'vitest';
import { MonitorService } from '../src/services/monitorService';

describe('Host Hardware & System Telemetry Service', () => {
  it('retrieves host hardware information with CPU, RAM, and GPU', async () => {
    const hw = await MonitorService.getHostHardwareInfo();
    expect(hw).toBeDefined();
    if (!hw) return;

    // CPU assertions
    expect(hw.cpu).toBeDefined();
    expect(typeof hw.cpu.brand).toBe('string');
    expect(hw.cpu.brand.length).toBeGreaterThan(0);
    expect(hw.cpu.cores).toBeGreaterThanOrEqual(1);
    expect(hw.cpu.threads).toBeGreaterThanOrEqual(1);
    expect(typeof hw.cpu.usagePercentage).toBe('number');
    expect(Array.isArray(hw.cpu.perCoreUsage)).toBe(true);

    // RAM assertions
    expect(hw.memory).toBeDefined();
    expect(hw.memory.totalMb).toBeGreaterThan(0);
    expect(hw.memory.usedMb).toBeGreaterThanOrEqual(0);
    expect(hw.memory.availableMb).toBeGreaterThan(0);
    expect(hw.memory.usagePercentage).toBeGreaterThanOrEqual(0);
    expect(hw.memory.usagePercentage).toBeLessThanOrEqual(100);

    // GPU assertions
    expect(hw.gpu).toBeDefined();
    expect(typeof hw.gpu.vendor).toBe('string');
    expect(typeof hw.gpu.model).toBe('string');
    expect(hw.gpu.vramTotalMb).toBeGreaterThanOrEqual(0);

    // Host System assertions
    expect(typeof hw.hostname).toBe('string');
    expect(typeof hw.osName).toBe('string');
    expect(typeof hw.kernelVersion).toBe('string');
    expect(typeof hw.windowManager).toBe('string');
    expect(typeof hw.sessionType).toBe('string');
  });

  it('provides realistic metrics for physical AMD host hardware', async () => {
    const hw = await MonitorService.getHostHardwareInfo();
    expect(hw).not.toBeNull();
    if (!hw) return;

    expect(hw.cpu.brand).toContain('AMD');
    expect(hw.gpu.vendor).toBe('AMD');
    expect(hw.memory.totalMb).toBeGreaterThanOrEqual(8000); // 14GB+ RAM on host
  });
});
