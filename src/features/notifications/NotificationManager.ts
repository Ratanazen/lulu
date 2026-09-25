import { DesktopNotification, NotificationSettings } from './types';
import { StorageService, saveNotification, getRecentNotifications } from '../../services/storageService';

let tauriListen: (<T = any>(event: string, handler: (event: { payload: T }) => void) => Promise<() => void>) | null = null;
let tauriInvoke: (<T = any>(cmd: string, args?: Record<string, unknown>) => Promise<T>) | null = null;

async function getTauri() {
  if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
    return { listen: null, invoke: null };
  }
  if (!tauriListen) {
    try {
      const eventMod = await import('@tauri-apps/api/event');
      tauriListen = eventMod.listen;
      const coreMod = await import('@tauri-apps/api/core');
      tauriInvoke = coreMod.invoke;
    } catch {
      return { listen: null, invoke: null };
    }
  }
  return { listen: tauriListen, invoke: tauriInvoke };
}

export type NotificationReactionHandler = (
  reactionMessage: string,
  appName: string,
  notification: DesktopNotification
) => void;

export class NotificationManager {
  private settings: NotificationSettings = {
    enabled: true,
    visualReaction: true,
    voiceNotification: false,
    readMessageContent: false, // Strict privacy: default OFF
    showAppName: true,
    whitelistedApps: [], // Empty means all allowed
  };

  private history: DesktopNotification[] = [];
  private reactionHandler: NotificationReactionHandler | null = null;
  private unlisten: (() => void) | null = null;

  public async initialize(onReaction: NotificationReactionHandler) {
    this.reactionHandler = onReaction;

    // Load persisted settings
    const saved = await StorageService.get<NotificationSettings>('notification_settings', this.settings);
    if (saved) {
      this.settings = { ...this.settings, ...saved };
    }
    
    // Load persisted history
    try {
      const records = await getRecentNotifications(100);
      this.history = records.map(r => ({
        id: r.id,
        appName: r.app_name,
        summary: r.title,
        body: r.body,
        appIcon: r.icon,
        timestamp: r.received_at
      }));
    } catch (e) {
      console.warn('[NotificationManager] Failed to load notification history:', e);
    }

    // Register Tauri event listener
    const { listen } = await getTauri();
    if (listen) {
      try {
        const unlistenFn = await listen<DesktopNotification>('desktop-notification', (ev) => {
          this.handleIncoming(ev.payload);
        });
        this.unlisten = unlistenFn;
      } catch (e) {
        console.warn('[NotificationManager] listen desktop-notification failed:', e);
      }
    }
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...updates };
    StorageService.set('notification_settings', this.settings);
  }

  public getHistory(): DesktopNotification[] {
    return [...this.history];
  }

  public clearHistory() {
    this.history = [];
  }

  public async sendTestNotification(appName: string = 'Telegram', summary: string = 'New message received', body: string = 'Hey Lulu! Time for a break.') {
    const { invoke } = await getTauri();
    if (invoke) {
      try {
        await invoke('send_test_notification', {
          appName,
          summary,
          body,
        });
        return;
      } catch (e) {
        console.warn('[NotificationManager] send_test_notification failed, simulating:', e);
      }
    }

    // Direct simulation fallback
    this.handleIncoming({
      id: `sim_${Date.now()}`,
      appName,
      appIcon: '',
      summary,
      body,
      timestamp: Date.now(),
    });
  }

  public handleIncoming(raw: DesktopNotification) {
    if (!this.settings.enabled) return;

    // Whitelist check
    if (
      this.settings.whitelistedApps.length > 0 &&
      !this.settings.whitelistedApps.some(
        (app) => app.toLowerCase() === raw.appName.toLowerCase()
      )
    ) {
      return;
    }

    // Store in history (capped at 30)
    this.history.unshift(raw);
    if (this.history.length > 30) {
      this.history.pop();
    }
    
    // Persist
    saveNotification(
      raw.id || `notif_${Date.now()}`,
      raw.appName,
      raw.summary || '',
      raw.body || '',
      raw.appIcon || ''
    ).catch(e => console.warn('[NotificationManager] Failed to save notification:', e));

    // App name identification
    const identified = this.identifyApp(raw.appName);

    // Format companion reaction
    let reaction = '';
    if (this.settings.readMessageContent && raw.summary) {
      reaction = `[${identified.name}] ${raw.summary} ${identified.icon}`;
    } else {
      reaction = `New notification from ${identified.name}! ${identified.icon}`;
    }

    if (this.settings.visualReaction && this.reactionHandler) {
      this.reactionHandler(reaction, identified.name, raw);
    }
  }

  public identifyApp(rawName: string): { name: string; icon: string; category: string } {
    const lower = rawName.toLowerCase();

    if (lower.includes('telegram')) return { name: 'Telegram', icon: '✈️', category: 'Chat' };
    if (lower.includes('discord')) return { name: 'Discord', icon: '🎮', category: 'Chat' };
    if (lower.includes('slack')) return { name: 'Slack', icon: '💼', category: 'Work' };
    if (lower.includes('mail') || lower.includes('thunderbird') || lower.includes('gmail'))
      return { name: 'Email', icon: '✉️', category: 'Mail' };
    if (lower.includes('brave') || lower.includes('firefox') || lower.includes('chrome') || lower.includes('chromium'))
      return { name: 'Browser', icon: '🌐', category: 'Web' };
    if (lower.includes('code') || lower.includes('cursor') || lower.includes('neovim'))
      return { name: 'VS Code', icon: '💻', category: 'Dev' };
    if (lower.includes('terminal') || lower.includes('kitty') || lower.includes('alacritty') || lower.includes('foot'))
      return { name: 'Terminal', icon: '🖥️', category: 'Dev' };
    if (lower.includes('spotify') || lower.includes('music') || lower.includes('vlc'))
      return { name: 'Music', icon: '🎵', category: 'Media' };

    return {
      name: rawName || 'Desktop App',
      icon: '🔔',
      category: 'System',
    };
  }

  public cleanup() {
    this.unlisten?.();
    this.unlisten = null;
  }
}

export const notificationManager = new NotificationManager();
