import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateMessageDuration,
  splitGraphemes,
  paginateText,
} from '../src/utils/readingTime';
import { SpeechSystem } from '../src/interaction/speechSystem';
import { SpeechMessage, SpeechPriority } from '../src/types';

describe('Speech Bubble Display Timing & Utilities', () => {
  describe('calculateMessageDuration', () => {
    it('enforces 4000ms minimum display time for short text', () => {
      expect(calculateMessageDuration('Hi')).toBe(4000);
      expect(calculateMessageDuration('Hello friend!')).toBe(4000);
      expect(calculateMessageDuration('123456789012345678901234567890')).toBe(4000);
    });

    it('scales duration proportionally for medium messages (41-80 chars)', () => {
      const medium = 'A'.repeat(60);
      const duration = calculateMessageDuration(medium);
      // 2500 + 60 * 45 = 5200ms
      expect(duration).toBeGreaterThanOrEqual(5000);
      expect(duration).toBeLessThanOrEqual(7000);
    });

    it('calculates 8s+ for long messages (81-140 chars)', () => {
      const long = 'A'.repeat(120);
      const duration = calculateMessageDuration(long);
      // 2500 + 120 * 45 = 7900ms -> ~8s
      expect(duration).toBeGreaterThanOrEqual(7800);
      expect(duration).toBeLessThanOrEqual(10000);
    });

    it('clamps very long text to 12000ms maximum', () => {
      const veryLong = 'A'.repeat(300);
      expect(calculateMessageDuration(veryLong)).toBe(12000);
    });

    it('applies category adjustments for notifications and errors', () => {
      expect(calculateMessageDuration('Oops', 'failure')).toBe(8000);
      expect(calculateMessageDuration('Alert!', 'user', SpeechPriority.NOTIFICATION)).toBe(6500);
      expect(calculateMessageDuration('Playing song', 'music')).toBe(5000);
    });

    it('keeps critical messages until dismissed (Infinity)', () => {
      expect(calculateMessageDuration('Critical error', 'error', SpeechPriority.CRITICAL)).toBe(Infinity);
    });
  });

  describe('splitGraphemes Unicode & Khmer handling', () => {
    it('splits English text correctly', () => {
      expect(splitGraphemes('Hello')).toEqual(['H', 'e', 'l', 'l', 'o']);
    });

    it('handles multi-byte emojis as single grapheme units', () => {
      const clusters = splitGraphemes('Eye 👁️ Star ✨ Ninja 🍥');
      expect(clusters).toContain('👁️');
      expect(clusters).toContain('✨');
      expect(clusters).toContain('🍥');
    });

    it('preserves Khmer text graphemes without broken diacritics', () => {
      const khmer = 'សួស្តី! Lulu';
      const graphemes = splitGraphemes(khmer);
      expect(graphemes.length).toBeGreaterThan(0);
      expect(graphemes.join('')).toBe(khmer);
    });
  });

  describe('paginateText', () => {
    it('does not split short messages', () => {
      const short = 'Single short sentence.';
      expect(paginateText(short, 100)).toEqual([short]);
    });

    it('splits text longer than maxCharsPerPage into pages along sentence boundaries', () => {
      const longText =
        'First sentence is right here. Second sentence follows immediately after. Third sentence concludes the message completely.';
      const pages = paginateText(longText, 55);
      expect(pages.length).toBeGreaterThan(1);
      expect(pages.join(' ')).toContain('First sentence');
      expect(pages.join(' ')).toContain('Third sentence');
    });
  });

  describe('SpeechSystem Queue & Anti-Spam Engine', () => {
    let speech: SpeechSystem;

    beforeEach(() => {
      speech = new SpeechSystem();
      vi.useFakeTimers();
    });

    it('displays the first message and sets state to SHOWING', () => {
      const msg: SpeechMessage = {
        id: 'msg_1',
        text: 'Hello world!',
        mood: 'happy',
        priority: SpeechPriority.IDLE,
        durationMs: 4500,
        category: 'idle',
        dismissible: true,
        createdAt: Date.now(),
      };

      const result = speech.enqueue(msg);
      expect(result).toBe(true);
      expect(speech.getCurrentMessage()?.text).toBe('Hello world!');
      expect(speech.getState()).toBe('SHOWING');
    });

    it('drops duplicate identical messages sent within 10s cooldown', () => {
      const msg1: SpeechMessage = {
        id: 'msg_1',
        text: 'Telegram has a new message',
        mood: 'happy',
        priority: SpeechPriority.NOTIFICATION,
        durationMs: 6000,
        category: 'idle',
        dismissible: true,
        createdAt: Date.now(),
      };
      const msg2: SpeechMessage = { ...msg1, id: 'msg_2' };

      expect(speech.enqueue(msg1)).toBe(true);
      // Immediate duplicate
      expect(speech.enqueue(msg2)).toBe(false);
      expect(speech.getQueueLength()).toBe(0);
    });

    it('interrupts normal messages when a CRITICAL message arrives', () => {
      const normalMsg: SpeechMessage = {
        id: 'msg_normal',
        text: 'Normal idle chatter',
        mood: 'calm',
        priority: SpeechPriority.IDLE,
        durationMs: 5000,
        category: 'idle',
        dismissible: true,
        createdAt: Date.now(),
      };

      const critMsg: SpeechMessage = {
        id: 'msg_crit',
        text: 'CRITICAL BATTERY LOW',
        mood: 'worried',
        priority: SpeechPriority.CRITICAL,
        durationMs: Infinity,
        category: 'failure',
        dismissible: true,
        createdAt: Date.now(),
      };

      speech.enqueue(normalMsg);
      expect(speech.getCurrentMessage()?.text).toBe('Normal idle chatter');

      // Enqueue critical
      speech.enqueue(critMsg);
      expect(speech.getCurrentMessage()?.text).toBe('CRITICAL BATTERY LOW');
      // Interrupted normal message was pushed to queue
      expect(speech.getQueueLength()).toBe(1);
    });

    it('transitions to VISIBLE and starts timer only after typewriter finishes', () => {
      const msg: SpeechMessage = {
        id: 'msg_1',
        text: 'Testing typewriter finish',
        mood: 'focused',
        priority: SpeechPriority.USER_INTERACTION,
        durationMs: 5000,
        category: 'study',
        dismissible: true,
        createdAt: Date.now(),
      };

      speech.enqueue(msg);
      expect(speech.getState()).toBe('SHOWING');

      // Finish typewriter
      speech.onTypewriterFinished();
      expect(speech.getState()).toBe('VISIBLE');

      // Fast-forward 4000ms (should still be visible)
      vi.advanceTimersByTime(4000);
      expect(speech.getState()).toBe('VISIBLE');

      // Fast-forward remaining 1001ms (should enter FADING state)
      vi.advanceTimersByTime(1001);
      expect(speech.getState()).toBe('FADING');

      // Fast-forward fade-out duration (350ms -> HIDDEN)
      vi.advanceTimersByTime(350);
      expect(speech.getState()).toBe('HIDDEN');
    });

    it('pauses on hover and resumes remaining duration without resetting timer', () => {
      const msg: SpeechMessage = {
        id: 'msg_pause',
        text: 'Testing hover pause',
        mood: 'calm',
        priority: SpeechPriority.IDLE,
        durationMs: 6000,
        category: 'idle',
        dismissible: true,
        createdAt: Date.now(),
      };

      speech.enqueue(msg);
      speech.onTypewriterFinished();
      expect(speech.getState()).toBe('VISIBLE');

      // Read for 3 seconds
      vi.advanceTimersByTime(3000);

      // User hovers
      speech.pause();
      expect(speech.getState()).toBe('PAUSED');

      // Wait 10 seconds while hovered
      vi.advanceTimersByTime(10000);
      expect(speech.getState()).toBe('PAUSED');
      expect(speech.getCurrentMessage()?.text).toBe('Testing hover pause');

      // User leaves hover
      speech.resume();
      expect(speech.getState()).toBe('VISIBLE');

      // Wait 2.5 seconds (remaining time: 3000 - 2500 = 500ms left)
      vi.advanceTimersByTime(2500);
      expect(speech.getState()).toBe('VISIBLE');

      // Wait 501ms more -> enters FADING
      vi.advanceTimersByTime(501);
      expect(speech.getState()).toBe('FADING');

      // Wait fade animation duration -> HIDDEN
      vi.advanceTimersByTime(350);
      expect(speech.getState()).toBe('HIDDEN');
    });

    it('stores last message and allows reopening within 60 seconds', () => {
      const msg: SpeechMessage = {
        id: 'msg_reopen',
        text: 'Important advice from Madara',
        mood: 'focused',
        priority: SpeechPriority.USER_INTERACTION,
        durationMs: 4000,
        category: 'study',
        dismissible: true,
        createdAt: Date.now(),
      };

      speech.enqueue(msg);
      speech.onTypewriterFinished();
      speech.dismiss();

      // Advance fade time
      vi.advanceTimersByTime(400);
      expect(speech.getState()).toBe('HIDDEN');

      // Click to reopen
      const reopened = speech.reopenLastMessage();
      expect(reopened).toBe(true);
      expect(speech.getCurrentMessage()?.text).toBe('Important advice from Madara');
    });
  });
});
