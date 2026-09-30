import { describe, it, expect, vi } from 'vitest';
import { eventBus } from '../src/services/eventBus';

describe('EventBus Specification', () => {
  it('delivers events to active subscribers and unbinds cleanly', () => {
    const callback = vi.fn();
    const unsubscribe = eventBus.on('test:ping', callback);

    eventBus.emit('test:ping', { data: 42 });
    expect(callback).toHaveBeenCalledWith({ data: 42 });

    unsubscribe();
    eventBus.emit('test:ping', { data: 99 });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('handles multiple listeners independently', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    const u1 = eventBus.on('music:playback_changed', fn1);
    const u2 = eventBus.on('music:playback_changed', fn2);

    eventBus.emit('music:playback_changed', { status: 'Playing' });
    expect(fn1).toHaveBeenCalledWith({ status: 'Playing' });
    expect(fn2).toHaveBeenCalledWith({ status: 'Playing' });

    u1();
    u2();
  });
});
