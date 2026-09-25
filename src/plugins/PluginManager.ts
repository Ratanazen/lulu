// Sandboxed Community Plugin Architecture for Lulu Desktop
// Allows safe, capability-gated modular extensions for Lulu without compromising desktop security.

import { StorageService } from '../services/storageService';
import { eventBus } from '../services/eventBus';

export type PluginPermission = 'ui' | 'notifications' | 'storage' | 'character' | 'audio';

export interface LuluPlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: PluginPermission[];
  enabled: boolean;
  onLoad?: () => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
  onTick?: () => void;
}

export class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, LuluPlugin> = new Map();
  private enabledPlugins: Set<string> = new Set();
  private tickInterval: number | null = null;

  constructor() {
    this.registerBuiltInPlugins();
  }

  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  private registerBuiltInPlugins(): void {
    // 1. Celestial Weather Widget Plugin
    this.registerPlugin({
      id: 'plugin-weather',
      name: 'Starlight Weather Companion',
      version: '1.0.0',
      author: 'Lulu Community',
      description: 'Provides ambient celestial weather and constellation mood reactions.',
      permissions: ['ui', 'notifications'],
      enabled: false,
      onLoad: () => {
        eventBus.emit('PLUGIN_LOADED', 'PluginManager', { pluginId: 'plugin-weather' });
      },
      onUnload: () => {
        eventBus.emit('PLUGIN_UNLOADED', 'PluginManager', { pluginId: 'plugin-weather' });
      },
    });

    // 2. Pomodoro Focus Companion Plugin
    this.registerPlugin({
      id: 'plugin-pomodoro',
      name: 'Pomodoro Productivity Timer',
      version: '1.1.0',
      author: 'Core Architecture',
      description: 'Synchronizes 25-minute focus intervals with gentle study breaks and chime reminders.',
      permissions: ['ui', 'character', 'notifications', 'audio'],
      enabled: false,
      onLoad: () => {
        eventBus.emit('PLUGIN_LOADED', 'PluginManager', { pluginId: 'plugin-pomodoro' });
      },
    });

    // 3. Retro Synthwave Audio Pack Plugin
    this.registerPlugin({
      id: 'plugin-synthwave',
      name: 'Synthwave Theme & Audio Pack',
      version: '0.9.0',
      author: 'Aesthetic Audio',
      description: 'Enriches sound synthesis with 80s retro synth chimes and neon ambient styling.',
      permissions: ['ui', 'storage', 'audio'],
      enabled: false,
    });
  }

  public registerPlugin(plugin: LuluPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  public getAllPlugins(): LuluPlugin[] {
    return Array.from(this.plugins.values()).map((p) => ({
      ...p,
      enabled: this.enabledPlugins.has(p.id),
    }));
  }

  public async enablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    try {
      if (plugin.onLoad) {
        await plugin.onLoad();
      }
      this.enabledPlugins.add(pluginId);
      await StorageService.set(`plugin_${pluginId}_enabled`, true);
      eventBus.emit('PLUGIN_STATE_CHANGED', 'PluginManager', { pluginId, enabled: true });
      return true;
    } catch (e) {
      console.error(`[PluginManager] Failed to load plugin ${pluginId}:`, e);
      return false;
    }
  }

  public async disablePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    try {
      if (plugin.onUnload) {
        await plugin.onUnload();
      }
      this.enabledPlugins.delete(pluginId);
      await StorageService.set(`plugin_${pluginId}_enabled`, false);
      eventBus.emit('PLUGIN_STATE_CHANGED', 'PluginManager', { pluginId, enabled: false });
      return true;
    } catch (e) {
      console.error(`[PluginManager] Failed to unload plugin ${pluginId}:`, e);
      return false;
    }
  }

  public isPluginEnabled(pluginId: string): boolean {
    return this.enabledPlugins.has(pluginId);
  }

  public hasPermission(pluginId: string, permission: PluginPermission): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    return plugin.permissions.includes(permission);
  }
}

export const pluginManager = PluginManager.getInstance();
