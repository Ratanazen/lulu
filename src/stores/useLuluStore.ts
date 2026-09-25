import { create } from 'zustand';
import {
  AnimationState,
  BehaviorMode,
  CharacterProfile,
  GameId,
  LearnedPreferences,
  LuluSettings,
  MonitorInfo,
  MoodType,
  NeedsState,
  SpeechMessage,
  SystemMetrics,
  ThemeId,
  UserProgression,
  Vector2D,
} from '../types';
import { LULU_DEFAULT_CHARACTER, OFFICIAL_CHARACTERS } from '../character';
import { characterManager } from '../character/CharacterManager';
import { DEFAULT_NEEDS, NeedsEngine } from '../behavior/needsEngine';
import { MoodEngine } from '../behavior/moodEngine';
import { BehaviorEngine } from '../behavior/behaviorEngine';
import { MovementEngine } from '../movement/movementEngine';
import { SpeechSystem } from '../interaction/speechSystem';
import { soundService } from '../services/soundService';
import { particleSystem } from '../animation/particleSystem';
import { eventBus } from '../services/eventBus';
import { AgentManager } from '../features/agents/AgentManager';
import { INITIAL_ACHIEVEMENTS, ProgressionEngine } from '../progression';
import { StreakTracker } from '../progression/streakTracker';
import { ThemeEngine } from '../themes';
import { DesktopWindowService } from '../services/desktopWindow';
import { StorageService, getAllSettings, setSettingsBulk } from '../services/storageService';
import { ChatMessage } from '../features/ai/types';
import { aiProviderManager } from '../features/ai/AIProviderManager';
import { memoryManager } from '../features/memory/MemoryManager';
import { personalityEngine } from '../features/personality/personalityEngine';
import { PersonalityArchetype, PersonalityProfile } from '../features/personality/types';
import { emotionEngine, EmotionMetrics, EmotionType } from '../features/emotion/emotionEngine';
import { voiceManager } from '../features/voice/VoiceManager';
import { VoiceState } from '../features/voice/types';
import { toolManager } from '../features/tools/ToolManager';
import { MediaStatus, MusicState } from '../features/music/types';
import { musicEngine } from '../features/music/MusicEngine';
import { lyricsSyncManager } from '../features/lyrics/LyricsSync';
import { notificationManager } from '../features/notifications/NotificationManager';
import { CapabilityService, RuntimeCapability, EffectiveCapability } from '../services/capabilityService';

export const DEFAULT_SETTINGS: LuluSettings = {
  theme: 'lulu-dark',
  characterId: 'lulu',
  characterScale: 1.0,
  animationFps: 60,
  renderFps: 60,
  performanceProfile: 'BALANCED',
  behaviorMode: 'NORMAL',
  alwaysOnTop: true,
  clickThrough: false,
  soundEnabled: true,
  masterVolume: 0.7,
  characterVolume: 0.8,
  gameVolume: 0.7,
  speechBubblesEnabled: true,
  speechFrequency: 'normal',
  homeMonitorId: null,
  homeX: 200,
  homeY: 300,
  reducedMotion: false,
  musicReactionsEnabled: true,
  powerSavingEnabled: true,
  offlineMode: true,
};

export const DEFAULT_PREFERENCES: LearnedPreferences = {
  favoriteActivity: 'idle',
  preferredActiveHours: 'afternoon',
  totalInteractions: 0,
  totalPats: 0,
  totalGamesPlayed: 0,
  lastActiveTimestamp: Date.now(),
  wakeCount: 1,
};

interface LuluStoreState {
  // Systems
  needsEngine: NeedsEngine;
  behaviorEngine: BehaviorEngine;
  movementEngine: MovementEngine;
  speechSystem: SpeechSystem;

  // State
  character: CharacterProfile;
  characters: CharacterProfile[];
  animationState: AnimationState;
  animationFrame: number;
  facing: 'left' | 'right';
  currentPosition: Vector2D;
  targetPosition: Vector2D | null;
  isMoving: boolean;
  needs: NeedsState;
  mood: MoodType;
  speechMessage: SpeechMessage | null;
  settings: LuluSettings;
  preferences: LearnedPreferences;
  progression: UserProgression;
  monitors: MonitorInfo[];
  systemMetrics: SystemMetrics | null;

  // UI Navigation
  controlCenterOpen: boolean;
  activeTab: string;
  activeGameId: GameId | null;
  onboardingCompleted: boolean;
  chatOpen: boolean;
  quickActionsOpen: boolean;

  // AI & Companionship
  chatMessages: ChatMessage[];
  isGeneratingResponse: boolean;
  personality: PersonalityProfile;
  emotionMetrics: EmotionMetrics;
  currentEmotion: EmotionType;
  voiceState: VoiceState;

  // Media, Lyrics & Notifications
  mediaStatus: MediaStatus;
  musicState: MusicState;
  currentLyric: string;
  nextLyric: string;
  notificationCount: number;

