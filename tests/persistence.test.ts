import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAllSettings,
  setSetting,
  getSetting,
  setSettingsBulk,
  getConversations,
  createConversation,
  getMessages,
  saveMessage,
  getMemories,
  saveMemory,
  deleteMemory,
  getGameScores,
  saveGameRecord,
  getRecentNotifications,
  saveNotification,
} from '../src/services/storageService';
import { StreakTracker } from '../src/progression/streakTracker';

describe('SQLite Persistence Backbone Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Settings Storage', () => {
    it('saves and reads individual settings', async () => {
      await setSetting('test_theme', 'cyberpunk');
      const val = await getSetting('test_theme');
      expect(val).toBe('cyberpunk');
    });

    it('performs bulk set and read operations', async () => {
      await setSettingsBulk([
        ['pref_volume', '0.8'],
        ['pref_mode', 'PLAYFUL'],
        ['pref_scale', '1.2'],
      ]);

      const all = await getAllSettings();
      const map = new Map(all);
      expect(map.get('pref_volume')).toBe('0.8');
      expect(map.get('pref_mode')).toBe('PLAYFUL');
      expect(map.get('pref_scale')).toBe('1.2');
    });
  });

  describe('Conversation and Message Persistence', () => {
    it('creates conversation and retrieves messages', async () => {
      const convId = 'conv_test_123';
      await createConversation(convId, 'Debug Session', 'ollama', 'llama3.2');

      await saveMessage('msg_1', convId, 'user', 'Hello Lulu');
      await saveMessage('msg_2', convId, 'assistant', 'Hi friend! Ready to code?');

      const messages = await getMessages(convId);
      expect(messages.length).toBe(2);
      expect(messages[0].content).toBe('Hello Lulu');
      expect(messages[1].content).toBe('Hi friend! Ready to code?');
    });
  });

  describe('Memory Subsystem Persistence', () => {
    it('saves, searches, and deletes memories', async () => {
      await saveMemory('mem_1', 'Favorite Language', 'Rust and TypeScript', 'preference', 5, true);
      await saveMemory('mem_2', 'Project Name', 'Lulu Desktop Companion', 'work', 4, false);

      const all = await getMemories();
      expect(all.length).toBeGreaterThanOrEqual(2);

      const filtered = await getMemories('Rust');
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe('Favorite Language');

      await deleteMemory('mem_1');
      const remaining = await getMemories('Rust');
      expect(remaining.length).toBe(0);
    });
  });

  describe('Game Scores Persistence', () => {
    it('records gameplay scores and maintains personal best', async () => {
      await saveGameRecord('catch', 450);
      await saveGameRecord('catch', 800);
      await saveGameRecord('catch', 620);

      const scores = await getGameScores();
      const catchRecord = scores.find((s) => s.game_id === 'catch');
      expect(catchRecord).toBeDefined();
      expect(catchRecord?.high_score).toBe(800);
      expect(catchRecord?.total_plays).toBe(3);
    });
  });

  describe('Notification History Persistence', () => {
    it('records and returns recent notifications', async () => {
      await saveNotification('notif_1', 'Discord', 'Mention', 'Hey check out the new build', '');
      await saveNotification('notif_2', 'GitHub', 'Pull Request', 'feat: big max plan complete', '');

      const notifs = await getRecentNotifications(10);
      expect(notifs.length).toBe(2);
      expect(notifs.some((n) => n.app_name === 'Discord')).toBe(true);
      expect(notifs.some((n) => n.app_name === 'GitHub')).toBe(true);
    });
  });

  describe('Daily Streak Engine', () => {
    it('starts at Day 1 on fresh launch and awards bonus XP', async () => {
      const res = await StreakTracker.checkAndUpdateStreak();
      expect(res.currentStreak).toBe(1);
      expect(res.bonusXp).toBeGreaterThan(0);
      expect(res.isNewDay).toBe(true);

      // Checking again on same day should not count as new day
      const res2 = await StreakTracker.checkAndUpdateStreak();
      expect(res2.isNewDay).toBe(false);
      expect(res2.bonusXp).toBe(0);
    });
  });
});
