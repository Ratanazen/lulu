import { describe, it, expect, beforeEach, vi } from 'vitest';
import { messageManager } from '../src/services/messageManager';

describe('MessageManager Specification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    messageManager.dismiss();
  });

  it('calculates duration scaling with minimum 4000ms', () => {
    // Access private or test via duration behavior
    messageManager.enqueue('Short message', 'normal');
    // typing finishes after length * 35ms
    vi.advanceTimersByTime(20 * 35);
    // After typing, message is visible with >= 4500ms duration
    let currentState = '';
    const unsub = messageManager.subscribe((_text, state) => {
      currentState = state;
    });

    expect(currentState).toBe('VISIBLE');
    // Advance 3000ms - should still be visible!
    vi.advanceTimersByTime(3000);
    expect(currentState).toBe('VISIBLE');

    // Advance remaining 2000ms - should fade
    vi.advanceTimersByTime(2000);
    expect(['FADING', 'HIDDEN']).toContain(currentState);
    unsub();
  });

  it('pauses and resumes countdown on hover', () => {
    messageManager.enqueue('Testing hover pause', 'normal');
    vi.advanceTimersByTime(30 * 35); // finish typing

    let isPausedState = false;
    const unsub = messageManager.subscribe((_text, _state, paused) => {
      isPausedState = paused;
    });

    messageManager.pause();
    expect(isPausedState).toBe(true);

    // Wait a long time while paused
    vi.advanceTimersByTime(10000);
    expect(isPausedState).toBe(true);

    // Resume
    messageManager.resume();
    expect(isPausedState).toBe(false);
    unsub();
  });
});