  // Machine-Readable Capabilities
  capabilities: RuntimeCapability[];
  refreshCapabilities: () => Promise<void>;
  isCapabilitySupported: (id: string) => boolean;
  getEffectiveCapability: (id: string, userEnabled?: boolean) => EffectiveCapability;

  // Actions
  initialize: () => Promise<void>;
  setAnimation: (state: AnimationState) => void;
  setFrame: (frame: number) => void;
  updateNeeds: () => void;
  feed: (amount?: number) => void;
  playGame: (funAmount?: number) => void;
  clean: () => void;
  sleep: () => void;
  interact: () => void;
  speak: (text?: string, category?: any) => void;
  dismissSpeech: () => void;
  moveTo: (target: Vector2D) => void;
  wander: () => void;
  goHome: () => void;
  perchOnTaskbar: () => void;
  dockToEdge: (side: 'left' | 'right' | 'top' | 'bottom') => void;
  sendToMonitor: (monitorId: string) => void;
  updateSettings: (newSettings: Partial<LuluSettings>) => void;
  updatePreferences: (patch: Partial<LearnedPreferences>) => void;
  updateCharacterCustomization: (patch: Partial<CharacterProfile>) => void;
  setTheme: (theme: ThemeId) => void;
  setCharacter: (id: string) => void;
  setControlCenterOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  setActiveGame: (gameId: GameId | null) => void;
  addXp: (amount: number) => void;
  spendStars: (amount: number) => boolean;
  progressAchievement: (id: string, delta?: number) => void;
  setMonitors: (mons: MonitorInfo[]) => void;
  setSystemMetrics: (metrics: SystemMetrics) => void;
  toggleClickThrough: () => void;
  completeOnboarding: () => void;

  // Chat & AI Actions
  setChatOpen: (open: boolean) => void;
  setQuickActionsOpen: (open: boolean) => void;
  setPersonality: (archetype: PersonalityArchetype) => void;
  sendChatMessage: (content: string) => Promise<void>;
  cancelGeneration: () => void;
  clearChat: () => void;
  patPet: () => void;
  syncAgentState: (agentState: 'thinking' | 'working' | 'waiting' | 'success' | 'error' | 'cancelled') => void;

  // Hydration & Persistence
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  persistState: () => void;
}

