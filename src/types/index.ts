// Domain Types for Lulu Desktop Companion

export interface Vector2D {
  x: number;
  y: number;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface MonitorInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleFactor: number;
  refreshRate?: number;
  primary: boolean;
  workAreaX: number;
  workAreaY: number;
  workAreaWidth: number;
  workAreaHeight: number;
}

// Personality & Needs
export interface PersonalityTraits {
  curiosity: number;    // 0-100
  friendliness: number; // 0-100
  playfulness: number;  // 0-100
  calmness: number;     // 0-100
  focus: number;        // 0-100
  energy: number;       // 0-100
  social: number;       // 0-100
  speakingStyle?: string;
  tone?: string;
  favoriteTopics?: string[];
  behaviorRules?: string[];
  greeting?: string;
  idleBehavior?: string;
}

export type MouthShape = 'closed' | 'small' | 'medium' | 'open' | 'smile';

export type CharacterRendererType = 'pixel' | 'skeletal_2d' | 'live2d' | 'three_vrm' | 'spritesheet' | 'image_avatar';

export interface SpriteSheetActionConfig {
  fileUrl: string;
  frameCount: number;
  fps: number;
  frameWidth: number;
  frameHeight: number;
  orientation?: 'horizontal' | 'vertical';
  loop?: boolean;
}

export interface CharacterSpriteSheetConfig {
  actions: Record<string, SpriteSheetActionConfig>;
  spriteSize?: { width: number; height: number };
  offset?: { x: number; y: number };
}

export interface CharacterPackManifest {
  id: string;
  name: string;
  type: 'original' | 'anime' | 'user' | 'imported';
  renderer: CharacterRendererType;
  version: string;
  author: string;
  description: string;
  license?: string;
  entryModel?: string;
  animations?: Record<string, string>;
  expressions?: Record<string, string>;
  audio?: Record<string, string>;
  voice?: Record<string, any>;
  permissions?: string[];
}

export interface NeedsState {
  energy: number;      // 0-100
  happiness: number;   // 0-100
  fun: number;         // 0-100
  attention: number;   // 0-100
  social: number;      // 0-100
  hunger: number;      // 0-100 (100 = full, 0 = starving)
  cleanliness: number; // 0-100
  health: number;      // 0-100
}

export type MoodType =
  | 'calm'
  | 'happy'
  | 'curious'
  | 'playful'
  | 'focused'
  | 'tired'
  | 'sleepy'
  | 'excited'
  | 'surprised'
  | 'worried'
  | 'sad'
  | 'angry'
  | 'loving'
  | 'dizzy'
  | 'meditative'
  | 'proud';

export interface LearnedPreferences {
  favoriteActivity: string;
  preferredActiveHours: 'morning' | 'afternoon' | 'evening' | 'night';
  totalInteractions: number;
  totalPats: number;
  totalGamesPlayed: number;
  lastActiveTimestamp: number;
  wakeCount: number;
}

// Movement
export type MovementMode =
  | 'idle'
  | 'walk'
  | 'run'
  | 'wander'
  | 'followCursor'
  | 'visitMonitor'
  | 'goHome'
  | 'paused';

export interface MovementConfig {
  walkSpeed: number;        // px/s
  runSpeed: number;         // px/s
  acceleration: number;     // px/s^2
  deceleration: number;     // px/s^2
  edgePadding: number;      // px
  idleProbability: number;  // 0-1
  explorationProbability: number; // 0-1
}

export interface MovementState {
  currentPosition: Vector2D;
  targetPosition: Vector2D | null;
  velocity: Vector2D;
  mode: MovementMode;
  facing: 'left' | 'right';
  targetMonitorId: string | null;
  isMoving: boolean;
}

// Animation
export type LoopMode = 'loop' | 'once' | 'ping-pong';

