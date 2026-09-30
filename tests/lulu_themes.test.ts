import { describe, it, expect } from 'vitest';
import { LULU_THEMES } from '../src/themes';

describe('Lulu Themes Specification', () => {
  it('contains all 10 required original themes', () => {
    const requiredThemes = [
      'Lulu Light',
      'Lulu Dark',
      'Midnight',
      'Soft',
      'Glass',
      'Mono',
      'Forest',
      'Ocean',
      'Sunset',
      'High Contrast',
    ];

    for (const name of requiredThemes) {
      expect(LULU_THEMES[name]).toBeDefined();
      expect(LULU_THEMES[name].accent).toBeDefined();
      expect(LULU_THEMES[name].bgPrimary).toBeDefined();
    }
  });
});