export const useLuluStore = create<LuluStoreState>((set, get) => {
  const needsEngine = new NeedsEngine();
  const behaviorEngine = new BehaviorEngine();
  const movementEngine = new MovementEngine();
  const speechSystem = new SpeechSystem();

  return {
    needsEngine,
    behaviorEngine,
    movementEngine,
    speechSystem,

    character: LULU_DEFAULT_CHARACTER,
    characters: characterManager.getRoster(),
    animationState: 'idle',
    animationFrame: 0,
    facing: 'right',
    currentPosition: { x: 200, y: 300 },
    targetPosition: null,
    isMoving: false,
    needs: DEFAULT_NEEDS,
    mood: 'calm',
    speechMessage: null,
    settings: DEFAULT_SETTINGS,
    preferences: DEFAULT_PREFERENCES,
    progression: {
      xp: 0,
      level: 1,
      stars: 10,
      achievements: { ...INITIAL_ACHIEVEMENTS },
      lastDailyGreeting: null,
      lastDailyCare: null,
    },
    monitors: [],
    systemMetrics: null,
    controlCenterOpen: false,
    activeTab: 'overview',
    activeGameId: null,
    onboardingCompleted: false,
    chatOpen: false,
    quickActionsOpen: false,
    chatMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hi there! I'm Lulu ✨ What are we working on together today?",
        timestamp: Date.now(),
      },
    ],
    isGeneratingResponse: false,
    personality: personalityEngine.getProfile(),
    emotionMetrics: emotionEngine.getMetrics(),
    currentEmotion: emotionEngine.getCurrentEmotion(),
    voiceState: voiceManager.getState(),

    // Media, Lyrics & Notifications initial state
    mediaStatus: musicEngine.getStatus(),
    musicState: musicEngine.getState(),
    currentLyric: '',
    nextLyric: '',
    notificationCount: 0,

    // Machine-Readable Capabilities
    capabilities: [],

    isHydrated: false,

    hydrate: async () => {
      const allSettings = await getAllSettings();
      const settingsMap = new Map(allSettings);

      const theme = settingsMap.get('theme') as ThemeId;
      if (theme) get().setTheme(theme);

      const activeCharacterId = settingsMap.get('activeCharacterId');
      if (activeCharacterId) get().setCharacter(activeCharacterId);

      const behaviorMode = settingsMap.get('behaviorMode') as BehaviorMode;
      if (behaviorMode) get().updateSettings({ behaviorMode });

      const performanceProfile = settingsMap.get('performanceProfile');
      if (performanceProfile) get().updateSettings({ performanceProfile: performanceProfile as any });

      const audioMutedStr = settingsMap.get('audioMuted');
      if (audioMutedStr) get().updateSettings({ soundEnabled: audioMutedStr !== 'true' });

      const alwaysOnTopStr = settingsMap.get('alwaysOnTop');
      if (alwaysOnTopStr) get().updateSettings({ alwaysOnTop: alwaysOnTopStr === 'true' });

      const onboardingCompletedStr = settingsMap.get('onboardingCompleted');
      if (onboardingCompletedStr === 'true') get().completeOnboarding();

      const petPositionStr = settingsMap.get('pet_position');
      if (petPositionStr) {
        try {
          const pos = JSON.parse(petPositionStr);
          if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
            set({ currentPosition: pos });
          }
        } catch {}
      }

      const needsStateStr = settingsMap.get('needs_state');
      if (needsStateStr) {
        try {
          const needsState = JSON.parse(needsStateStr);
          get().needsEngine.setNeeds(needsState);
          set({ needs: needsState });
        } catch {}
      }

      const progressionStr = settingsMap.get('progression_state');
      if (progressionStr) {
        try {
          const progState = JSON.parse(progressionStr);
          set({ progression: progState });
        } catch {}
      }

      set({ isHydrated: true });
    },

    persistState: () => {
      const state = get();
      const settingsToSave: [string, string][] = [
        ['theme', state.settings.theme],
        ['activeCharacterId', state.settings.characterId],
        ['behaviorMode', state.settings.behaviorMode],
        ['performanceProfile', state.settings.performanceProfile],
        ['audioMuted', String(!state.settings.soundEnabled)],
        ['alwaysOnTop', String(state.settings.alwaysOnTop)],
        ['onboardingCompleted', String(state.onboardingCompleted)],
        ['needs_state', JSON.stringify(state.needs)],
        ['progression_state', JSON.stringify(state.progression)],
        ['pet_position', JSON.stringify(state.currentPosition)],
      ];
      setSettingsBulk(settingsToSave);
    },

    initialize: async () => {
      // 1. Load settings & progression from SQLite storage
      const savedSettings = await StorageService.get<LuluSettings>('settings', DEFAULT_SETTINGS);
      const savedProg = await StorageService.get<UserProgression>('progression', {
        xp: 0,
        level: 1,
        stars: 10,
        achievements: { ...INITIAL_ACHIEVEMENTS },
        lastDailyGreeting: null,
        lastDailyCare: null,
      });
      const savedNeeds = await StorageService.get<NeedsState>('needs', DEFAULT_NEEDS);
      const savedPrefs = await StorageService.get<LearnedPreferences>('preferences', DEFAULT_PREFERENCES);
      const savedCustomChar = await StorageService.get<CharacterProfile | null>(
        `custom_character_${savedSettings.characterId}`,
        null
      );
      const onboardingDone = await StorageService.get<boolean>('onboarding_completed', false);

      // Apply initial theme
      ThemeEngine.applyTheme(savedSettings.theme);
      soundService.enabled = savedSettings.soundEnabled;
      soundService.masterVolume = savedSettings.masterVolume;
      soundService.characterVolume = savedSettings.characterVolume;

      needsEngine.setNeeds(savedNeeds);

      const loadedPrefs: LearnedPreferences = {
        ...DEFAULT_PREFERENCES,
        ...savedPrefs,
        wakeCount: (savedPrefs.wakeCount || 0) + 1,
        lastActiveTimestamp: Date.now(),
      };
      StorageService.set('preferences', loadedPrefs);

      set({
        settings: savedSettings,
        progression: savedProg,
        preferences: loadedPrefs,
        character: savedCustomChar || OFFICIAL_CHARACTERS.find((c) => c.id === savedSettings.characterId) || LULU_DEFAULT_CHARACTER,
        needs: needsEngine.getNeeds(),
        onboardingCompleted: onboardingDone,
      });

      // Hook up movement engine state updates
      movementEngine['onStateChange'] = (mState) => {
        set({
          currentPosition: mState.currentPosition,
          targetPosition: mState.targetPosition,
          facing: mState.facing,
          isMoving: mState.isMoving,
        });

        if (mState.isMoving) {
          const run = mState.mode === 'run';
          get().setAnimation(run ? 'run' : 'walk');
        } else if (get().animationState === 'walk' || get().animationState === 'run') {
          get().setAnimation('idle');
        }
      };

      // Initialize AI, Memory, Personality, and Voice
      await Promise.allSettled([
        aiProviderManager.loadSettings(),
        memoryManager.initialize(),
        personalityEngine.initialize(),
        voiceManager.initialize(),
      ]);

      voiceManager.onStateChange((vState) => {
        set({ voiceState: vState });
        if (vState.isListening) {
          get().setAnimation('listen');
        } else if (vState.isSpeaking) {
          get().setAnimation('wave');
        }
      });

      voiceManager.onTranscript((text) => {
        if (text.trim()) {
          get().sendChatMessage(text);
        }
      });

      set({
        personality: personalityEngine.getProfile(),
        emotionMetrics: emotionEngine.getMetrics(),
        currentEmotion: emotionEngine.getCurrentEmotion(),
        voiceState: voiceManager.getState(),
      });

      // Load Authoritative Runtime Capabilities
      const caps = await CapabilityService.getCapabilities();
      set({ capabilities: caps });

      // Feature-Gated Notification Listener
      const notifCap = caps.find((c) => c.id === 'notifications.dbus');
      if (CapabilityService.isFeatureUsable(notifCap, true)) {
        notificationManager.initialize((reaction) => {
          get().setAnimation('surprised');
          soundService.play('notification', 'notification');
          particleSystem.spawnSurprise(120, 100);
          get().speak(reaction, 'achievement');
          set({ notificationCount: get().notificationCount + 1 });
          setTimeout(() => {
            if (get().animationState === 'surprised') {
              get().setAnimation('happy');
              setTimeout(() => {
                if (get().animationState === 'happy') get().setAnimation('idle');
              }, 3000);
            }
          }, 2000);
        });
      }

      // Feature-Gated MPRIS Music Engine
      const mprisCap = caps.find((c) => c.id === 'music.mpris');
      if (CapabilityService.isFeatureUsable(mprisCap, true)) {
        musicEngine.start();
        musicEngine.onStatusChange((status, mState) => {
          set({ mediaStatus: status, musicState: mState });
          if (mState === 'MUSIC_PLAYING') {
            if (get().settings.musicReactionsEnabled) {
              get().setAnimation('dance');
              particleSystem.spawnMusicNotes(120, 120, 3);
            }
          } else if (mState === 'MUSIC_STOPPED' || mState === 'MUSIC_PAUSED') {
            if (get().animationState === 'dance') {
              get().setAnimation('idle');
            }
          }
        });
      }

      // Synchronized Lyrics listener
      lyricsSyncManager.onLyricChange((curr, next) => {
        set({
          currentLyric: curr?.text || '',
          nextLyric: next?.text || '',
        });
        if (curr && curr.text && get().musicState === 'MUSIC_PLAYING') {
          get().speak(`♪ ${curr.text}`, 'game');
          particleSystem.spawnMusicNotes(120, 120, 2);
        }
      });

      // Greeting speech
      setTimeout(() => {
        get().speak(undefined, 'greeting');
      }, 1000);

      await get().hydrate();

      // 8.4 Daily Streak Evaluation
      StreakTracker.checkAndUpdateStreak().then((streakRes) => {
        if (streakRes.isNewDay) {
          if (streakRes.bonusXp > 0) {
            get().addXp(streakRes.bonusXp);
          }
          if (streakRes.milestoneReached) {
            setTimeout(() => {
              get().speak(streakRes.milestoneReached!, 'success');
              particleSystem.spawnLevelUp(120, 120);
            }, 3000);
          }
        }
      }).catch((e) => console.warn('[StreakTracker] Failed to evaluate daily streak:', e));
    },

    setAnimation: (state: AnimationState) => {
      set({ animationState: state, animationFrame: 0 });
      eventBus.emit('ANIMATION_CHANGED', 'Character', { state });
    },

    setFrame: (frame: number) => {
      set({ animationFrame: frame });
    },

    updateNeeds: () => {
      const { needsEngine, character, mood, settings, behaviorEngine } = get();
      const updatedNeeds = needsEngine.updateDecay(Date.now(), character.personality);
      const nextMood = MoodEngine.calculateMood(updatedNeeds, character.personality);

      set({ needs: updatedNeeds, mood: nextMood });

      // Save to persistence periodically
      StorageService.set('needs', updatedNeeds);

      // Evaluate autonomous behavior if not currently player-controlled
      if (!get().isMoving && get().animationState === 'idle') {
        const nextAction = behaviorEngine.evaluateNextAction(
          updatedNeeds,
          character.personality,
          nextMood,
          settings.behaviorMode
        );

        if (nextAction === 'explore') {
          get().wander();
        } else if (nextAction === 'sleep') {
          get().sleep();
        } else if (nextAction === 'yawn') {
          get().setAnimation('yawn');
          soundService.play('purr', 'character');
          setTimeout(() => {
            if (get().animationState === 'yawn') get().setAnimation('idle');
          }, 2400);
        } else if (nextAction === 'read') {
          get().setAnimation('read');
          setTimeout(() => {
            if (get().animationState === 'read') get().setAnimation('idle');
          }, 3600);
        } else if (nextAction === 'meditate') {
          get().setAnimation('meditate');
          soundService.play('purr', 'character');
          setTimeout(() => {
            if (get().animationState === 'meditate') get().setAnimation('idle');
          }, 4000);
        } else if (nextAction === 'react' && settings.speechBubblesEnabled) {
          if (get().speechSystem.shouldSpeakSpontaneously(Date.now(), settings.speechFrequency)) {
            const cat = get().speechSystem.getSuggestedSpontaneousCategory();
            get().speak(undefined, cat);
          }
        }
      }
    },

    feed: (amount = 25) => {
      const { needsEngine, character } = get();
      needsEngine.feed(amount);
      const needs = needsEngine.getNeeds();
      const mood = MoodEngine.calculateMood(needs, character.personality);
      set({ needs, mood });
      get().setAnimation('eat');
      soundService.play('feed', 'character');
      particleSystem.spawnHeart(120, 120);
      get().addXp(20);
      get().progressAchievement('caring_friend', 1);
      setTimeout(() => get().setAnimation('idle'), 2000);
    },

    playGame: (funAmount = 30) => {
      const { needsEngine, character, preferences } = get();
      needsEngine.play(funAmount);
      const needs = needsEngine.getNeeds();
      const mood = MoodEngine.calculateMood(needs, character.personality);

      const updatedPrefs: LearnedPreferences = {
        ...preferences,
        totalGamesPlayed: preferences.totalGamesPlayed + 1,
        lastActiveTimestamp: Date.now(),
      };

      set({ needs, mood, preferences: updatedPrefs });
      StorageService.set('preferences', updatedPrefs);

      get().setAnimation('playful');
      soundService.play('jump', 'character');
      particleSystem.spawnSparkles(120, 120, '#FBBF24', 8);
      get().addXp(35);
      get().progressAchievement('caring_friend', 1);
      setTimeout(() => get().setAnimation('idle'), 2500);
    },

    clean: () => {
      const { needsEngine, character } = get();
      needsEngine.clean();
      const needs = needsEngine.getNeeds();
      const mood = MoodEngine.calculateMood(needs, character.personality);
      set({ needs, mood });
      get().setAnimation('happy');
      soundService.play('chirp', 'character');
      particleSystem.spawnSparkles(120, 120, '#93C5FD', 8);
      get().addXp(15);
      get().progressAchievement('caring_friend', 1);
      setTimeout(() => get().setAnimation('idle'), 2000);
    },

    sleep: () => {
      const { needsEngine, character } = get();
      needsEngine.sleep();
      const needs = needsEngine.getNeeds();
      const mood = MoodEngine.calculateMood(needs, character.personality);
      set({ needs, mood });
      get().setAnimation('sleep');
      soundService.play('lullaby', 'character');
      particleSystem.spawnSleepZzz(120, 110);
      get().addXp(15);
      get().progressAchievement('caring_friend', 1);
    },

    interact: () => {
      const { needsEngine, character, preferences } = get();
      needsEngine.interact();
      const needs = needsEngine.getNeeds();
      const mood = MoodEngine.calculateMood(needs, character.personality);

      // Circadian active hour tracking
      const curHour = new Date().getHours();
      const activeSlot: LearnedPreferences['preferredActiveHours'] =
        curHour >= 5 && curHour < 12
          ? 'morning'
          : curHour >= 12 && curHour < 17
          ? 'afternoon'
          : curHour >= 17 && curHour < 22
          ? 'evening'
          : 'night';

      const updatedPrefs: LearnedPreferences = {
        ...preferences,
        totalInteractions: preferences.totalInteractions + 1,
        totalPats: preferences.totalPats + 1,
        lastActiveTimestamp: Date.now(),
        preferredActiveHours: activeSlot,
      };

      set({ needs, mood, preferences: updatedPrefs });
      StorageService.set('preferences', updatedPrefs);

      const playfulAnimations: AnimationState[] = ['happy', 'wave', 'jump', 'curious', 'nod'];
      const chosen = playfulAnimations[Math.floor(Math.random() * playfulAnimations.length)];
      get().setAnimation(chosen);

      soundService.play(chosen === 'jump' ? 'jump' : 'chirp', 'character');
      get().addXp(10);
      get().progressAchievement('friendly_visitor', 1);

      if (get().settings.speechBubblesEnabled && Math.random() > 0.4) {
        get().speak();
      }

      setTimeout(() => {
        if (get().animationState === chosen) {
          get().setAnimation('idle');
        }
      }, 2200);
    },

    speak: (text?: string, category: any = 'idle') => {
      const { speechSystem, mood } = get();
      if (!get().settings.speechBubblesEnabled) return;

      const msg = text
        ? {
            id: `msg_${Date.now()}`,
            text,
            mood,
            priority: 2,
            durationMs: 4000,
            category: 'idle' as const,
            dismissible: true,
            createdAt: Date.now(),
          }
        : speechSystem.getRandomMessage(category, mood);

      speechSystem.setMessage(msg, () => {
        set({ speechMessage: null });
      });

      set({ speechMessage: msg });
      soundService.play('notification', 'character');
    },

    dismissSpeech: () => {
      get().speechSystem.dismiss();
      set({ speechMessage: null });
    },

    moveTo: (target: Vector2D) => {
      get().movementEngine.walkTo(target);
      get().progressAchievement('explorer', 1);
    },

    wander: () => {
      get().movementEngine.wander();
      get().progressAchievement('explorer', 1);
    },

    goHome: () => {
      const { settings, movementEngine } = get();
      movementEngine.goHome({ x: settings.homeX, y: settings.homeY });
    },

    perchOnTaskbar: () => {
      get().movementEngine.perchOnTaskbar();
      get().speak("Perched cozily on the bottom bar! ✨");
    },

    dockToEdge: (side: 'left' | 'right' | 'top' | 'bottom') => {
      get().movementEngine.dockToEdge(side);
      get().speak(`Docking to the ${side} edge! ✨`);
    },

    sendToMonitor: (monitorId: string) => {
      get().movementEngine.sendToMonitor(monitorId);
      const mon = get().monitors.find((m) => m.id === monitorId);
      get().speak(`Leaping over to ${mon?.name || 'new monitor'}! 🚀`);
    },

    updateSettings: (newSettings: Partial<LuluSettings>) => {
      const updated = { ...get().settings, ...newSettings };
      set({ settings: updated });
      StorageService.set('settings', updated);

      if (newSettings.theme) {
        ThemeEngine.applyTheme(newSettings.theme);
      }
      if (newSettings.soundEnabled !== undefined) {
        soundService.enabled = newSettings.soundEnabled;
      }
      if (newSettings.masterVolume !== undefined) {
        soundService.masterVolume = newSettings.masterVolume;
      }
      if (newSettings.alwaysOnTop !== undefined) {
        DesktopWindowService.setAlwaysOnTop(newSettings.alwaysOnTop);
      }
      if (newSettings.clickThrough !== undefined) {
        DesktopWindowService.setClickThrough(newSettings.clickThrough);
      }
    },

    updatePreferences: (patch: Partial<LearnedPreferences>) => {
      const updated = { ...get().preferences, ...patch };
      set({ preferences: updated });
      StorageService.set('preferences', updated);
    },

    updateCharacterCustomization: (patch: Partial<CharacterProfile>) => {
      const current = get().character;
      const updated = { ...current, ...patch };
      set({ character: updated });
      StorageService.set(`custom_character_${updated.id}`, updated);
    },

    setTheme: (theme: ThemeId) => {
      get().updateSettings({ theme });
    },

    setCharacter: (id: string) => {
      const roster = characterManager.getRoster();
      const found = roster.find((c) => c.id === id || c.character_id === id) ||
                    OFFICIAL_CHARACTERS.find((c) => c.id === id) ||
                    LULU_DEFAULT_CHARACTER;
      set({ character: found, characters: roster });
      characterManager.setActiveCharacter(found);
      get().updateSettings({ characterId: found.id });
    },

    syncAgentState: (agentState: 'thinking' | 'working' | 'waiting' | 'success' | 'error' | 'cancelled') => {
      switch (agentState) {
        case 'thinking':
          get().setAnimation('curious');
          set({ mood: 'curious' });
          break;
        case 'working':
          get().setAnimation('read');
          set({ mood: 'focused' });
          break;
        case 'waiting':
          get().setAnimation('idle');
          set({ mood: 'playful' });
          break;
        case 'success':
          get().setAnimation('celebrate');
          set({ mood: 'excited' });
          break;
        case 'error':
          get().setAnimation('dizzy');
          set({ mood: 'tired' });
          break;
        case 'cancelled':
          get().setAnimation('sit');
          set({ mood: 'calm' });
          break;
      }
    },

    setControlCenterOpen: (open: boolean) => {
      set({ controlCenterOpen: open });
      soundService.play('click', 'ui');
    },

    setActiveTab: (tab: string) => {
      set({ activeTab: tab });
      soundService.play('click', 'ui');
    },

    setActiveGame: (gameId: GameId | null) => {
      set({ activeGameId: gameId });
      if (gameId) {
        get().progressAchievement('first_game', 1);
        soundService.play('jump', 'game');
      }
    },

    addXp: (amount: number) => {
      const { progression } = get();
      const { updated, leveledUp } = ProgressionEngine.addXp(progression, amount);
      set({ progression: updated });
      StorageService.set('progression', updated);

      if (leveledUp) {
        soundService.play('level_up', 'ui');
        particleSystem.spawnLevelUp(120, 120);
        get().speak(`Level Up! Reached Level ${updated.level}! ✨`, 'success');
      }
    },

    spendStars: (amount: number) => {
      const { progression } = get();
      if (progression.stars < amount) return false;
      const updated = { ...progression, stars: progression.stars - amount };
      set({ progression: updated });
      StorageService.set('progression', updated);
      soundService.play('achievement', 'ui');
      return true;
    },

    progressAchievement: (id: string, delta = 1) => {
      const { progression } = get();
      const { updated, justUnlocked } = ProgressionEngine.updateAchievement(progression, id, delta);
      set({ progression: updated });
      StorageService.set('progression', updated);

      if (justUnlocked) {
        soundService.play('achievement', 'ui');
        particleSystem.spawnConfetti(120, 120, 25);
        const ach = updated.achievements[id];
        get().speak(`Achievement Unlocked: ${ach.title}! 🏆`, 'success');
        eventBus.emit('ACHIEVEMENT_UNLOCKED', 'Progression', { achievement: ach });
        get().setAnimation('celebrate');
      }
    },

    setMonitors: (mons: MonitorInfo[]) => {
      set({ monitors: mons });
      get().movementEngine.setMonitors(mons);
    },

    setSystemMetrics: (metrics: SystemMetrics) => {
      set({ systemMetrics: metrics });
    },

    toggleClickThrough: () => {
      const current = get().settings.clickThrough;
      get().updateSettings({ clickThrough: !current });
    },

    completeOnboarding: () => {
      set({ onboardingCompleted: true });
      StorageService.set('onboarding_completed', true);
    },

    setChatOpen: (open: boolean) => {
      set({ chatOpen: open });
      if (open) {
        soundService.play('chirp', 'ui');
      }
    },

    setQuickActionsOpen: (open: boolean) => {
      set({ quickActionsOpen: open });
      if (open) {
        soundService.play('click', 'ui');
      }
    },

    setPersonality: (archetype: PersonalityArchetype) => {
      personalityEngine.setActiveArchetype(archetype);
      set({ personality: personalityEngine.getProfile(archetype) });
      soundService.play('achievement', 'ui');
      get().speak(`Personality switched to ${personalityEngine.getProfile(archetype).name}! ✨`, 'settings');
    },

    patPet: () => {
      const em = emotionEngine.onUserPat();
      set({
        emotionMetrics: emotionEngine.getMetrics(),
        currentEmotion: em,
        mood: emotionEngine.getMoodType(),
      });
      get().setAnimation(emotionEngine.getSuggestedAnimation());
      soundService.play('happy', 'character');
      get().addXp(5);
      get().progressAchievement('pat_companion', 1);
    },

    cancelGeneration: () => {
      set({ isGeneratingResponse: false });
    },

    clearChat: () => {
      set({
        chatMessages: [
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: "Conversation history cleared! Ready for a fresh start ✨",
            timestamp: Date.now(),
          },
        ],
      });
      soundService.play('click', 'ui');
    },

    sendChatMessage: async (content: string) => {
      if (!content.trim()) return;

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      const asstId = `asst-${Date.now()}`;
      const asstPlaceholder: ChatMessage = {
        id: asstId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      set((s) => ({
        chatMessages: [...s.chatMessages, userMsg, asstPlaceholder],
        isGeneratingResponse: true,
        animationState: 'listen',
      }));

      soundService.play('click', 'ui');

      // Animate thinking
      setTimeout(() => {
        if (get().isGeneratingResponse) {
          get().setAnimation('curious');
        }
      }, 350);

      // Tool command shortcut checks
      const trimmed = content.trim();
      if (trimmed.startsWith('/calc ') || trimmed.startsWith('calc:')) {
        const expr = trimmed.replace(/^\/calc\s+|^calc:\s*/i, '');
        const res = await toolManager.execute('calculator', { expression: expr });
        set((s) => ({
          isGeneratingResponse: false,
          chatMessages: s.chatMessages.map((m) =>
            m.id === asstId ? { ...m, content: res.displayMessage } : m
          ),
          animationState: 'happy',
        }));
        get().speak(res.displayMessage, 'success');
        return;
      }

      if (trimmed.startsWith('/timer ') || trimmed.startsWith('timer:')) {
        const parts = trimmed.replace(/^\/timer\s+|^timer:\s*/i, '').split(' ');
        const mins = Number(parts[0]) || 25;
        const label = parts.slice(1).join(' ') || 'Focus Session';
        const res = await toolManager.execute('timer', { minutes: mins, label });
        set((s) => ({
          isGeneratingResponse: false,
          chatMessages: s.chatMessages.map((m) =>
            m.id === asstId ? { ...m, content: res.displayMessage } : m
          ),
          animationState: 'focus',
        }));
        get().speak(res.displayMessage, 'success');
        return;
      }

      if (trimmed.startsWith('/note ') || trimmed.startsWith('note:')) {
        const noteText = trimmed.replace(/^\/note\s+|^note:\s*/i, '');
        const res = await toolManager.execute('notes', { title: 'Quick Note', content: noteText });
        set((s) => ({
          isGeneratingResponse: false,
          chatMessages: s.chatMessages.map((m) =>
            m.id === asstId ? { ...m, content: res.displayMessage } : m
          ),
          animationState: 'celebrate',
        }));
        get().speak(res.displayMessage, 'success');
        return;
      }

      if (trimmed.startsWith('/search ') || trimmed.startsWith('search:')) {
        const query = trimmed.replace(/^\/search\s+|^search:\s*/i, '');
        const matches = memoryManager.search(query);
        let reply = '';
        if (matches.length === 0) {
          reply = `🔍 No memories found matching "${query}".`;
        } else {
          reply = `🔍 Found ${matches.length} memory result(s) for "${query}":\n\n` +
            matches.map((m, i) => `${i + 1}. **${m.key}** [${m.category}]: ${m.value}`).join('\n');
        }
        set((s) => ({
          isGeneratingResponse: false,
          chatMessages: s.chatMessages.map((m) =>
            m.id === asstId ? { ...m, content: reply } : m
          ),
          animationState: 'curious',
        }));
        soundService.play('chat_receive', 'ui');
        return;
      }

      if (trimmed.startsWith('/agent ') || trimmed.startsWith('agent:')) {
        const agentPrompt = trimmed.replace(/^\/agent\s+|^agent:\s*/i, '');
        const manager = AgentManager.getInstance();
        const task = manager.createTask(agentPrompt);
        set((s) => ({
          chatMessages: s.chatMessages.map((m) =>
            m.id === asstId ? { ...m, content: `🤖 **Task Queued** [${task.id}]\nAssigned Agent: **${task.agentId}**\n*Executing task...*` } : m
          ),
          animationState: 'read',
        }));

        try {
          const executed = await manager.executeTask(task.id, aiProviderManager);
          const resultText = `✅ **Agent Task Completed** [${executed.id}]\nAgent: **${executed.agentId}**\n\n${executed.steps.map(st => `• **${st.title}**: ${st.status === 'completed' ? 'Done' : st.status}`).join('\n')}`;
          set((s) => ({
            isGeneratingResponse: false,
            chatMessages: s.chatMessages.map((m) =>
              m.id === asstId ? { ...m, content: resultText } : m
            ),
            animationState: 'celebrate',
          }));
          soundService.play('achievement', 'ui');
        } catch (err: any) {
          set((s) => ({
            isGeneratingResponse: false,
            chatMessages: s.chatMessages.map((m) =>
              m.id === asstId ? { ...m, content: `❌ **Agent Error**: ${err.message}` } : m
            ),
            animationState: 'dizzy',
          }));
          soundService.play('error', 'ui');
        }
        return;
      }

      // Standard LLM Stream Request
      try {
        const memoryContext = memoryManager.buildMemoryPromptContext();
        const systemPrompt = personalityEngine.assembleSystemPrompt(
          memoryContext,
          emotionEngine.getCurrentEmotion()
        );

        let streamAcc = '';
        
        const stream = aiProviderManager.chatStream({
          messages: get().chatMessages.slice(0, -1),
          systemPrompt,
        });

        for await (const token of stream) {
          streamAcc += token;
          set((s) => ({
            chatMessages: s.chatMessages.map((m) =>
              m.id === asstId ? { ...m, content: streamAcc } : m
            ),
            animationState: 'wave',
          }));
        }

        set((s) => ({
          isGeneratingResponse: false,
          chatMessages: s.chatMessages.map((m) =>
            m.id === asstId ? { ...m, content: streamAcc } : m
          ),
          animationState: 'happy',
        }));

        soundService.play('chat_receive', 'ui');
        emotionEngine.onChatResponse();
        get().progressAchievement('first_chat', 1);

        if (voiceManager.getSettings().autoSpeak) {
          voiceManager.speak(streamAcc);
        }
      } catch (err: any) {
        set((s) => ({
          isGeneratingResponse: false,
          chatMessages: s.chatMessages.map((m) =>
            m.id === asstId ? { ...m, content: `⚠️ Error: ${err.message}` } : m
          ),
          animationState: 'confused',
        }));
        emotionEngine.onError();
      }
    },

    refreshCapabilities: async () => {
      const caps = await CapabilityService.getCapabilities();
      set({ capabilities: caps });
    },

    isCapabilitySupported: (id: string) => {
      const cap = get().capabilities.find((c) => c.id === id);
      return cap ? cap.status === 'supported' || cap.status === 'partial' : false;
    },

    getEffectiveCapability: (id: string, userEnabled: boolean = true) => {
      const cap = get().capabilities.find((c) => c.id === id);
      if (!cap) {
        return {
          capability: id,
          availability: 'unsupported' as const,
          userEnabled,
          effectiveState: 'unavailable' as const,
          fallback: 'disabled',
          reason: 'Capability not recognized in registry',
        };
      }
      return CapabilityService.computeEffectiveState(cap, userEnabled);
    },
  };
});

let saveTimeout: any = null;
useLuluStore.subscribe((state) => {
  if (!state.isHydrated) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    state.persistState();
  }, 2000);
});
