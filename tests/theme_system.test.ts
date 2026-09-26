import { describe, it, expect } from 'vitest';
import { THEMES, ThemeEngine } from '../src/themes';
import { ThemeId } from '../src/types';

describe('Anime & Shinobi Theme Engine', () => {
  it('defines all required anime and ninja themes', () => {
    const requiredThemes: ThemeId[] = [
      'anime-naruto',
      'madara-shinobi',
      'cyber-ninja',
      'dark-shinobi',
      'chakra-neon',
      'classic-lulu',
    ];

    for (const themeId of requiredThemes) {
      const theme = THEMES[themeId];
      expect(theme).toBeDefined();
      expect(theme.name).toBeDefined();
      expect(theme.colors.bg).toBeDefined();
      expect(theme.colors.bgCard).toBeDefined();
      expect(theme.colors.primary).toBeDefined();
      expect(theme.colors.accent).toBeDefined();
      expect(theme.colors.glow).toBeDefined();
    }
  });

  it('applies --lulu-* CSS custom properties to document root', () => {
    ThemeEngine.applyTheme('madara-shinobi');
    const root = document.documentElement;

    expect(root.style.getPropertyValue('--lulu-bg')).toBe('#09090B');
    expect(root.style.getPropertyValue('--lulu-panel')).toBe('#18181B');
    expect(root.style.getPropertyValue('--lulu-border')).toBe('#E11D48');
    expect(root.style.getPropertyValue('--color-primary')).toBe('#E11D48');

    ThemeEngine.applyTheme('anime-naruto');
    expect(root.style.getPropertyValue('--lulu-bg')).toBe('#0A0E17');
    expect(root.style.getPropertyValue('--lulu-panel')).toBe('#131B2E');
    expect(root.style.getPropertyValue('--lulu-border')).toBe('#FF7A00');
    expect(root.style.getPropertyValue('--lulu-accent')).toBe('#00E5FF');
    expect(root.style.getPropertyValue('--color-primary')).toBe('#FF7A00');

    ThemeEngine.applyTheme('cyber-ninja');
    expect(root.style.getPropertyValue('--lulu-bg')).toBe('#0B0F14');
    expect(root.style.getPropertyValue('--lulu-border')).toBe('#00FF9D');

    ThemeEngine.applyTheme('dark-shinobi');
    expect(root.style.getPropertyValue('--lulu-border')).toBe('#DC2626');

    ThemeEngine.applyTheme('chakra-neon');
    expect(root.style.getPropertyValue('--lulu-border')).toBe('#00D2FF');
  });
});
