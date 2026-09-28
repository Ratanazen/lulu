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

export const NEKO_PET_CHARACTER: CharacterProfile = {
  id: 'neko',
  character_id: 'LULU-0004',
  name: 'Neko',
  displayName: 'Neko',
  description: 'A curious and agile cat spirit with perky ears that loves chasing cursor trails and watching you work.',
  scenario: 'A nimble feline desktop companion that watches your windows and purrs through busy workflows.',
  first_message: 'Nya! Neko is on duty to keep you company and curious today!',
  traits: ['curious', 'agile', 'playful', 'cat-spirit'],
  tags: ['pet', 'curious', 'cat', 'original'],
  visibility: 'public',
  voice_provider: 'local_tts',
  temperature: 0.8,
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 0.95,
  },
  collider: {
    width: 110,
    height: 115,
    depth: 35,
    centerX: 0,
    centerY: 0,
    centerZ: 0,
  },
  camera: {
    mode: 'close',
    distance: 2.3,
    fov: 45,
    target: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 2.3 },
    zoom: 1.0,
  },
  personality: {
    curiosity: 95,
    friendliness: 85,
    playfulness: 90,
    calmness: 50,
    focus: 65,
    energy: 85,
    social: 80,
  },
  scale: 0.95,
  defaultPosition: { x: 220, y: 320 },
  palette: {
    primary: '#F43F5E',   // Rose Coral
    secondary: '#FECDD3', // Soft Peach
    accent: '#FBBF24',    // Warm Amber
    shadow: '#BE123C',    // Crimson
    glow: '#FFF1F2',      // Soft Glow
  },
  unlocked: true,
  category: 'original',
  author: 'Lulu Core Team',
  version: '1.0.0',
};

export const ROBO_PET_CHARACTER: CharacterProfile = {
  id: 'robo',
  character_id: 'LULU-0005',
  name: 'Robo',
  displayName: 'Robo',
  description: 'A futuristic cybernetic companion droid equipped with system diagnostics, telemetry gauges, and tech tools.',
  scenario: 'A high-tech cyber droid companion assisting with system monitoring and coding tasks.',
  first_message: 'BEEP-BOOP! Systems online. Robo pet initialized for technical support!',
  traits: ['tech', 'analytical', 'efficient', 'cyber-droid'],
  tags: ['pet', 'tech', 'robot', 'original'],
  visibility: 'public',
  voice_provider: 'local_tts',
  temperature: 0.4,
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
    curiosity: 70,
    friendliness: 75,
    playfulness: 50,
    calmness: 90,
    focus: 95,
    energy: 80,
    social: 60,
  },
  scale: 1.0,
  defaultPosition: { x: 250, y: 280 },
  palette: {
    primary: '#06B6D4',   // Cyber Cyan
    secondary: '#67E8F9', // Neon Cyan
    accent: '#3B82F6',    // Electric Blue
    shadow: '#0E7490',    // Deep Teal
    glow: '#ECFEFF',      // Cyber Glow
  },
  unlocked: true,
  category: 'original',
  author: 'Lulu Core Team',
  version: '1.0.0',
};

export const MOCHI_PET_CHARACTER: CharacterProfile = {
  id: 'mochi',
  character_id: 'LULU-0006',
  name: 'Mochi',
  displayName: 'Mochi',
  description: 'A super soft, cuddly marshmallow fluff creature that brings warmth, sweet comfort, and stress relief.',
  scenario: 'A soft marshmallow creature that brings smiles, relaxation, and friendly cheer.',
  first_message: 'Squish! Mochi is here to give you warmth and sweet companion hugs!',
  traits: ['friendly', 'gentle', 'affectionate', 'cuddly'],
  tags: ['pet', 'friendly', 'marshmallow', 'original'],
  visibility: 'public',
  voice_provider: 'local_tts',
  temperature: 0.7,
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1.05,
  },
  collider: {
    width: 125,
    height: 110,
    depth: 40,
    centerX: 0,
    centerY: 0,
    centerZ: 0,
  },
  camera: {
    mode: 'close',
    distance: 2.4,
    fov: 45,
    target: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 2.4 },
    zoom: 1.0,
  },
  personality: {
    curiosity: 75,
    friendliness: 100,
    playfulness: 80,
    calmness: 85,
    focus: 60,
    energy: 65,
    social: 95,
  },
  scale: 1.05,
  defaultPosition: { x: 180, y: 350 },
  palette: {
    primary: '#EC4899',   // Sweet Rose
    secondary: '#FBCFE8', // Marshmallow Cream
    accent: '#FDE68A',    // Cream Gold
    shadow: '#BE185D',    // Deep Berry
    glow: '#FDF2F8',      // Warm Pink Glow
  },
  unlocked: true,
  category: 'original',
  author: 'Lulu Core Team',
  version: '1.0.0',
};

