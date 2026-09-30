export interface ThemeDefinition {
  id: string;
  name: string;
  bgPrimary: string;
  bgSecondary: string;
  accent: string;
  textColor: string;
  borderColor: string;
}

export const LULU_THEMES: Record<string, ThemeDefinition> = {
  'Lulu Dark': {
    id: 'lulu-dark',
    name: 'Lulu Dark',
    bgPrimary: '#14141e',
    bgSecondary: '#1e1e2e',
    accent: '#8b5cf6',
    textColor: '#e2e8f0',
    borderColor: '#313244',
  },
  'Lulu Light': {
    id: 'lulu-light',
    name: 'Lulu Light',
    bgPrimary: '#f8fafc',
    bgSecondary: '#ffffff',
    accent: '#6366f1',
    textColor: '#0f172a',
    borderColor: '#e2e8f0',
  },
  'Midnight': {
    id: 'midnight',
    name: 'Midnight',
    bgPrimary: '#090a0f',
    bgSecondary: '#10121a',
    accent: '#38bdf8',
    textColor: '#f1f5f9',
    borderColor: '#1e293b',
  },
  'Soft': {
    id: 'soft',
    name: 'Soft Pastel',
    bgPrimary: '#fdf4ff',
    bgSecondary: '#fae8ff',
    accent: '#d946ef',
    textColor: '#701a75',
    borderColor: '#f5d0fe',
  },
  'Glass': {
    id: 'glass',
    name: 'Glass Frost',
    bgPrimary: 'rgba(20, 20, 35, 0.85)',
    bgSecondary: 'rgba(30, 30, 50, 0.7)',
    accent: '#a855f7',
    textColor: '#f8fafc',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  'Mono': {
    id: 'mono',
    name: 'Monochrome',
    bgPrimary: '#18181b',
    bgSecondary: '#27272a',
    accent: '#e4e4e7',
    textColor: '#fafafa',
    borderColor: '#3f3f46',
  },
  'Forest': {
    id: 'forest',
    name: 'Emerald Forest',
    bgPrimary: '#052e16',
    bgSecondary: '#064e3b',
    accent: '#10b981',
    textColor: '#ecfdf5',
    borderColor: '#047857',
  },
  'Ocean': {
    id: 'ocean',
    name: 'Deep Ocean',
    bgPrimary: '#082f49',
    bgSecondary: '#0c4a6e',
    accent: '#0284c7',
    textColor: '#f0f9ff',
    borderColor: '#0369a1',
  },
  'Sunset': {
    id: 'sunset',
    name: 'Twilight Sunset',
    bgPrimary: '#451a03',
    bgSecondary: '#78350f',
    accent: '#f59e0b',
    textColor: '#fffbeb',
    borderColor: '#b45309',
  },
  'High Contrast': {
    id: 'high-contrast',
    name: 'High Contrast',
    bgPrimary: '#000000',
    bgSecondary: '#111111',
    accent: '#ffff00',
    textColor: '#ffffff',
    borderColor: '#ffffff',
  },
};
