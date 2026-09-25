import { describe, it, expect } from 'vitest';
import { GAME_CATALOG, createGameInstance } from '../src/games';

describe('Game Platform & Mini-Games', () => {
  it('contains all 8 official mini-games in the catalog', () => {
    expect(GAME_CATALOG.length).toBe(8);
    const ids = GAME_CATALOG.map((g) => g.id);
    expect(ids).toContain('quick_click');
    expect(ids).toContain('reaction');
    expect(ids).toContain('memory');
    expect(ids).toContain('catch');
    expect(ids).toContain('dodge');
    expect(ids).toContain('care');
    expect(ids).toContain('exploration');
    expect(ids).toContain('custom');
  });

  it('instantiates and initializes every game without crashing', () => {
    for (const meta of GAME_CATALOG) {
      const instance = createGameInstance(meta.id);
      expect(instance).toBeDefined();
      expect(instance.title).toBe(meta.title);

      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      instance.initialize(canvas);

      // Verify stats baseline
      const stats = instance.getStats();
      expect(stats.isGameOver).toBe(false);
      expect(stats.isPaused).toBe(false);

      // Verify update cycle
      instance.update(0.016);

      // Verify clean disposal
      instance.dispose();
    }
  });
});