export type AnimationState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sit'
  | 'sleep'
  | 'wake'
  | 'curious'
  | 'happy'
  | 'sad'
  | 'surprised'
  | 'confused'
  | 'excited'
  | 'tired'
  | 'playful'
  | 'focus'
  | 'celebrate'
  | 'wave'
  | 'jump'
  | 'dance'
  | 'eat'
  | 'drink'
  | 'listen'
  | 'yawn'
  | 'read'
  | 'nod'
  | 'dizzy'
  | 'meditate'
  | 'pout';

export interface AnimationDefinition {
  id: AnimationState;
  frames: number;
  fps: number;
  loopMode: LoopMode;
  priority: number;
  interruptible: boolean;
  scale: number;
}

// Character Profile
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  shadow: string;
  glow: string;
}

export type CharacterVisibility = 'private' | 'local_only' | 'shared' | 'public';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface CharacterTransform {
  position: Vector3D;
  rotation: Vector3D;
  scale: number;
}

export interface CharacterCollider {
  width: number;
  height: number;
  depth: number;
  centerX: number;
  centerY: number;
  centerZ: number;
}

export interface CharacterCamera {
  mode: 'far' | 'close' | 'custom';
  distance: number;
  fov: number;
  target: Vector3D;
  position: Vector3D;
  zoom: number;
}

export interface CharacterProfile {
  id: string;
  character_id?: string; // Unique ID in format LULU-XXXX (e.g. LULU-0001)
  name?: string;
  displayName: string;
  description: string;
  personality: PersonalityTraits;
  scenario?: string;
  first_message?: string;
  traits?: string[];
  tags?: string[];
  voice?: string;
  language?: string;
  voice_provider?: 'piper' | 'espeak-ng' | 'local_tts' | 'mock';
  temperature?: number;
  scale: number;
  defaultPosition: Vector2D;
  palette: ColorPalette;
  unlocked: boolean;
  is_favorite?: boolean;
  aura?: string;
  accessories?: string[];
  renderer?: CharacterRendererType;
  avatarUrl?: string;
  modelPath?: string;
  spriteSheetConfig?: CharacterSpriteSheetConfig;
  category?: 'original' | 'anime' | 'user' | 'imported';
  visibility?: CharacterVisibility;
  transform?: CharacterTransform;
  collider?: CharacterCollider;
  camera?: CharacterCamera;
  expressions?: Record<string, string>;
  animations?: Record<string, any>;
  license?: string;
  author?: string;
  version?: string;
  outfit?: string;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}

// Behavior
export type BehaviorAction =
  | 'idle'
  | 'explore'
  | 'rest'
  | 'approachUser'
  | 'react'
  | 'play'
  | 'eat'
  | 'drink'
  | 'sleep'
  | 'celebrate'
  | 'focus'
  | 'musicMode'
  | 'returnHome'
  | 'yawn'
  | 'read'
  | 'meditate';

export type BehaviorMode =
  | 'CALM'
  | 'NORMAL'
  | 'PLAYFUL'
  | 'FOCUSED'
  | 'QUIET'
  | 'CUSTOM';

// Speech Bubble
export type SpeechCategory =
  | 'greeting'
  | 'idle'
  | 'success'
  | 'failure'
  | 'game'
  | 'music'
  | 'exploration'
  | 'encouragement'
  | 'sleep'
  | 'settings'
  | 'morning'
  | 'night'
  | 'study'
  | 'weather'
  | 'break';

export enum SpeechPriority {
  IDLE = 0,
  SYSTEM = 1,
  MUSIC = 2,
  USER_INTERACTION = 3,
  NOTIFICATION = 4,
  CRITICAL = 5,
}

export type SpeechBubbleState =
  | 'HIDDEN'
  | 'SHOWING'
  | 'TYPING'
  | 'VISIBLE'
  | 'PAUSED'
  | 'FADING'
  | 'QUEUED';

export interface SpeechMessage {
  id: string;
  text: string;
  mood: MoodType;
  priority: number;
  durationMs: number;
  category: SpeechCategory;
  dismissible: boolean;
  createdAt: number;
  pages?: string[];
  currentPage?: number;
}