export const PIXEL_PET_CHARACTER: CharacterProfile = {
  id: 'pixel',
  character_id: 'LULU-0007',
  name: 'Pixel',
  displayName: 'Pixel',
  description: 'A retro 8-bit hacker companion that loves terminal sessions, green phosphor glow, and compiling clean code.',
  scenario: 'A retro 8-bit coding buddy that sits by your terminal, detects compile errors, and pairs on code.',
  first_message: '01001000 01101001! Pixel ready for coding. Let us write bug-free code together!',
  traits: ['coding', 'hacker', 'logic', 'developer'],
  tags: ['pet', 'coding', 'hacker', 'original'],
  visibility: 'public',
  voice_provider: 'local_tts',
  temperature: 0.6,
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 0.95,
  },
  collider: {
    width: 110,
    height: 110,
    depth: 35,
    centerX: 0,
    centerY: 0,
    centerZ: 0,
  },
  camera: {
    mode: 'close',
    distance: 2.3,
    fov: 48,
    target: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 2.3 },
    zoom: 1.0,
  },
  personality: {
    curiosity: 90,
    friendliness: 80,
    playfulness: 75,
    calmness: 70,
    focus: 98,
    energy: 80,
    social: 70,
  },
  scale: 0.95,
  defaultPosition: { x: 260, y: 310 },
  palette: {
    primary: '#10B981',   // Terminal Emerald
    secondary: '#6EE7B7', // Matrix Mint
    accent: '#F59E0B',    // Amber Prompt
    shadow: '#047857',    // Deep Terminal
    glow: '#ECFDF5',      // Phosphor Green
  },
  unlocked: true,
  category: 'original',
  author: 'Lulu Core Team',
  version: '1.0.0',
};

export const SPROUT_PET_CHARACTER: CharacterProfile = {
  id: 'sprout',
  character_id: 'LULU-0008',
  name: 'Sprout',
  displayName: 'Sprout',
  description: 'A peaceful botanical seedling spirit that encourages hydration, deep breaths, and tranquil work sessions.',
  scenario: 'A gentle leafy nature spirit that keeps your desktop calm, reminds you to hydrate, and radiates peace.',
  first_message: 'Rustle rustle... Sprout is awake! Remember to breathe deeply and drink water.',
  traits: ['nature', 'peaceful', 'botanical', 'wellness'],
  tags: ['pet', 'nature', 'botanical', 'original'],
  visibility: 'public',
  voice_provider: 'local_tts',
  temperature: 0.5,
  transform: {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1.0,
  },
  collider: {
    width: 115,
    height: 120,
    depth: 35,
    centerX: 0,
    centerY: 0,
    centerZ: 0,
  },
  camera: {
    mode: 'close',
    distance: 2.4,
    fov: 45,
    target: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 2.4 },
    zoom: 1.0,
  },
  personality: {
    curiosity: 65,
    friendliness: 90,
    playfulness: 60,
    calmness: 98,
    focus: 85,
    energy: 55,
    social: 75,
  },
  scale: 1.0,
  defaultPosition: { x: 190, y: 340 },
  palette: {
    primary: '#84CC16',   // Forest Lime
    secondary: '#D9F99D', // Botanical Sage
    accent: '#EAB308',    // Sunlight Gold
    shadow: '#4D7C0F',    // Moss Green
    glow: '#F7FEE7',      // Sunlit Leaf Glow
  },
  unlocked: true,
  category: 'original',
  author: 'Lulu Core Team',
  version: '1.0.0',
};

export const OFFICIAL_CHARACTERS: CharacterProfile[] = [
  LULU_DEFAULT_CHARACTER,
  NEKO_PET_CHARACTER,
  ROBO_PET_CHARACTER,
  MOCHI_PET_CHARACTER,
  PIXEL_PET_CHARACTER,
  SPROUT_PET_CHARACTER,
  KIRA_STAR_CHARACTER,
  NORI_MOSS_CHARACTER,
];
