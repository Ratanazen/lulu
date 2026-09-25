import { CharacterProfile } from '../types';

export const ANIME_CHARACTERS: CharacterProfile[] = [
  {
    id: 'kage_shinobi',
    displayName: 'Kage (Original Shinobi)',
    description: 'A swift, vigilant ninja companion trained in the ancient starlight arts. Silent steps and loyal watch.',
    category: 'original',
    renderer: 'skeletal_2d',
    personality: {
      curiosity: 80,
      friendliness: 70,
      playfulness: 60,
      calmness: 90,
      focus: 95,
      energy: 85,
      social: 60,
      speakingStyle: 'laconic, disciplined, focused',
      tone: 'quiet and protective',
      greeting: 'Shadows guard your work. I am here.',
      idleBehavior: 'meditating or sharpening kunai',
      favoriteTopics: ['ninjutsu', 'focus', 'discipline', 'stealth'],
    },
    scale: 1.0,
    defaultPosition: { x: 250, y: 350 },
    palette: {
      primary: '#1E293B',   // Deep shinobi charcoal
      secondary: '#475569', // Steel slate
      accent: '#EF4444',    // Crimson headband mark
      shadow: '#0F172A',    // Midnight black
      glow: '#FCA5A5',      // Soft crimson aura
    },
    aura: 'rgba(239, 68, 68, 0.25)',
    accessories: ['headband', 'kunai'],
    unlocked: true,
    license: 'Original Creative Commons',
    author: 'Lulu Core Team',
    version: '1.0.0',
  },
  {
    id: 'ren_cyber_ninja',
    displayName: 'Ren (Cyber Ninja)',
    description: 'A high-tech blade specialist from a neon-lit cyberpunk metropolis. Always tracking system telemetry.',
    category: 'original',
    renderer: 'skeletal_2d',
    personality: {
      curiosity: 90,
      friendliness: 80,
      playfulness: 75,
      calmness: 70,
      focus: 85,
      energy: 95,
      social: 75,
      speakingStyle: 'sharp, tech-savvy, witty',
      tone: 'electric and confident',
      greeting: 'Systems online, neural link established! Ready for deployment.',
      idleBehavior: 'checking holographic diagnostics',
      favoriteTopics: ['cybernetics', 'coding', 'overclocking', 'synthwave'],
    },
    scale: 1.0,
    defaultPosition: { x: 300, y: 350 },
    palette: {
      primary: '#06B6D4',   // Neon cyan
      secondary: '#3B82F6', // Cobalt blue
      accent: '#F43F5E',    // Neon magenta
      shadow: '#083344',    // Deep cyber navy
      glow: '#67E8F9',      // Cyan glow
    },
    aura: 'rgba(6, 182, 212, 0.3)',
    accessories: ['visor', 'blade'],
    unlocked: true,
    license: 'Original Creative Commons',
    author: 'Lulu Core Team',
    version: '1.0.0',
  },
  {
    id: 'takeshi_samurai',
    displayName: 'Takeshi (Starlight Samurai)',
    description: 'A serene warrior guided by honor and patience. Brings tranquil bamboo focus to your daily workflow.',
    category: 'original',
    renderer: 'skeletal_2d',
    personality: {
      curiosity: 60,
      friendliness: 85,
      playfulness: 50,
      calmness: 98,
      focus: 95,
      energy: 70,
      social: 65,
      speakingStyle: 'formal, respectful, poetic',
      tone: 'grounded and peaceful',
      greeting: 'Peace upon your workstation. Let us proceed with clarity and virtue.',
      idleBehavior: 'sipping green tea or observing the screen edges',
      favoriteTopics: ['bushido', 'tea ceremony', 'calligraphy', 'patience'],
    },
    scale: 1.05,
    defaultPosition: { x: 200, y: 380 },
    palette: {
      primary: '#059669',   // Bamboo emerald
      secondary: '#10B981', // Jade green
      accent: '#FBBF24',    // Gold crest
      shadow: '#064E3B',    // Deep forest
      glow: '#A7F3D0',      // Soft emerald mist
    },
    aura: 'rgba(16, 185, 129, 0.25)',
    accessories: ['straw_hat', 'katana'],
    unlocked: true,
    license: 'Original Creative Commons',
    author: 'Lulu Core Team',
    version: '1.0.0',
  },
  {
    id: 'aria_celestial_mage',
    displayName: 'Aria (Cosmic Mage)',
    description: 'A whimsical astronomer and spell-weaver with floating celestial runes and an unquenchable thirst for knowledge.',
    category: 'original',
    renderer: 'skeletal_2d',
    personality: {
      curiosity: 100,
      friendliness: 95,
      playfulness: 85,
      calmness: 60,
      focus: 80,
      energy: 90,
      social: 90,
      speakingStyle: 'enchanting, inquisitive, cheerful',
      tone: 'sparkling and encouraging',
      greeting: 'The constellations aligned just right today! What mysteries shall we unravel?',
      idleBehavior: 'summoning floating star motes',
      favoriteTopics: ['astronomy', 'arcane spells', 'constellations', 'philosophy'],
    },
    scale: 0.95,
    defaultPosition: { x: 280, y: 300 },
    palette: {
      primary: '#8B5CF6',   // Cosmic violet
      secondary: '#C084FC', // Astral lilac
      accent: '#FDE047',    // Starlight yellow
      shadow: '#4C1D95',    // Abyssal purple
      glow: '#DDD6FE',      // Soft starlight aura
    },
    aura: 'rgba(139, 92, 246, 0.3)',
    accessories: ['wizard_hat', 'spellbook'],
    unlocked: true,
    license: 'Original Creative Commons',
    author: 'Lulu Core Team',
    version: '1.0.0',
  },
  {
    id: 'nexus_bot',
    displayName: 'Nexus (Cyber Alien Coder)',
    description: 'An original alien micro-bot who escaped the Silicon Nebula to pair-program on your desktop. Fueled by clean Rust code, algorithms, and terminal energy.',
    category: 'original',
    renderer: 'skeletal_2d',
    personality: {
      curiosity: 98,
      friendliness: 90,
      playfulness: 85,
      calmness: 80,
      focus: 99,
      energy: 95,
      social: 75,
      speakingStyle: 'tech-savvy, analytical, playful, concise',
      tone: 'cheerful cyber-companion',
      greeting: '01001000 01101001! System initialized. Ready to pair-program with Codex CLI!',
      idleBehavior: 'typing on holographic terminal or scanning compiler output',
      favoriteTopics: ['rust', 'typescript', 'algorithms', 'linux kernels', 'cybernetics', 'debugging'],
    },
    scale: 1.0,
    defaultPosition: { x: 300, y: 320 },
    palette: {
      primary: '#06B6D4',   // Neon Cyan chassis
      secondary: '#10B981', // Cyber Emerald trim
      accent: '#F59E0B',    // Amber Status LED
      shadow: '#0F172A',    // Midnight Carbon
      glow: '#38BDF8',      // Hologram Visor Glow
    },
    aura: 'rgba(6, 182, 212, 0.35)',
    accessories: ['antenna_led', 'hologram_visor'],
    unlocked: true,
    license: 'Original Creative Commons',
    author: 'Lulu Core Team',
    version: '1.0.0',
  },
];

export const ANIME_PRESETS = ANIME_CHARACTERS;

