import { CharacterProfile } from '../types';

export const LULU_DEFAULT_CHARACTER: CharacterProfile = {
  id: 'lulu',
  displayName: 'Lulu',
  description: 'A curious celestial desktop companion with glowing starlight ears and an affectionate heart.',
  personality: {
    curiosity: 85,
    friendliness: 90,
    playfulness: 80,
    calmness: 65,
    focus: 60,
    energy: 75,
    social: 85,
  },
  scale: 1.0,
  defaultPosition: { x: 200, y: 300 },
  palette: {
    primary: '#818CF8',   // Indigo
    secondary: '#A5B4FC', // Light indigo
    accent: '#FDE68A',    // Starlight gold
    shadow: '#4338CA',    // Deep indigo
    glow: '#E0E7FF',      // Soft starlight white
  },
  unlocked: true,
};

export const KIRA_STAR_CHARACTER: CharacterProfile = {
  id: 'kira',
  displayName: 'Kira',
  description: 'An energetic little star spirit who loves dashing across screens and cheering you on.',
  personality: {
    curiosity: 95,
    friendliness: 80,
    playfulness: 95,
    calmness: 30,
    focus: 40,
    energy: 100,
    social: 75,
  },
  scale: 0.9,
  defaultPosition: { x: 300, y: 300 },
  palette: {
    primary: '#FBBF24',   // Amber
    secondary: '#FDE68A', // Warm gold
    accent: '#F472B6',    // Rose pink
    shadow: '#D97706',    // Dark amber
    glow: '#FFFBEB',      // Warm starlight
  },
  unlocked: true,
};

export const NORI_MOSS_CHARACTER: CharacterProfile = {
  id: 'nori',
  displayName: 'Nori',
  description: 'A tranquil moss creature that moves gently, prefers quiet focus, and loves naps.',
  personality: {
    curiosity: 50,
    friendliness: 85,
    playfulness: 40,
    calmness: 95,
    focus: 90,
    energy: 35,
    social: 50,
  },
  scale: 1.1,
  defaultPosition: { x: 150, y: 400 },
  palette: {
    primary: '#34D399',   // Emerald
    secondary: '#A7F3D0', // Mint
    accent: '#FBBF24',    // Blossom yellow
    shadow: '#059669',    // Forest green
    glow: '#ECFDF5',      // Soft mint
  },
  unlocked: true,
};

export const OFFICIAL_CHARACTERS: CharacterProfile[] = [
  LULU_DEFAULT_CHARACTER,
  KIRA_STAR_CHARACTER,
  NORI_MOSS_CHARACTER,
];
