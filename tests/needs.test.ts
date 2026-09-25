import { describe, it, expect } from 'vitest';
import { NeedsEngine } from '../src/behavior/needsEngine';

describe('NeedsEngine', () => {
  it('initializes with healthy baseline needs', () => {
    const engine = new NeedsEngine();
    const needs = engine.getNeeds();
    expect(needs.energy).toBeGreaterThanOrEqual(80);
    expect(needs.hunger).toBeGreaterThanOrEqual(80);
    expect(needs.cleanliness).toBeGreaterThanOrEqual(80);
  });

  it('correctly applies care actions and clamps to 100', () => {
    const engine = new NeedsEngine({ hunger: 50, cleanliness: 40 });
    engine.feed(30);
    expect(engine.getNeeds().hunger).toBe(80);

    engine.feed(50);
    expect(engine.getNeeds().hunger).toBe(100); // clamped

    engine.clean();
    expect(engine.getNeeds().cleanliness).toBe(100);
  });

  it('applies gentle decay over elapsed time', () => {
    const engine = new NeedsEngine({ energy: 80, hunger: 80 });
    const initialTime = Date.now();
    // Simulate 60 minutes later
    const futureTime = initialTime + 60 * 60000;
    const decayed = engine.updateDecay(futureTime);

    expect(decayed.energy).toBeLessThan(80);
    expect(decayed.hunger).toBeLessThan(80);
    // Non-aggressive: must still be well above zero after 1 hour
    expect(decayed.energy).toBeGreaterThan(70);
  });
});
