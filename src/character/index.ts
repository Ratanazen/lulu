import { CharacterProfile } from '../types';

export const LULU_DEFAULT_CHARACTER: CharacterProfile = {
  id: 'lulu',
  character_id: 'LULU-0001',
  name: 'Lulu',
  displayName: 'Lulu',
  description: 'A curious celestial desktop companion with glowing starlight ears and an affectionate heart.',
  scenario: 'Lives on your desktop to accompany your workflow, play, and assist with tasks.',
  first_message: 'Hello! I am Lulu, your desktop companion. Ready to explore!',
  traits: ['friendly', 'curious', 'playful', 'celestial'],
  tags: ['original', 'desktop-pet', 'starter', 'mascot'],
  visibility: 'public',
  voice_provider: 'local_tts',
  temperature: 0.7,
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1.0,
  },
  collider: {
    width: 120,
    height: 120,
    depth: 40,
    centerX: 0,
    centerY: 0,
    centerZ: 0,
  },
  camera: {
    mode: 'close',
    distance: 2.5,
    fov: 45,
    target: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 2.5 },
    zoom: 1.0,
  },
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
  category: 'original',
  renderer: 'pixel',
  avatarUrl: '/characters/lulu-character.png',
  modelPath: '/characters/lulu-character.png',
  author: 'Lulu Core Team',
  version: '1.0.0',
};

export const KIRA_STAR_CHARACTER: CharacterProfile = {
  id: 'kira',
  character_id: 'LULU-0002',
  name: 'Kira',
  displayName: 'Kira',
  description: 'An energetic little star spirit who loves dashing across screens and cheering you on.',
  scenario: 'Bounces across active windows cheering you through productive coding and study sessions.',
  first_message: 'Kira is here! Let us do something super exciting today!',
  traits: ['energetic', 'playful', 'star-spirit'],
  tags: ['original', 'speedy', 'cheerful'],
  visibility: 'public',
  voice_provider: 'local_tts',
  temperature: 0.8,
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 0.9,
  },
  collider: {
    width: 100,
    height: 100,
    depth: 30,
    centerX: 0,
    centerY: 0,
    centerZ: 0,
  },
  camera: {
    mode: 'close',
    distance: 2.2,
    fov: 50,
    target: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 2.2 },
    zoom: 1.0,
  },
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
  category: 'original',
  author: 'Lulu Core Team',
  version: '1.0.0',
};

export const NORI_MOSS_CHARACTER: CharacterProfile = {
  id: 'nori',
  character_id: 'LULU-0003',
  name: 'Nori',
  displayName: 'Nori',
  description: 'A tranquil moss creature that moves gently, prefers quiet focus, and loves naps.',
  scenario: 'A cozy desktop pet that sits quietly beside your editor while you write code.',
  first_message: 'Zzz... Oh, hi there. Let us have a gentle, calm day.',
  traits: ['calm', 'peaceful', 'moss-spirit'],
  tags: ['original', 'tranquil', 'cozy'],
  visibility: 'public',
  voice_provider: 'local_tts',
  temperature: 0.5,
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1.1,
  },
  collider: {
    width: 130,
    height: 110,
    depth: 40,
    centerX: 0,
    centerY: 0,
    centerZ: 0,
  },
  camera: {
    mode: 'far',
    distance: 3.0,
    fov: 40,
    target: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 3.0 },
    zoom: 1.0,
  },
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
  category: 'original',
  author: 'Lulu Core Team',
  version: '1.0.0',
};

export const OFFICIAL_CHARACTERS: CharacterProfile[] = [
  LULU_DEFAULT_CHARACTER,
  KIRA_STAR_CHARACTER,
  NORI_MOSS_CHARACTER,
];