// Games
export type GameId =
  | 'quick_click'
  | 'reaction'
  | 'memory'
  | 'catch'
  | 'dodge'
  | 'care'
  | 'exploration'
  | 'custom';

export type GameDifficulty = 'easy' | 'normal' | 'hard';

export interface GameScore {
  gameId: GameId;
  score: number;
  highScore: number;
  playedAt: string;
}

export interface GameMetadata {
  id: GameId;
  title: string;
  description: string;
  icon: string;
}

// Progression & Achievements
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface UserProgression {
  xp: number;
  level: number;
  stars: number;
  achievements: Record<string, Achievement>;
  lastDailyGreeting: string | null;
  lastDailyCare: string | null;
}

// Themes
export type ThemeId =
  | 'lulu-light'
  | 'lulu-dark'
  | 'midnight'
  | 'soft'
  | 'glass'
  | 'mono'
  | 'forest'
  | 'ocean'
  | 'sunset'
  | 'high-contrast'
  | 'anime-naruto'
  | 'madara-shinobi'
  | 'cyber-ninja'
  | 'dark-shinobi'
  | 'chakra-neon'
  | 'classic-lulu';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  colors: {
    bg: string;
    bgCard: string;
    border: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryHover: string;
    accent: string;
    glow: string;
    danger: string;
    success: string;
    warning: string;
  };
}

// Settings
export type PerformanceProfile =
  | 'AUTO'
  | 'LOW'
  | 'BALANCED'
  | 'HIGH'
  | 'MAX_FPS'
  | 'CUSTOM';

export interface LuluSettings {
  theme: ThemeId;
  characterId: string;
  characterScale: number;
  animationFps: number;
  renderFps: number;
  performanceProfile: PerformanceProfile;
  behaviorMode: BehaviorMode;
  alwaysOnTop: boolean;
  clickThrough: boolean;
  soundEnabled: boolean;
  masterVolume: number;
  characterVolume: number;
  gameVolume: number;
  speechBubblesEnabled: boolean;
  speechFrequency: 'low' | 'normal' | 'high';
  homeMonitorId: string | null;
  homeX: number;
  homeY: number;
  reducedMotion: boolean;
  musicReactionsEnabled: boolean;
  powerSavingEnabled: boolean;
  offlineMode: boolean;
}

// Diagnostics
export interface DiagnosticResult {
  name: string;
  category: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  suggestion?: string;
}

// System Metrics
export interface SystemMetrics {
  cpuUsage: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  memoryPercentage: number;
  processCount: number;
  uptimeSeconds: number;
  osName: string;
  osVersion: string;
  hostname: string;
}

export interface ProcessItem {
  pid: number;
  ppid: number | null;
  name: string;
  cpuUsage: number;
  memoryMb: number;
}

export interface GitRepoInfo {
  isRepo: boolean;
  branch: string;
  isClean: boolean;
  lastCommitHash: string;
  lastCommitMsg: string;
}

// Event Bus
export type LuluEventType =
  | 'USER_CLICKED'
  | 'USER_DRAGGED'
  | 'MONITOR_CHANGED'
  | 'MOVEMENT_STARTED'
  | 'MOVEMENT_FINISHED'
  | 'MOOD_CHANGED'
  | 'NEED_UPDATED'
  | 'ANIMATION_CHANGED'
  | 'GAME_STARTED'
  | 'GAME_FINISHED'
  | 'MUSIC_PLAYING'
  | 'MUSIC_PAUSED'
  | 'NOTIFICATION_CREATED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'SETTING_CHANGED'
  | 'PLUGIN_LOADED'
  | 'PLUGIN_UNLOADED'
  | 'PLUGIN_STATE_CHANGED'
  | 'ERROR';

export interface LuluEvent<T = any> {
  type: LuluEventType;
  source: string;
  timestamp: number;
  payload: T;
}
