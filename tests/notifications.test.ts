import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationManager } from '../src/features/notifications/NotificationManager';

describe('NotificationManager', () => {
  let nm: NotificationManager;
  let reactionMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    nm = new NotificationManager();
    reactionMock = vi.fn();
    await nm.initialize(reactionMock);
  });

  it('identifies known desktop applications and assigns correct icons', () => {
    expect(nm.identifyApp('org.telegram.desktop').name).toBe('Telegram');
    expect(nm.identifyApp('Telegram').icon).toBe('✈️');

    expect(nm.identifyApp('discord').name).toBe('Discord');
    expect(nm.identifyApp('Slack').name).toBe('Slack');
    expect(nm.identifyApp('thunderbird').name).toBe('Email');
    expect(nm.identifyApp('google-chrome').name).toBe('Browser');
    expect(nm.identifyApp('code').name).toBe('VS Code');
    expect(nm.identifyApp('kitty').name).toBe('Terminal');
    expect(nm.identifyApp('spotify').name).toBe('Music');

    const unknown = nm.identifyApp('custom-utility');
    expect(unknown.name).toBe('custom-utility');
    expect(unknown.icon).toBe('🔔');
  });

  it('enforces privacy: masks message content when readMessageContent is false', () => {
    nm.updateSettings({ readMessageContent: false });

    nm.handleIncoming({
      id: 'test_1',
      appName: 'Telegram',
      appIcon: '',
      summary: 'Confidential Secret Password',
      body: 'Do not leak this text',
      timestamp: Date.now(),
    });

    expect(reactionMock).toHaveBeenCalledTimes(1);
    const reactionText = reactionMock.mock.calls[0][0];
    expect(reactionText).toBe('New notification from Telegram! ✈️');
    expect(reactionText).not.toContain('Confidential Secret Password');
    expect(reactionText).not.toContain('Do not leak this text');
  });

  it('includes summary only when readMessageContent is explicitly enabled', () => {
    nm.updateSettings({ readMessageContent: true });

    nm.handleIncoming({
      id: 'test_2',
      appName: 'Discord',
      appIcon: '',
      summary: 'Game night in 5 mins!',
      body: 'Hop on voice channel',
      timestamp: Date.now(),
    });

    expect(reactionMock).toHaveBeenCalledTimes(1);
    const reactionText = reactionMock.mock.calls[0][0];
    expect(reactionText).toContain('Game night in 5 mins!');
  });

  it('filters notifications by app whitelist', () => {
    nm.updateSettings({ whitelistedApps: ['Telegram', 'Slack'] });

    // Discord is not whitelisted
    nm.handleIncoming({
      id: 'test_3',
      appName: 'Discord',
      appIcon: '',
      summary: 'Hello',
      body: 'World',
      timestamp: Date.now(),
    });
    expect(reactionMock).not.toHaveBeenCalled();

    // Telegram is whitelisted
    nm.handleIncoming({
      id: 'test_4',
      appName: 'Telegram',
      appIcon: '',
      summary: 'Allowed message',
      body: 'From friend',
      timestamp: Date.now(),
    });
    expect(reactionMock).toHaveBeenCalledTimes(1);
  });

  it('suppresses reactions when notifications are disabled', () => {
    nm.updateSettings({ enabled: false });

    nm.handleIncoming({
      id: 'test_5',
      appName: 'Telegram',
      appIcon: '',
      summary: 'Ping',
      body: 'Pong',
      timestamp: Date.now(),
    });

    expect(reactionMock).not.toHaveBeenCalled();
    expect(nm.getHistory().length).toBe(0);
  });

  it('caps notification history to 30 items', () => {
    for (let i = 0; i < 35; i++) {
      nm.handleIncoming({
        id: `msg_${i}`,
        appName: 'TestApp',
        appIcon: '',
        summary: `Message ${i}`,
        body: '',
        timestamp: Date.now() + i,
      });
    }

    const history = nm.getHistory();
    expect(history.length).toBe(30);
    // Most recent is first (unshift)
    expect(history[0].id).toBe('msg_34');
  });
});
