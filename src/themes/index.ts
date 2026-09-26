import { ThemeConfig, ThemeId } from '../types';

export const THEMES: Record<ThemeId, ThemeConfig> = {
  'lulu-light': {
    id: 'lulu-light',
    name: 'Lulu Light',
    colors: {
      bg: '#F8FAFC',
      bgCard: '#FFFFFF',
      border: '#E2E8F0',
      text: '#0F172A',
      textMuted: '#64748B',
      primary: '#6366F1',
      primaryHover: '#4F46E5',
      accent: '#F59E0B',
      glow: '#EEF2FF',
      danger: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
    },
  },
  'lulu-dark': {
    id: 'lulu-dark',
    name: 'Lulu Dark',
    colors: {
      bg: '#0F172A',
      bgCard: '#1E293B',
      border: '#334155',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      primary: '#818CF8',
      primaryHover: '#6366F1',
      accent: '#FDE68A',
      glow: '#1E1B4B',
      danger: '#F87171',
      success: '#34D399',
      warning: '#FBBF24',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      bg: '#05050A',
      bgCard: '#0C0C17',
      border: '#1E1E38',
      text: '#E2E8F0',
      textMuted: '#71717A',
      primary: '#7C3AED',
      primaryHover: '#6D28D9',
      accent: '#C084FC',
      glow: '#140E2D',
      danger: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B',
    },
  },
  soft: {
    id: 'soft',
    name: 'Soft Pastels',
    colors: {
      bg: '#FAF5FF',
      bgCard: '#FFFFFF',
      border: '#F3E8FF',
      text: '#3B0764',
      textMuted: '#86198F',
      primary: '#C084FC',
      primaryHover: '#A855F7',
      accent: '#F472B6',
      glow: '#FDF4FF',
      danger: '#FB7185',
      success: '#4ADE80',
      warning: '#FBBF24',
    },
  },
  glass: {
    id: 'glass',
    name: 'Glass Frost',
    colors: {
      bg: 'rgba(15, 23, 42, 0.75)',
      bgCard: 'rgba(30, 41, 59, 0.65)',
      border: 'rgba(255, 255, 255, 0.15)',
      text: '#F8FAFC',
      textMuted: '#CBD5E1',
      primary: '#38BDF8',
      primaryHover: '#0284C7',
      accent: '#A5F3FC',
      glow: 'rgba(56, 189, 248, 0.2)',
      danger: '#F87171',
      success: '#34D399',
      warning: '#FBBF24',
    },
  },
  mono: {
    id: 'mono',
    name: 'Monochrome',
    colors: {
      bg: '#18181B',
      bgCard: '#27272A',
      border: '#3F3F46',
      text: '#FAFAFA',
      textMuted: '#A1A1AA',
      primary: '#E4E4E7',
      primaryHover: '#D4D4D8',
      accent: '#FFFFFF',
      glow: '#27272A',
      danger: '#EF4444',
      success: '#22C55E',
      warning: '#EAB308',
    },
  },
  forest: {
    id: 'forest',
    name: 'Deep Forest',
    colors: {
      bg: '#052E16',
      bgCard: '#14532D',
      border: '#166534',
      text: '#F0FDF4',
      textMuted: '#86EFAC',
      primary: '#10B981',
      primaryHover: '#059669',
      accent: '#FDE047',
      glow: '#064E3B',
      danger: '#F87171',
      success: '#34D399',
      warning: '#FBBF24',
    },
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Depths',
    colors: {
      bg: '#082F49',
      bgCard: '#0C4A6E',
      border: '#075985',
      text: '#F0F9FF',
      textMuted: '#7DD3FC',
      primary: '#0284C7',
      primaryHover: '#0369A1',
      accent: '#38BDF8',
      glow: '#0369A1',
      danger: '#F87171',
      success: '#34D399',
      warning: '#FBBF24',
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Glow',
    colors: {
      bg: '#2A0845',
      bgCard: '#4B1056',
      border: '#6B21A8',
      text: '#FFF1F2',
      textMuted: '#FDA4AF',
      primary: '#F43F5E',
      primaryHover: '#E11D48',
      accent: '#FB923C',
      glow: '#831843',
      danger: '#EF4444',
      success: '#10B981',
      warning: '#FBBF24',
    },
  },
  'high-contrast': {
    id: 'high-contrast',
    name: 'High Contrast (A11y)',
    colors: {
      bg: '#000000',
      bgCard: '#121212',
      border: '#FFFFFF',
      text: '#FFFFFF',
      textMuted: '#E0E0E0',
      primary: '#FFFF00',
      primaryHover: '#FACC15',
      accent: '#00FFFF',
      glow: '#333333',
      danger: '#FF3333',
      success: '#33FF33',
      warning: '#FFFF33',
    },
  },
  'anime-naruto': {
    id: 'anime-naruto',
    name: 'Anime Naruto (Konoha Orange 🍥)',
    colors: {
      bg: '#0A0E17',
      bgCard: '#131B2E',
      border: '#FF7A00',
      text: '#FFF8F0',
      textMuted: '#94A3B8',
      primary: '#FF7A00',
      primaryHover: '#E06A00',
      accent: '#00E5FF',
      glow: 'rgba(255, 122, 0, 0.35)',
      danger: '#EF4444',
      success: '#10B981',
      warning: '#FFB800',
    },
  },
};

export class ThemeEngine {
  public static applyTheme(themeId: ThemeId): void {
    const theme = THEMES[themeId] || THEMES['lulu-dark'];
    const root = document.documentElement;

    root.style.setProperty('--color-bg', theme.colors.bg);
    root.style.setProperty('--color-bg-card', theme.colors.bgCard);
    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-muted', theme.colors.textMuted);
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-hover', theme.colors.primaryHover);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-glow', theme.colors.glow);
    root.style.setProperty('--color-danger', theme.colors.danger);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-warning', theme.colors.warning);
  }
}
