import { describe, it, expect, beforeEach } from 'vitest';
import { PluginManager, LuluPlugin } from '../src/plugins/PluginManager';

describe('Sandboxed Community Plugin Architecture', () => {
  let manager: PluginManager;

  beforeEach(() => {
    manager = new PluginManager();
  });

  it('registers built-in plugins with declared permissions', () => {
    const plugins = manager.getAllPlugins();
    expect(plugins.length).toBeGreaterThanOrEqual(3);

    const weather = plugins.find((p) => p.id === 'plugin-weather');
    expect(weather).toBeDefined();
    expect(weather?.permissions).toContain('ui');
    expect(weather?.permissions).toContain('notifications');
  });

  it('enables and disables plugins with lifecycle hooks', async () => {
    let loaded = false;
    let unloaded = false;

    const testPlugin: LuluPlugin = {
      id: 'test-plugin-unit',
      name: 'Unit Test Plugin',
      version: '1.0.0',
      author: 'Test Suite',
      description: 'Verifies lifecycle hooks',
      permissions: ['ui'],
      enabled: false,
      onLoad: () => {
        loaded = true;
      },
      onUnload: () => {
        unloaded = true;
      },
    };

    manager.registerPlugin(testPlugin);

    expect(manager.isPluginEnabled('test-plugin-unit')).toBe(false);

    const enabledSuccess = await manager.enablePlugin('test-plugin-unit');
    expect(enabledSuccess).toBe(true);
    expect(loaded).toBe(true);
    expect(manager.isPluginEnabled('test-plugin-unit')).toBe(true);

    const disabledSuccess = await manager.disablePlugin('test-plugin-unit');
    expect(disabledSuccess).toBe(true);
    expect(unloaded).toBe(true);
    expect(manager.isPluginEnabled('test-plugin-unit')).toBe(false);
  });

  it('enforces least-privilege permission gating', () => {
    expect(manager.hasPermission('plugin-weather', 'notifications')).toBe(true);
    expect(manager.hasPermission('plugin-weather', 'audio')).toBe(false);
  });
});
