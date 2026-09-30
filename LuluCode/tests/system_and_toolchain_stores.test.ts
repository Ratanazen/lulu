import { describe, it, expect } from 'vitest';
import { useSystemStore } from '../src/stores/useSystemStore';
import { useCCppStore } from '../src/stores/useCCppStore';

describe('System and C/C++ Stores', () => {
  it('initializes useSystemStore with default states', () => {
    const state = useSystemStore.getState();
    expect(state.systemInfo).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(typeof state.refreshSystemInfo).toBe('function');
    expect(typeof state.copyReport).toBe('function');
  });

  it('initializes useCCppStore with default states', () => {
    const state = useCCppStore.getState();
    expect(state.toolchain).toBeNull();
    expect(state.projectDetails).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(typeof state.refreshToolchain).toBe('function');
    expect(typeof state.detectProject).toBe('function');
    expect(typeof state.formatFile).toBe('function');
  });
});
