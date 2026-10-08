import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LuluSprite } from '../character/LuluSprite';
import { SpeechBubble } from '../components/pet/SpeechBubble';
import { ControlCenterModal } from '../components/control-center/ControlCenterModal';
import { MovementEngine } from '../movement/MovementEngine';
import { NeedSystem } from '../behavior/NeedSystem';
import { MoodSystem } from '../behavior/MoodSystem';
import { BehaviorEngine } from '../behavior/BehaviorEngine';
import { invokeCommand, listenEvent } from '../services/tauriBridge';
import { messageManager } from '../services/messageManager';
import { eventBus } from '../services/eventBus';
import {
  AnimationState,
  MoodType,
  PetNeeds,
  PetPreferences,
  NativeMonitorInfo,
  SystemTelemetry,
} from '../types/pet';
import {
  Heart,
  Coffee,
  Moon,
  Settings,
  Sparkles,
  Footprints,
  Music,
  Bell,
  Compass,
  Zap,
  FileText,
  Play,
  Pause,
  PawPrint,
  Youtube,
  Radio,
  Headphones,
  Flame,
  MessageSquare,
  Sliders,
  LogOut,
  ChevronDown,
  ChevronUp,
  ListMusic,
  Cpu,
  Armchair,
  ArrowUpDown,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';
import { spotifyLyricsService } from '../features/lyrics/spotifyLyricsService';
import { ParsedLrc } from '../features/lyrics/lrcParser';
import { lyricsSyncEngine, parsedLrcToMs } from '../features/lyrics/lyricsSyncEngine';
import { MediaSession, normalizeMediaSession, getProviderTheme } from '../features/media/mediaSession';
import { LULU_TASKS, LULU_FLAME_STYLES } from '../config/luluFlameConfig';
import { audioReactiveEngine, AudioReactiveState } from '../features/audio/AudioReactiveEngine';
import { AudioVisualizer } from '../components/audio/AudioVisualizer';
import { questProgressionEngine } from '../features/progression/QuestProgressionEngine';
import { BoundaryPhysicsMode } from '../movement/MovementEngine';
import { soundFxEngine } from '../features/audio/SoundFxEngine';
import { useSystemStore } from '../stores/useSystemStore';
import { ComprehensiveSystemInfo } from '../types/system';

const renderProviderIcon = (iconType: string, size = 12) => {
  switch (iconType) {
    case 'spotify':
      return <Music size={size} className="text-emerald-400" />;
    case 'youtube':
      return <Youtube size={size} className="text-red-400" />;
    case 'youtube_music':
      return <Radio size={size} className="text-rose-400" />;
    case 'mpris':
      return <Headphones size={size} className="text-indigo-400" />;
    default:
      return <Music size={size} className="text-purple-400" />;
  }
};

export const App: React.FC = () => {
  const [animation, setAnimation] = useState<AnimationState>('idle');
  const [mood, setMood] = useState<MoodType>('calm');
  const [needs, setNeeds] = useState<PetNeeds>({ energy: 100, happiness: 90, fun: 85 });
  const [isSleeping, setIsSleeping] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 });
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
  const [showLoveHearts, setShowLoveHearts] = useState(false);
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 });
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [movementPaused, setMovementPaused] = useState(false);
  const [isFollowingCursor, setIsFollowingCursor] = useState(false);
  const [isContinuousRunning, setIsContinuousRunning] = useState(false);
  const [isContinuousWalking, setIsContinuousWalking] = useState(false);
  const [is40sRunActive, setIs40sRunActive] = useState(false);
  const [spotifyLyrics, setSpotifyLyrics] = useState<ParsedLrc | null>(null);
  const [prevLyricText, setPrevLyricText] = useState<string | null>(null);
  const [activeLyricText, setActiveLyricText] = useState<string | null>(null);
  const [nextLyricText, setNextLyricText] = useState<string | null>(null);
  const [showAllLyrics, setShowAllLyrics] = useState<boolean>(false);
  const [isLyricsCollapsed, setIsLyricsCollapsed] = useState<boolean>(false);
  const [lyricsPosition, setLyricsPosition] = useState<'top' | 'bottom'>('top');
  const allLyricsContainerRef = useRef<HTMLDivElement>(null);
  const allLyricsActiveLineRef = useRef<HTMLDivElement>(null);
  const [currentSpotifyTrack, setCurrentSpotifyTrack] = useState<{ artist: string; title: string } | null>(null);
  const [activeMediaSession, setActiveMediaSession] = useState<MediaSession | null>(null);
  const [musicPositionSecs, setMusicPositionSecs] = useState<number>(0);
  const [musicDurationSecs, setMusicDurationSecs] = useState<number>(0);
  const [systemTelemetry, setSystemTelemetry] = useState<SystemTelemetry | null>(null);

  // Flame speed multiplier: default 1.0 (Normal & Smooth)
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [showText, setShowText] = useState<boolean>(true);
  const [lyricsMode, setLyricsMode] = useState<'auto_lyrics' | 'normal_text'>('auto_lyrics');
  const [audioState, setAudioState] = useState<AudioReactiveState>(() => audioReactiveEngine.getState());
  const [boundaryMode, setBoundaryMode] = useState<BoundaryPhysicsMode>('bounce');
  const [isSoundMuted, setIsSoundMuted] = useState(soundFxEngine.isSoundMuted());

  // Subscribe to audio-reactive engine for beat detection & spectrum
  useEffect(() => {
    return audioReactiveEngine.subscribe((state) => {
      setAudioState(state);
    });
  }, []);

  // Listen to Shinobi Rank Up and Quest Completion events
  useEffect(() => {
    const unlistenRank = questProgressionEngine.onRankUp((newRank) => {
      soundFxEngine.playRankUp();
      questProgressionEngine.recordChime();
      messageManager.enqueue(`RANK UP! Promoted to ${newRank.title}!`, 'high', 'interaction');
      setShowLoveHearts(true);
      setTimeout(() => setShowLoveHearts(false), 3000);
      setAnimation('happy');
    });

    const unlistenTask = questProgressionEngine.onTaskComplete((taskId, xp) => {
      const task = LULU_TASKS.find((t) => t.id === taskId);
      messageManager.enqueue(`Quest Complete: ${task?.title || taskId} (+${xp} XP)!`, 'normal', 'interaction');
    });

    return () => {
      unlistenRank();
      unlistenTask();
    };
  }, []);

  // Subscribe to SoundFxEngine and MovementEngine onWrap
  useEffect(() => {
    movementRef.current.setOnWrap(() => {
      questProgressionEngine.recordWrapLap();
    });
    return soundFxEngine.subscribe((cfg) => {
      setIsSoundMuted(cfg.isMuted);
    });
  }, []);

  // Auto-scroll active lyric line in All Lyrics scroll view
  useEffect(() => {
    if (showAllLyrics && allLyricsActiveLineRef.current && allLyricsContainerRef.current) {
      allLyricsActiveLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [showAllLyrics, activeLyricText]);

  const formatTime = (secs: number): string => {
    const s = Math.max(0, Math.floor(secs || 0));
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const [preferences, setPreferences] = useState<PetPreferences>({
    scale: 1.0,
    theme: 'Lulu Dark',
    character_style: 'shadow_shinobi',
    behavior_mode: 'NORMAL',
    wander_speed: 1.0,
    speech_enabled: true,
    show_text: true,
    lyrics_mode: 'auto_lyrics',
    speed_multiplier: 1.0,
    sound_volume: 0.8,
    always_on_top: true,
    fps_limit: 60,
  });

  const needSystemRef = useRef<NeedSystem>(new NeedSystem());
  const movementRef = useRef<MovementEngine>(new MovementEngine());
  const behaviorRef = useRef<BehaviorEngine>(new BehaviorEngine());
  const isFetchingLyricsRef = useRef<boolean>(false);
  const lastFetchedKeyRef = useRef<string>('');
  const lyricsRef = useRef<ParsedLrc | null>(null);
  const currentSpotifyTrackRef = useRef<{ artist: string; title: string } | null>(null);
  const isMusicPlayingRef = useRef<boolean>(false);
  const isSleepingRef = useRef<boolean>(isSleeping);

  useEffect(() => {
    isSleepingRef.current = isSleeping;
  }, [isSleeping]);

  // Keep MovementEngine synchronized with speedMultiplier
  useEffect(() => {
    movementRef.current.setSpeedMultiplier(speedMultiplier);
  }, [speedMultiplier]);

  const getNormalLuluText = (anim: string, moodState: MoodType, sleeping: boolean, mult: number): string => {
    if (sleeping || anim === 'sleep') return 'Peaceful Slumber • Zzz...';
    if (anim === 'sit') return 'Step Down Zen • Deep Peace';
    if (anim.startsWith('run')) return `Shinobi Sprint${mult > 1.1 ? ' (Hyper)' : ''} • Patrolling`;
    if (anim.startsWith('walk')) return 'Desktop Patrol • Wandering';
    if (anim === 'sing') return 'Singing to Melody • Joyful Spirit';
    if (anim === 'dance') return 'Chakra Dance • Pure Joy';
    if (anim === 'protect') return 'Susanoo Defense • Guarding Screen';
    if (anim === 'happy') return 'Shinobi Spirit • Radiant Chakra';
    if (anim === 'sad') return 'Deep Stillness • Meditating';

    switch (moodState) {
      case 'happy':
        return 'Lulu • Peaceful & Content';
      case 'playful':
        return 'Lulu • Ready for Action';
      case 'curious':
        return 'Lulu • Watching Over Desktop';
      case 'tired':
        return 'Lulu • Resting Gently';
      case 'calm':
        return 'Lulu • Calm & Mindful';
      default:
        return 'Lulu • Shinobi Companion';
    }
  };

  // 1. Initial Load & Persistence
  useEffect(() => {
    const init = async () => {
      try {
        const savedPref = await invokeCommand<PetPreferences>('get_pet_preferences');
        if (savedPref) setPreferences(savedPref);

        const savedState = await invokeCommand<any>('get_pet_needs_mood');
        if (savedState) {
          needSystemRef.current = new NeedSystem({
            energy: savedState.energy,
            happiness: savedState.happiness,
            fun: savedState.fun,
          });
          setNeeds(needSystemRef.current.getNeeds());
          setMood(savedState.mood as MoodType);
        }

        const monitors = await invokeCommand<NativeMonitorInfo[]>('get_monitors');
        if (monitors && monitors.length > 0) {
          const primary = monitors.find((m) => m.is_primary) || monitors[0];
          movementRef.current.setMonitor(primary);
          movementRef.current.setMonitors(monitors);
        }

        // Welcome speech line
        messageManager.enqueue('Wake up to reality! Lulu is ready.', 'high', 'startup');
      } catch {
        // Fallback in web/preview
      }
    };
    init();
  }, []);

  // 2. Setup Movement Listener (with 40-frame sprint support & uninterrupted music)
  useEffect(() => {
    movementRef.current.setListener((_x, _y, isMoving, direction, isRunning) => {
      if (movementPaused) return;
      if (isMoving) {
        if (isRunning) {
          setAnimation(direction === 'left' ? 'run-left' : 'run-right');
        } else {
          setAnimation(direction === 'left' ? 'walk-left' : 'walk-right');
        }
      } else {
        setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? (isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle') : prev));
      }
    });
  }, [movementPaused, isMusicPlaying, activeLyricText]);

  // Follow Cursor Loop (polls desktop mouse position and runs with 40-frame animation)
  useEffect(() => {
    if (!isFollowingCursor || movementPaused || isSleeping) return;

    const followInterval = setInterval(async () => {
      try {
        const mouse = await invokeCommand<{ x: number; y: number }>('get_cursor_position');
        const pos = await invokeCommand<{ x: number; y: number }>('get_window_position');
        if (mouse && typeof mouse.x === 'number' && typeof mouse.y === 'number' && pos) {
          const dx = mouse.x - (pos.x + 130);
          const dy = mouse.y - (pos.y + 150);
          const dist = Math.hypot(dx, dy);
          if (dist > 90) {
            movementRef.current.followCursor(mouse.x, mouse.y);
          }
        }
      } catch {
        // Fallback
      }
    }, 250);

    return () => clearInterval(followInterval);
  }, [isFollowingCursor, movementPaused, isSleeping]);

  // 3. Native Linux Notifications Listener (D-Bus)
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      unlisten = await listenEvent<any>('notification:received', (item) => {
        // Direct IPC command hooks
        if (item.title === '__LULU_CMD_OPEN_CONTROL_CENTER__') {
          openControlCenterRef.current();
          return;
        }
        if (item.title === '__LULU_CMD_CLOSE_CONTROL_CENTER__') {
          closeControlCenterRef.current();
          return;
        }
        if (item.title === '__LULU_CMD_UNLOCK_ALL__') {
          unlockAllRef.current();
          return;
        }
        if (item.title === '__LULU_CMD_FOLLOW_SYSTEM__') {
          handleUpdatePreferences({ ...preferences, behavior_mode: 'SYSTEM_SYNC' });
          messageManager.enqueue('Follow Computer System mode activated!', 'high', 'interaction');
          return;
        }
        if (item.title === '__LULU_CMD_SIT__') {
          setIsSleeping(false);
          setAnimation('sit');
          messageManager.enqueue('Taking a calm cross-legged breather...', 'high', 'interaction');
          return;
        }
        if (item.title === '__LULU_CMD_SLEEP__') {
          setIsSleeping(true);
          isSleepingRef.current = true;
          setAnimation('sleep');
          if (isMusicPlaying) {
            messageManager.enqueue('Peaceful Lullaby Mode • Sleeping soundly to the music...', 'high', 'interaction');
          } else {
            messageManager.enqueue('Zzz... Peacefully resting soundly.', 'high', 'interaction');
          }
          return;
        }
        if (item.title === '__LULU_CMD_SING__') {
          setIsSleeping(false);
          setAnimation('sing');
          messageManager.enqueue('Singing karaoke with joy!', 'high', 'music');
          return;
        }

        // Standard notification event: Trigger surprised alert animation
        setAnimation('surprised');
        messageManager.enqueue(`${item.app_name}: ${item.title}`, 'critical', 'notification');
        setTimeout(() => {
          setAnimation('talk');
          setTimeout(() => {
            setAnimation(isSleeping ? 'sleep' : isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle');
          }, 2500);
        }, 1200);
      });
    };

    setupListener();
    return () => {
      if (unlisten) unlisten();
    };
  }, [isSleeping, isMusicPlaying, activeLyricText, preferences]);

  // Global Keyboard Shortcut: F2 or Ctrl+Shift+C to toggle Control Center
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c')) {
        e.preventDefault();
        if (isControlCenterOpen) {
          closeControlCenterRef.current();
        } else {
          openControlCenterRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isControlCenterOpen]);

  // Periodic System Telemetry Poller (Computer CPU, RAM, GPU, Swap, Disk, Battery, OS)
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const sys = await invokeCommand<ComprehensiveSystemInfo>('get_system_info');
        if (sys) {
          useSystemStore.setState({
            systemInfo: sys,
            lastUpdated: new Date().toLocaleTimeString(),
          });

          const memUsed = sys.memory?.used_mb ?? 0;
          const memTotal = sys.memory?.total_mb ?? 0;
          const memPercent =
            memTotal > 0
              ? (memUsed / memTotal) * 100
              : 0;

          const swapUsed = sys.memory?.swap_used_mb ?? 0;
          const swapTotal = sys.memory?.swap_total_mb ?? 0;
          const swapPercent = swapTotal > 0 ? (swapUsed / swapTotal) * 100 : 0;

          const diskTotal = sys.disk?.root?.total_space_gb ?? 0;
          const diskAvail = sys.disk?.root?.available_space_gb ?? 0;
          const diskUsed = Math.max(0, Math.round((diskTotal - diskAvail) * 10) / 10);
          const diskPercent = diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0;

          const cpuVal =
            typeof sys.cpu?.usage_percent === 'number'
              ? sys.cpu.usage_percent
              : 0;

          setSystemTelemetry({
            // CPU
            cpuPercent: Math.max(0, Math.min(100, cpuVal)),
            cpuCores: sys.cpu?.logical_cores,
            cpuPhysicalCores: sys.cpu?.physical_cores,
            cpuModel: sys.cpu?.model,
            cpuVendor: sys.cpu?.vendor,
            cpuFreqMhz: sys.cpu?.frequency_mhz,

            // RAM & Swap
            memUsedMb: memUsed,
            memTotalMb: memTotal,
            memPercent: Math.max(0, Math.min(100, memPercent)),
            memAvailableMb: sys.memory?.available_mb,
            swapUsedMb: swapUsed,
            swapTotalMb: swapTotal,
            swapPercent: Math.max(0, Math.min(100, swapPercent)),

            // GPU
            gpuName: sys.gpu?.name,
            gpuVendor: sys.gpu?.vendor,
            gpuRenderer: sys.gpu?.renderer,
            gpuIsDiscrete: sys.gpu?.is_discrete,
            gpuVramMb: sys.gpu?.vram_mb ?? undefined,
            gpuDriver: sys.gpu?.driver,
            gpuStatus: sys.gpu?.status,

            // Storage / Disk
            diskRootUsedGb: diskUsed,
            diskRootTotalGb: diskTotal,
            diskRootAvailGb: diskAvail,
            diskRootPercent: Math.max(0, Math.min(100, diskPercent)),
            diskRootFs: sys.disk?.root?.filesystem,

            // Power & Battery
            batteryPercent: sys.power?.battery_percentage ?? undefined,
            isCharging: sys.power?.is_charging,
            powerSource: sys.power?.source,
            powerStatus: sys.power?.status_text,
            autoPowerSave: sys.power?.auto_power_save_recommended,

            // OS & Session
            osName: sys.os?.distro_name || sys.os?.os_name,
            kernelVersion: sys.os?.kernel_version,
            compositor: sys.session?.compositor,
            sessionType: sys.session?.session_type,
            desktopEnv: sys.session?.desktop_environment,
            profile: preferences.performance_profile || sys.active_profile,
            isLowSpec: sys.is_low_spec,
          });
        }
      } catch {}
    };

    fetchTelemetry();
    const intervalMs = preferences.telemetry_interval_ms || 2000;
    const telemetryTimer = setInterval(fetchTelemetry, intervalMs);
    return () => clearInterval(telemetryTimer);
  }, [preferences.telemetry_interval_ms, preferences.performance_profile]);

  // 4. Media & Lyrics Poller (MPRIS, Spotify, YouTube, YouTube Music) — 200ms Sync Loop
  useEffect(() => {
    const mediaTimer = setInterval(async () => {
      try {
        const session = await invokeCommand<MediaSession>('get_media_session');
        if (session && session.title) {
          setActiveMediaSession(session);
          const normalized = normalizeMediaSession(session);
          const posSecs = (session.position_ms || 0) / 1000.0;
          const durSecs = (session.duration_ms || 0) / 1000.0;
          setMusicPositionSecs(posSecs);
          setMusicDurationSecs(durSecs);

          // Synced Lyrics Detection & Realtime Line Match
          const trackKey = `${normalized.artist} - ${normalized.title}`.toLowerCase().trim();
          const trackChanged =
            !currentSpotifyTrackRef.current ||
            currentSpotifyTrackRef.current.artist !== normalized.artist ||
            currentSpotifyTrackRef.current.title !== normalized.title;

          if (trackChanged && normalized.title) {
            currentSpotifyTrackRef.current = { artist: normalized.artist, title: normalized.title };
            setCurrentSpotifyTrack({ artist: normalized.artist, title: normalized.title });
            // Immediate clear on track change — never show old lyrics over new track
            lyricsSyncEngine.clear();
            lyricsRef.current = null;
            setSpotifyLyrics(null);
            setPrevLyricText(null);
            setActiveLyricText(null);
            setNextLyricText(null);
          }

          // Trigger lyrics fetch if track changed or not yet fetched for current track
          const shouldFetchLyrics =
            (trackChanged || (!lyricsRef.current && lastFetchedKeyRef.current !== trackKey)) &&
            !isFetchingLyricsRef.current &&
            !!normalized.title;

          if (shouldFetchLyrics) {
            isFetchingLyricsRef.current = true;
            lastFetchedKeyRef.current = trackKey;
            lyricsRef.current = null;
            setSpotifyLyrics(null);

            spotifyLyricsService
              .getLyricsForTrack(normalized.artist, normalized.title, durSecs, normalized.searchQuery)
              .then((lrc) => {
                lyricsRef.current = lrc;
                setSpotifyLyrics(lrc);
                if (lrc) {
                  lyricsSyncEngine.loadLyrics(parsedLrcToMs(lrc), trackKey, session.duration_ms || 0);
                  const syncState = lyricsSyncEngine.updatePosition(
                    session.position_ms || 0,
                    session.playing ? 'Playing' : 'Paused'
                  );
                  setPrevLyricText(syncState.previousText);
                  setActiveLyricText(syncState.currentText);
                  setNextLyricText(syncState.nextText);
                  if (session.playing) {
                    if (isSleepingRef.current) {
                      setAnimation('sleep');
                    } else if (syncState.currentText) {
                      setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'sing'));
                    } else {
                      setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'dance'));
                    }
                  }
                } else {
                  lyricsSyncEngine.clear();
                  setPrevLyricText(null);
                  setActiveLyricText(null);
                  setNextLyricText(null);
                  if (session.playing && !isSleepingRef.current) {
                    setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'dance'));
                  }
                }
              })
              .finally(() => {
                isFetchingLyricsRef.current = false;
              });
          }

          if (session.playing) {
            audioReactiveEngine.updatePlayback(true, session.position_ms || 0);
            if (!isMusicPlayingRef.current) {
              isMusicPlayingRef.current = true;
              setIsMusicPlaying(true);
              if (!isSleepingRef.current) {
                setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'dance'));
              }
              eventBus.emit('music:playback_changed', { status: 'Playing', title: normalized.title });
            }

            if (lyricsRef.current) {
              // Lightweight 200ms sync progression using actual player position
              const syncState = lyricsSyncEngine.updatePosition(session.position_ms || 0, 'Playing');
              setPrevLyricText(syncState.previousText);
              setActiveLyricText(syncState.currentText);
              setNextLyricText(syncState.nextText);
              if (isSleepingRef.current) {
                setAnimation('sleep');
              } else if (syncState.currentText) {
                setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'sing'));
              } else {
                setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'dance'));
              }
            }
          } else {
            // Paused: freeze lyrics and progress indicator, set animation to idle if not sleeping
            audioReactiveEngine.updatePlayback(false, session.position_ms || 0);
            lyricsSyncEngine.updatePosition(session.position_ms || 0, 'Paused');
            if (isMusicPlayingRef.current) {
              isMusicPlayingRef.current = false;
              setIsMusicPlaying(false);
              if (!isSleepingRef.current) {
                setAnimation((prev) => (prev === 'dance' || prev === 'sing' ? 'idle' : prev));
              }
              eventBus.emit('music:playback_changed', { status: 'Paused' });
            }
          }
        } else {
          // No media session
          audioReactiveEngine.updatePlayback(false, 0);
          lyricsSyncEngine.clear();
          if (isMusicPlayingRef.current) {
            isMusicPlayingRef.current = false;
            setIsMusicPlaying(false);
            setMusicPositionSecs(0);
            lyricsRef.current = null;
            currentSpotifyTrackRef.current = null;
            lastFetchedKeyRef.current = '';
            setSpotifyLyrics(null);
            setPrevLyricText(null);
            setActiveLyricText(null);
            setNextLyricText(null);
            setActiveMediaSession(null);
            if (!isSleepingRef.current) {
              setAnimation((prev) => (prev === 'dance' || prev === 'sing' ? 'idle' : prev));
            }
            eventBus.emit('music:playback_changed', { status: 'Paused' });
          }
        }
      } catch {}
    }, 200);

    return () => clearInterval(mediaTimer);
  }, []);

  // 5. Needs & Mood Clock (Ticks every 10 seconds)
  useEffect(() => {
    const clock = setInterval(() => {
      needSystemRef.current.decayTick(isSleeping, animation.startsWith('walk'));
      const currentNeeds = needSystemRef.current.getNeeds();
      setNeeds(currentNeeds);

      const calculatedMood = MoodSystem.calculateMood(currentNeeds, isSleeping);
      setMood(calculatedMood);

      // Autonomous behavior evaluation
      const decision = behaviorRef.current.evaluateNextStep(
        currentNeeds,
        calculatedMood,
        isSleeping,
        animation.startsWith('walk'),
        systemTelemetry || undefined
      );

      if (decision.thought && preferences.speech_enabled) {
        messageManager.enqueue(decision.thought, 'normal', 'system');
      }

      if (decision.action === 'run_sprint' && !isSleeping && !movementPaused) {
        if (preferences.behavior_mode !== 'OFF') {
          movementRef.current.sprintLap();
        }
      } else if (decision.action === 'wander' && !isSleeping && !movementPaused) {
        if (preferences.behavior_mode !== 'OFF') {
          movementRef.current.randomWander();
        }
      } else if (decision.action === 'sleep') {
        setIsSleeping(true);
        setAnimation('sleep');
      } else if (decision.action === 'wake') {
        setIsSleeping(false);
        setAnimation(isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle');
      } else if (decision.action === 'happy_dance') {
        setAnimation('happy');
        setTimeout(() => setAnimation(isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle'), 2500);
      } else if (decision.action === 'wave') {
        setAnimation('wave');
        setTimeout(() => setAnimation(isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle'), 2000);
      } else if (decision.action === 'protect') {
        setAnimation('protect');
        setTimeout(() => setAnimation(isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle'), 2500);
      }

      // Persist state to SQLite periodically
      invokeCommand('save_pet_needs_mood', {
        state: {
          energy: currentNeeds.energy,
          happiness: currentNeeds.happiness,
          fun: currentNeeds.fun,
          mood: calculatedMood,
          home_x: 100,
          home_y: 100,
          last_interaction_ts: Date.now(),
        },
      }).catch(() => {});
    }, 10000);

    return () => clearInterval(clock);
  }, [isSleeping, animation, preferences.speech_enabled, preferences.behavior_mode, movementPaused, isMusicPlaying, activeLyricText, systemTelemetry]);

  // 5.1. Periodic Focus Event Clock ("1flam /40s" & "1min 2 img")
  const [focusIntervalSeconds, setFocusIntervalSeconds] = useState(40);

  const handleTriggerFocusEvent = useCallback(() => {
    if (isSleeping) {
      needSystemRef.current.wakeUp();
      setIsSleeping(false);
    }
    questProgressionEngine.recordFocusSession();
    const event = behaviorRef.current.getRandomFocusEvent(focusIntervalSeconds);
    if (event.thought && preferences.speech_enabled) {
      messageManager.enqueue(event.thought, 'high', 'system');
    }

    const executeAction = (action: string) => {
      if (action === 'run_sprint') {
        movementRef.current.sprintLap();
      } else if (action === 'happy_dance') {
        setAnimation('happy');
        setTimeout(() => setAnimation(isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle'), 3000);
      } else if (action === 'music_jam') {
        setAnimation('dance');
        setTimeout(() => setAnimation(isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle'), 3500);
      } else if (action === 'protect') {
        setAnimation('protect');
        setTimeout(() => setAnimation(isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle'), 2500);
      } else if (action === 'wave') {
        setAnimation('wave');
        setTimeout(() => setAnimation(isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle'), 2500);
      } else if (action === 'sad_contemplate') {
        setAnimation('sad');
        setTimeout(() => setAnimation(isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle'), 3000);
      } else {
        movementRef.current.randomWander();
      }
    };

    // Execute first routine (Image 1)
    executeAction(event.action);

    // "1min 2 img": If interval <= 30s or on dual routine, chain second distinct style (Image 2)
    if (focusIntervalSeconds <= 30 || focusIntervalSeconds === 60) {
      setTimeout(() => {
        const pool = ['happy_dance', 'protect', 'wave', 'music_jam', 'run_sprint'].filter(
          (a) => a !== event.action
        );
        const secondAction = pool[Math.floor(Math.random() * pool.length)];
        executeAction(secondAction);
      }, 3200);
    }
  }, [isSleeping, preferences.speech_enabled, focusIntervalSeconds, isMusicPlaying, activeLyricText]);

  useEffect(() => {
    // Periodic random routine: ticks every focusIntervalSeconds (default 40s)
    const focusTimer = setInterval(() => {
      handleTriggerFocusEvent();
    }, focusIntervalSeconds * 1000);

    return () => clearInterval(focusTimer);
  }, [handleTriggerFocusEvent, focusIntervalSeconds]);

  // 6. Mouse movement tracking for Follow Cursor pupil tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = Math.max(-1, Math.min(1, (e.clientX - centerX) / 80));
    const dy = Math.max(-1, Math.min(1, (e.clientY - centerY) / 80));
    setCursorOffset({ x: dx, y: dy });
  };

  const SHINOBI_AFFECTION_LINES = [
    "Wake up to reality... I acknowledge your greatness!",
    "Would you like these clones to use Susanoo or not?",
    "Hmph... Even the legendary shinobi needs a loyal comrade.",
    "These hands were forged for battle... but your bond is worthy!",
    "A legendary warrior's bond transcends all boundaries!",
  ];

  const ANIME_AFFECTION_LINES = [
    "Lulu t'aime de tout son cœur!",
    "Nyaa~ Daisuki dayo!",
    "Lulu loves you so much!",
    "Je t'aime! Tu es le meilleur!",
    "Purr... Lulu is so happy with you!",
  ];

  // Affection burst (Lulu Aime / Shinobi Bond)
  const handleSendLove = () => {
    needSystemRef.current.petInteraction();
    needSystemRef.current.feedSnack();
    soundFxEngine.playHeadpat();
    questProgressionEngine.recordChime();
    setNeeds(needSystemRef.current.getNeeds());
    setAnimation('happy');
    setShowLoveHearts(true);
    const pool = (preferences.character_style || 'shadow_shinobi') === 'shadow_shinobi'
      ? SHINOBI_AFFECTION_LINES
      : ANIME_AFFECTION_LINES;
    const line = pool[Math.floor(Math.random() * pool.length)];
    messageManager.enqueue(line, 'high', 'interaction');
    setTimeout(() => {
      setAnimation(isSleeping ? 'sleep' : isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle');
      setShowLoveHearts(false);
    }, 3200);
  };

  // Petting interaction
  const handlePetLulu = () => {
    needSystemRef.current.petInteraction();
    questProgressionEngine.recordPet();
    soundFxEngine.playHeadpat();
    questProgressionEngine.recordChime();
    setNeeds(needSystemRef.current.getNeeds());
    setAnimation('happy');
    setShowLoveHearts(true);
    const pool = (preferences.character_style || 'shadow_shinobi') === 'shadow_shinobi'
      ? [
          "Hmph! You dare pat the legendary shinobi? ...Do not stop.",
          "A true warrior appreciates such gentle treatment.",
          "The Gunbai is ready. Our power is unmatched!",
        ]
      : [
          "Nyaa~ That tickles! Daisuki!",
          "Hehe, Lulu loves headpats!",
          "Purr... Lulu t'aime!",
        ];
    const line = pool[Math.floor(Math.random() * pool.length)];
    messageManager.enqueue(line, 'high', 'interaction');
    setTimeout(() => {
      setAnimation(isSleeping ? 'sleep' : isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle');
      setShowLoveHearts(false);
    }, 2500);
  };

  const handleFeedSnack = () => {
    needSystemRef.current.feedSnack();
    questProgressionEngine.recordSnack();
    soundFxEngine.playSnack();
    questProgressionEngine.recordChime();
    setNeeds(needSystemRef.current.getNeeds());
    setAnimation('happy');
    messageManager.enqueue('Yummy! Delicious snack!', 'high', 'interaction');
    setTimeout(() => setAnimation(isSleeping ? 'sleep' : isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle'), 2500);
  };

  const handleToggleSleep = () => {
    if (isSleeping) {
      needSystemRef.current.wakeUp();
      setIsSleeping(false);
      isSleepingRef.current = false;
      setAnimation('wake');
      messageManager.enqueue('Yawn... Awake and ready!', 'normal', 'interaction');
      setTimeout(() => setAnimation(isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle'), 1500);
    } else {
      setIsSleeping(true);
      isSleepingRef.current = true;
      questProgressionEngine.recordSleep();
      soundFxEngine.playSleep();
      questProgressionEngine.recordChime();
      setAnimation('sleep');
      if (isMusicPlaying) {
        messageManager.enqueue('Peaceful Lullaby Mode • Sleeping soundly to the melody...', 'normal', 'interaction');
      } else {
        messageManager.enqueue('Zzz... Good night~', 'normal', 'interaction');
      }
    }
  };

  const preModalPosRef = useRef<{ x: number; y: number } | null>(null);
  const openControlCenterRef = useRef<() => void>(() => {});
  const closeControlCenterRef = useRef<() => void>(() => {});
  const unlockAllRef = useRef<() => void>(() => {});

  const handleToggleContinuousRun = () => {
    if (isControlCenterOpen) {
      handleCloseControlCenter();
    }
    if (isSleeping) {
      needSystemRef.current.wakeUp();
      setIsSleeping(false);
    }
    const running = movementRef.current.toggleContinuousRun();
    setIsContinuousRunning(running);
    if (running) {
      soundFxEngine.playSprintWhoosh();
      questProgressionEngine.recordChime();
      setIsContinuousWalking(false);
      setIs40sRunActive(false);
      messageManager.enqueue('SHOW RUN active! Continuous sprint!', 'normal', 'interaction');
    } else {
      messageManager.enqueue('Sprint paused. Catching breath!', 'normal', 'interaction');
    }
  };

  const handleStart40sRun = () => {
    if (isControlCenterOpen) {
      handleCloseControlCenter();
    }
    if (isSleeping) {
      needSystemRef.current.wakeUp();
      setIsSleeping(false);
    }
    if (is40sRunActive || isContinuousRunning) {
      movementRef.current.stop();
      setIs40sRunActive(false);
      setIsContinuousRunning(false);
      setIsContinuousWalking(false);
      messageManager.enqueue('Sprint paused. Catching breath!', 'normal', 'interaction');
      return;
    }
    setIs40sRunActive(true);
    setIsContinuousRunning(true);
    setIsContinuousWalking(false);
    questProgressionEngine.recordSprintLap();
    soundFxEngine.playSprintWhoosh();
    questProgressionEngine.recordChime();
    messageManager.enqueue('Flame Sprint active!', 'high', 'interaction');
    movementRef.current.startTimedRun(40, () => {
      setIs40sRunActive(false);
      setIsContinuousRunning(false);
      messageManager.enqueue('Sprint complete! Full speed achieved!', 'high', 'interaction');
    });
  };

  const handleToggleContinuousWalk = () => {
    if (isControlCenterOpen) {
      handleCloseControlCenter();
    }
    if (isSleeping) {
      needSystemRef.current.wakeUp();
      setIsSleeping(false);
    }
    const walking = movementRef.current.toggleContinuousWalk();
    setIsContinuousWalking(walking);
    if (walking) {
      questProgressionEngine.recordWalkLap();
      setIsContinuousRunning(false);
      setIs40sRunActive(false);
      messageManager.enqueue('Walk Go & Back active! Pacing desktop perimeter...', 'normal', 'interaction');
    } else {
      messageManager.enqueue('Patrol walk paused. Resting peacefully!', 'normal', 'interaction');
    }
  };

  const handleWalkGoAndBack = () => {
    if (isControlCenterOpen) {
      handleCloseControlCenter();
    }
    if (isSleeping) {
      needSystemRef.current.wakeUp();
      setIsSleeping(false);
    }
    if (isContinuousWalking) {
      movementRef.current.stop();
      setIsContinuousWalking(false);
      messageManager.enqueue('Patrol walk paused. Resting peacefully!', 'normal', 'interaction');
      return;
    }
    setIsContinuousWalking(true);
    setIsContinuousRunning(false);
    setIs40sRunActive(false);
    questProgressionEngine.recordWalkLap();
    messageManager.enqueue('Walk Go & Back patrol initiated!', 'high', 'interaction');
    movementRef.current.walkGoAndBack(() => {
      setIsContinuousWalking(false);
      messageManager.enqueue('Patrol walk cycle completed safely!', 'high', 'interaction');
    });
  };

  const handleUpdatePreferences = async (newPref: PetPreferences) => {
    setPreferences(newPref);
    behaviorRef.current.setMode(newPref.behavior_mode);
    try {
      await invokeCommand('save_pet_preferences', { preferences: newPref });
      await invokeCommand('set_always_on_top', { alwaysOnTop: newPref.always_on_top });
    } catch {}
  };

  // Right Click Context Menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const menuWidth = 190;
    const menuHeight = 250;
    const clX = Math.max(4, Math.min(window.innerWidth - menuWidth - 4, e.clientX));
    const clY = Math.max(4, Math.min(window.innerHeight - menuHeight - 4, e.clientY));
    setContextPos({ x: clX, y: clY });
    setShowContextMenu(true);
  };

  const clickTimeoutRef = useRef<any>(null);

  // Single Click: Jump or Pet reaction
  const handlePetClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isSleeping) {
      handleToggleSleep();
    } else {
      setAnimation('jump');
      handlePetLulu();
    }
  };

  // Coordinated click handler for Sprite (Single Click: Pet/Jump, Double Click: Control Center)
  const handleSpriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      handleOpenControlCenter();
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        handlePetClick();
      }, 250);
    }
  };

  // Control Center Window Resizing & Safe On-Screen Placement
  const handleOpenControlCenter = async () => {
    setIsControlCenterOpen(true);
    movementRef.current.pause();

    try {
      const pos = await invokeCommand<{ x: number; y: number }>('get_window_position');
      if (pos) preModalPosRef.current = pos;

      const mons = await invokeCommand<NativeMonitorInfo[]>('get_monitors');
      const primary = mons?.find((m) => m.is_primary) || mons?.[0];
      const screenW = primary?.width || window.screen.width || 1920;
      const screenH = primary?.height || window.screen.height || 1080;

      const modalW = 820;
      const modalH = 680;

      let targetX = pos?.x ?? Math.round((screenW - modalW) / 2);
      let targetY = pos?.y ?? Math.round((screenH - modalH) / 2);

      // Clamp target coordinates so the modal is 100% visible on screen
      if (targetX + modalW > screenW - 20) {
        targetX = Math.max(20, screenW - modalW - 20);
      }
      if (targetY + modalH > screenH - 50) {
        targetY = Math.max(40, screenH - modalH - 50);
      }
      targetX = Math.max(20, targetX);
      targetY = Math.max(40, targetY);

      await invokeCommand('set_window_size', { width: modalW, height: modalH });
      await invokeCommand('set_window_position', { x: targetX, y: targetY });
      await invokeCommand('focus_window');
    } catch {
      await invokeCommand('set_window_size', { width: 820, height: 680 });
      await invokeCommand('focus_window');
    }
  };

  const handleCloseControlCenter = async () => {
    setIsControlCenterOpen(false);
    try {
      if (preModalPosRef.current) {
        await invokeCommand('set_window_position', {
          x: preModalPosRef.current.x,
          y: preModalPosRef.current.y,
        });
      }
      await invokeCommand('set_window_size', { width: 290, height: 420 });
      if (!movementPaused && !isSleeping) {
        movementRef.current.resume();
      }
    } catch {}
  };

  const handleUnlockAll = () => {
    setAnimation('happy');
    setShowLoveHearts(true);
    messageManager.enqueue(`All ${Object.keys(LULU_FLAME_STYLES).length} Master Flames and ${LULU_TASKS.length} Shinobi Tasks are 100% Unlocked!`, 'high', 'interaction');
    setTimeout(() => {
      setShowLoveHearts(false);
      setAnimation(isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle');
    }, 3500);
  };

  openControlCenterRef.current = handleOpenControlCenter;
  closeControlCenterRef.current = handleCloseControlCenter;
  unlockAllRef.current = handleUnlockAll;

  // Double Click: Open Control Center (Section 10)
  const handleDoubleClick = () => {
    handleOpenControlCenter();
  };

  const mediaTheme = getProviderTheme(activeMediaSession?.provider || 'spotify');

  const isMediaSessionActive =
    (isMusicPlaying || (activeMediaSession && activeMediaSession.paused && !!activeMediaSession.title)) &&
    lyricsMode === 'auto_lyrics';

  if (isControlCenterOpen) {
    return (
      <div
        className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center select-none bg-transparent"
        style={{ background: 'transparent' }}
      >
        <ControlCenterModal
          isOpen={true}
          onClose={handleCloseControlCenter}
          needs={needs}
          mood={mood}
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onPetLulu={handlePetLulu}
          onSendLove={handleSendLove}
          onFeedSnack={handleFeedSnack}
          onToggleSleep={handleToggleSleep}
          isSleeping={isSleeping}
          onTriggerAnimation={(anim) => {
            if (anim === 'run-right' || anim === 'run') {
              soundFxEngine.playSprintWhoosh();
              questProgressionEngine.recordChime();
              questProgressionEngine.recordSprintLap();
              movementRef.current.sprintLap();
            } else if (anim === 'walk-right' || anim === 'walk') {
              questProgressionEngine.recordWalkLap();
              movementRef.current.walkLap();
            } else {
              if (anim === 'protect') {
                soundFxEngine.playShield();
                questProgressionEngine.recordChime();
                questProgressionEngine.recordShield();
              }
              setAnimation(anim as AnimationState);
            }
          }}
          onTriggerFocusEvent={handleTriggerFocusEvent}
          focusIntervalSeconds={focusIntervalSeconds}
          onSetFocusInterval={setFocusIntervalSeconds}
          isContinuousRunning={isContinuousRunning}
          onToggleContinuousRun={handleToggleContinuousRun}
          isContinuousWalking={isContinuousWalking}
          onToggleContinuousWalk={handleToggleContinuousWalk}
          onWalkGoAndBack={handleWalkGoAndBack}
          is40sRunActive={is40sRunActive}
          onStart40sRun={handleStart40sRun}
          parsedLrc={spotifyLyrics}
          onStopMovement={() => {
            movementRef.current.stop();
            setIs40sRunActive(false);
            setIsContinuousRunning(false);
            setIsContinuousWalking(false);
          }}
          onPauseMovement={() => {
            movementRef.current.pause();
            setMovementPaused(true);
          }}
          onResumeMovement={() => {
            movementRef.current.resume();
            setMovementPaused(false);
          }}
          isMovementPaused={movementPaused}
          currentDirection={movementRef.current.getState().runDirection}
          currentFrame={movementRef.current.getState().currentFrame}
          showText={showText}
          onToggleShowText={() => setShowText((p) => !p)}
          lyricsMode={lyricsMode}
          onToggleLyricsMode={() => {
            setLyricsMode((prev) => {
              const next = prev === 'auto_lyrics' ? 'normal_text' : 'auto_lyrics';
              messageManager.enqueue(next === 'auto_lyrics' ? 'Live Lyrics Studio Active' : 'Normal Text Lulu Active', 'normal', 'interaction');
              return next;
            });
          }}
          speedMultiplier={speedMultiplier}
          onSetSpeedMultiplier={(mult) => {
            setSpeedMultiplier(mult);
            movementRef.current.setSpeedMultiplier(mult);
          }}
          systemTelemetry={systemTelemetry}
          activeMediaSession={activeMediaSession}
          onUnlockAll={handleUnlockAll}
          isLyricsCollapsed={isLyricsCollapsed}
          onToggleCollapseLyrics={() => setIsLyricsCollapsed((p) => !p)}
          lyricsPosition={lyricsPosition}
          onToggleLyricsPosition={() => setLyricsPosition((p) => (p === 'top' ? 'bottom' : 'top'))}
          boundaryPhysicsMode={boundaryMode}
          onSetBoundaryPhysicsMode={(m) => {
            setBoundaryMode(m);
            movementRef.current.setBoundaryPhysicsMode(m);
          }}
          onJumpToMonitor={async (name) => {
            await movementRef.current.jumpToMonitor(name);
          }}
        />
      </div>
    );
  }

  // Multi-Provider Synced Live-Time Lyrics Card (Collapsible Pill & Full View)
  const renderLyricsCard = () => {
    if (!isMediaSessionActive) return null;

    if (isLyricsCollapsed) {
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsLyricsCollapsed(false);
          }}
          className="px-2.5 py-1 rounded-full bg-[#090d16]/95 border flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-md transition-all hover:scale-102 pointer-events-auto shrink-0 select-none animate-fade-in"
          style={{
            borderColor: mediaTheme.borderColor,
            boxShadow: `0 4px 16px ${mediaTheme.glowColor}`,
          }}
          title="Click to expand full lyrics card"
        >
          {renderProviderIcon(mediaTheme.iconType, 12)}
          <AudioVisualizer variant="mini" accentColor={mediaTheme.accentColor} />
          <span className="text-[10px] font-bold text-white truncate max-w-[120px]">
            {currentSpotifyTrack?.title || 'Playing'}
          </span>
          <span className="text-[9px] font-mono text-gray-300">
            {formatTime(musicPositionSecs)} / {formatTime(musicDurationSecs || 0)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLyricsCollapsed(false);
            }}
            className="p-0.5 rounded hover:bg-white/10 text-gray-300 transition"
            title="Expand Lyrics Card"
          >
            <ChevronDown size={12} />
          </button>
        </div>
      );
    }

    return (
      <div
        className={`w-full max-w-[270px] px-3 py-1.5 rounded-2xl bg-[#090d16]/95 border ${mediaTheme.borderColor} flex flex-col gap-1 pointer-events-auto transition-all duration-300 animate-fade-in group cursor-pointer backdrop-blur-md shrink-0 shadow-lg`}
        style={{ boxShadow: `0 6px 20px ${mediaTheme.glowColor}` }}
        title={`Click to open Lyrics Studio (${mediaTheme.badgeText})`}
        onClick={handleOpenControlCenter}
      >
        {/* Header: Lulu + Equalizer & Live Synced Badge & View Toggle & Controls */}
        <div
          className="flex items-center justify-between pb-1"
          style={{ borderBottom: `1px solid ${mediaTheme.primaryColor}33` }}
        >
          <span className="text-[11px] font-bold text-white tracking-wide flex items-center gap-1.5">
            <PawPrint size={13} className="text-purple-400" />
            <span style={{ color: mediaTheme.accentColor }}>Lulu</span>
            {isSleeping && (
              <span className="text-[9px] text-purple-300 font-medium px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center gap-1">
                <Moon size={10} /> Lullaby
              </span>
            )}
          </span>
          <div className="flex items-center gap-1">
            {/* View Toggle: All Lyrics vs 3-Line Focus */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAllLyrics((p) => !p);
              }}
              className="text-[9px] px-1.5 py-0.5 rounded font-bold transition flex items-center gap-1 cursor-pointer border shadow-sm"
              style={{
                backgroundColor: showAllLyrics ? `${mediaTheme.primaryColor}33` : 'rgba(255,255,255,0.06)',
                borderColor: showAllLyrics ? mediaTheme.accentColor : 'rgba(255,255,255,0.15)',
                color: showAllLyrics ? mediaTheme.accentColor : '#d1d5db',
              }}
              title={showAllLyrics ? 'Switch to 3-Line Focus View' : 'Show All Lyrics Scroll View'}
            >
              {showAllLyrics ? <ListMusic size={11} /> : <Music size={11} />}
              <span>{showAllLyrics ? 'All' : '3-Line'}</span>
            </button>

            {/* Hinge / Position Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLyricsPosition((p) => (p === 'top' ? 'bottom' : 'top'));
              }}
              className="p-1 rounded font-bold hover:bg-white/10 text-gray-300 transition"
              title={`Hinge Position: Currently ${lyricsPosition === 'top' ? 'Top' : 'Bottom'}. Click to move to ${lyricsPosition === 'top' ? 'Bottom' : 'Top'}`}
            >
              <ArrowUpDown size={11} />
            </button>

            {/* Collapse Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLyricsCollapsed(true);
              }}
              className="p-1 rounded font-bold hover:bg-white/10 text-gray-300 transition"
              title="Collapse to Mini Bar (leaves full space for Lulu)"
            >
              <ChevronUp size={12} />
            </button>

            {/* Real-time audio reactive mini visualizer */}
            <AudioVisualizer variant="mini" accentColor={mediaTheme.accentColor} />

            <span
              className="text-[9px] font-semibold uppercase tracking-wider flex items-center gap-1 ml-0.5"
              style={{ color: mediaTheme.accentColor }}
            >
              {renderProviderIcon(mediaTheme.iconType, 11)}
              {isSleeping ? 'Lullaby' : isMusicPlaying ? mediaTheme.badgeText : `${mediaTheme.badgeText} (Paused)`}
            </span>
          </div>
        </div>

        {/* Artist - Song Header */}
        <div className="text-center">
          <p className="text-[10px] font-bold text-gray-300 truncate tracking-wide">
            {currentSpotifyTrack?.artist || mediaTheme.badgeText} - {currentSpotifyTrack?.title || 'Unknown Track'}
          </p>
        </div>

        {/* Lyrics Body: All Lyrics Scroll View vs 3-Line Focus View */}
        {showAllLyrics && spotifyLyrics?.lines && spotifyLyrics.lines.length > 0 ? (
          <div
            ref={allLyricsContainerRef}
            className="max-h-[76px] overflow-y-auto pr-1 py-0.5 space-y-0.5 select-none scrollbar-thin scrollbar-thumb-white/10 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {spotifyLyrics.lines.map((line, idx) => {
              const isCurrent = line.text === activeLyricText;
              return (
                <div
                  key={`${line.timeSeconds}-${idx}`}
                  ref={isCurrent ? allLyricsActiveLineRef : null}
                  className={`transition-all duration-200 px-1 py-0.5 rounded ${
                    isCurrent
                      ? 'font-extrabold text-[11px] leading-tight flex items-center justify-center'
                      : 'text-[9.5px] opacity-60 text-gray-300'
                  }`}
                  style={
                    isCurrent
                      ? {
                          color: mediaTheme.accentColor,
                          backgroundColor: `${mediaTheme.primaryColor}22`,
                          filter: `drop-shadow(0 0 8px ${mediaTheme.glowColor})`,
                        }
                      : {}
                  }
                >
                  {isCurrent ? (
                    <>
                      <Play size={7} className="fill-current inline mr-1 opacity-80" />
                      <span>{line.text || '...'}</span>
                      <Play size={7} className="fill-current inline ml-1 rotate-180 opacity-80" />
                    </>
                  ) : (
                    line.text || '...'
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5 py-0.5 min-h-[46px] justify-center text-center">
            {/* previous line */}
            <p className="text-[9.5px] text-gray-400/70 truncate max-w-full px-1 font-medium select-none transition-all duration-300">
              {prevLyricText ? prevLyricText : '···'}
            </p>

            {/* CURRENT LYRIC */}
            <p
              className="text-[11.5px] font-extrabold line-clamp-2 px-1 leading-snug tracking-wide transition-all duration-200 flex items-center justify-center"
              style={{
                color: mediaTheme.accentColor,
                filter: `drop-shadow(0 0 8px ${mediaTheme.glowColor})`,
              }}
            >
              <Play size={7} className="fill-current inline mr-1 opacity-80" />
              <span>{activeLyricText ? activeLyricText : (nextLyricText ? 'Instrumental Melody' : (isMusicPlaying ? 'Singing to the rhythm...' : 'Paused'))}</span>
              <Play size={7} className="fill-current inline ml-1 rotate-180 opacity-80" />
            </p>

            {/* next line */}
            <p
              className="text-[9.5px] truncate max-w-full px-1 font-medium select-none italic transition-all duration-300"
              style={{ color: mediaTheme.accentColor, opacity: 0.6 }}
            >
              {nextLyricText ? nextLyricText : '···'}
            </p>
          </div>
        )}

        {/* Progress Bar & Timestamp */}
        <div className="space-y-0.5 pt-0.5">
          {musicDurationSecs > 0 && (
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, (musicPositionSecs / musicDurationSecs) * 100))}%`,
                  background: `linear-gradient(to right, ${mediaTheme.primaryColor}, ${mediaTheme.accentColor})`,
                }}
              />
            </div>
          )}
          <div className="text-center">
            <span
              className="text-[8.5px] font-mono font-bold bg-black/60 px-2 py-0.5 rounded border"
              style={{
                color: mediaTheme.accentColor,
                borderColor: `${mediaTheme.primaryColor}33`,
              }}
            >
              {formatTime(musicPositionSecs)} / {formatTime(musicDurationSecs || 0)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
      onClick={() => setShowContextMenu(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-between select-none bg-transparent pt-1 pb-1 px-1"
      style={{ background: 'transparent' }}
    >
      {/* Drag handle container allowing window dragging via native start_dragging without GTK event hijacking */}
      <div
        onMouseDown={(e) => {
          if (e.button === 0) {
            invokeCommand('start_dragging').catch(() => {});
          }
        }}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
        title="Drag Lulu anywhere on your screen"
      />

      {/* Top Section: Lyrics (if top hinged) or Telemetry / Status */}
      <div className="w-full flex flex-col items-center gap-1 z-40 pointer-events-none shrink-0 min-h-[24px]">
        {showText && (
          <>
            {lyricsPosition === 'top' && renderLyricsCard()}

            {/* Floating Follow Computer Telemetry Badge */}
            {!isMediaSessionActive && preferences.behavior_mode === 'SYSTEM_SYNC' && systemTelemetry && (
              <div className="max-w-[260px] px-3 py-1 rounded-full bg-[#0f172a]/95 border border-cyan-500/60 shadow-[0_4px_16px_rgba(6,182,212,0.35)] flex items-center gap-1.5 pointer-events-none transition-all duration-300 animate-fade-in backdrop-blur-md">
                <Cpu size={12} className="text-cyan-400 shrink-0" />
                <span className="text-[10px] font-bold text-cyan-200 truncate">
                  System Follow: CPU {Math.round(systemTelemetry.cpuPercent)}% • RAM {Math.round(systemTelemetry.memPercent)}%
                </span>
              </div>
            )}

            {/* Floating Normal Lulu Text Badge */}
            {!isMediaSessionActive && preferences.behavior_mode !== 'SYSTEM_SYNC' && (
              <div
                onClick={handlePetClick}
                className="max-w-[260px] px-3.5 py-1 rounded-full bg-[#0b0f19]/90 border border-purple-500/50 shadow-[0_4px_16px_rgba(168,85,247,0.35)] flex items-center gap-1.5 pointer-events-auto cursor-pointer transition-all duration-300 animate-fade-in backdrop-blur-md hover:border-purple-400 group"
                title="Lulu Normal Status — Click to interact"
              >
                <PawPrint size={12} className="text-purple-400 shrink-0" />
                <span className="text-[10px] font-bold text-purple-200 truncate group-hover:text-white transition-colors">
                  {getNormalLuluText(animation, mood, isSleeping, speedMultiplier)}
                </span>
              </div>
            )}

            {/* Thought & Speech Bubble: strictly disabled during live lyrics playback */}
            {preferences.speech_enabled && !isMediaSessionActive && (
              <SpeechBubble mood={mood} />
            )}
          </>
        )}
      </div>

      {/* Main Character Sprite & Love Hearts (Centered in Viewport so Lulu is never forced down) */}
      <div className="flex-1 w-full flex items-center justify-center relative z-10 pointer-events-auto my-auto">
        <div
          onClick={handleSpriteClick}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (clickTimeoutRef.current) {
              clearTimeout(clickTimeoutRef.current);
              clickTimeoutRef.current = null;
            }
            handleOpenControlCenter();
          }}
          className="relative cursor-pointer pointer-events-auto transform hover:scale-105 active:scale-95 transition-transform flex items-center justify-center select-none"
        >
          {/* Floating Love Heart Particles (100% Lucide SVG Icons) */}
          {showLoveHearts && (
            <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
              <Heart size={22} className="absolute -top-6 text-rose-500 fill-rose-500 animate-bounce drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              <Heart size={18} className="absolute -top-9 -left-5 text-pink-400 fill-pink-400 animate-pulse drop-shadow-[0_0_6px_rgba(244,114,182,0.6)]" />
              <Sparkles size={18} className="absolute -top-8 -right-5 text-purple-400 fill-purple-400 animate-pulse drop-shadow-[0_0_6px_rgba(192,132,252,0.6)]" />
              <Heart size={15} className="absolute top-2 right-9 text-rose-400 fill-rose-400 animate-bounce drop-shadow-[0_0_6px_rgba(251,113,133,0.6)]" />
              <Sparkles size={16} className="absolute top-2 -left-8 text-amber-300 fill-amber-300 animate-pulse drop-shadow-[0_0_6px_rgba(252,211,77,0.6)]" />
            </div>
          )}

          <LuluSprite
            animation={animation}
            mood={mood}
            scale={preferences.scale}
            showShadow={true}
            characterStyle={preferences.character_style || 'shadow_shinobi'}
            cursorOffset={cursorOffset}
            speedMultiplier={speedMultiplier}
            isMusicPlaying={isMusicPlaying}
            fpsLimit={preferences.fps_limit}
            beatPulse={audioState.beatPulse}
            audioEnergy={audioState.audioEnergy}
          />
        </div>
      </div>

      {/* Bottom Section: Lyrics (if bottom hinged) & Quick Action Floating Bar */}
      <div className="w-full flex flex-col items-center gap-1 z-30 pointer-events-none shrink-0 min-h-[24px]">
        {showText && lyricsPosition === 'bottom' && renderLyricsCard()}

        {/* Quick Action Floating Bar on Hover */}
        {isHovered && (
          <div
            onMouseEnter={() => setIsHovered(true)}
            className="flex items-center gap-1 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-xl pointer-events-auto transition-opacity animate-fade-in select-none"
          >
            <button
              onClick={handlePetLulu}
              className="p-1.5 rounded-full hover:bg-rose-500/30 text-rose-300 transition"
              title="Pet Lulu"
            >
              <Heart size={13} />
            </button>

            <button
              onClick={handleSendLove}
              className="p-1.5 rounded-full hover:bg-pink-500/30 text-pink-300 transition"
              title="Lulu Aime (Send Love)"
            >
              <Sparkles size={13} className="text-yellow-300" />
            </button>

            <button
              onClick={handleFeedSnack}
              className="p-1.5 rounded-full hover:bg-amber-500/30 text-amber-300 transition"
              title="Give Snack"
            >
              <Coffee size={13} />
            </button>

            <button
              onClick={handleToggleSleep}
              className={`p-1.5 rounded-full transition ${
                isSleeping
                  ? 'bg-indigo-500/50 text-indigo-200 ring-1 ring-indigo-400'
                  : 'hover:bg-indigo-500/30 text-indigo-300'
              }`}
              title={isSleeping ? (isMusicPlaying ? 'Wake Up (Lullaby Active)' : 'Wake Up') : (isMusicPlaying ? 'Lullaby Sleep Mode' : 'Sleep')}
            >
              <Moon size={13} />
            </button>

            <button
              onClick={() => {
                if (movementPaused) {
                  movementRef.current.resume();
                  setMovementPaused(false);
                  messageManager.enqueue('Movement resumed!', 'normal', 'interaction');
                } else {
                  movementRef.current.pause();
                  setMovementPaused(true);
                  messageManager.enqueue('Movement paused.', 'normal', 'interaction');
                }
              }}
              className={`p-1.5 rounded-full transition ${
                movementPaused ? 'bg-amber-500/30 text-amber-300' : 'hover:bg-white/20 text-gray-300'
              }`}
              title={movementPaused ? 'Resume Movement' : 'Pause Movement'}
            >
              {movementPaused ? <Play size={13} /> : <Pause size={13} />}
            </button>

            {/* Walk Go & Back (Patrol back and forth across screen) */}
            <button
              onClick={handleToggleContinuousWalk}
              className={`p-1.5 rounded-full transition ${
                isContinuousWalking ? 'bg-blue-500/50 text-cyan-200 ring-2 ring-cyan-400 animate-pulse' : 'hover:bg-blue-500/30 text-cyan-300'
              }`}
              title={isContinuousWalking ? 'Stop Walk Go & Back' : 'Walk Go & Back (Patrol Pacing)'}
            >
              <Footprints size={13} />
            </button>

            <button
              onClick={() => {
                setIsFollowingCursor((prev) => {
                  const next = !prev;
                  if (next) {
                    messageManager.enqueue('Following cursor!', 'normal', 'interaction');
                  }
                  return next;
                });
              }}
              className={`p-1.5 rounded-full transition ${
                isFollowingCursor ? 'bg-cyan-500/40 text-cyan-200 ring-1 ring-cyan-400' : 'hover:bg-cyan-500/30 text-cyan-300'
              }`}
              title={isFollowingCursor ? 'Stop Following Cursor' : 'Follow Cursor'}
            >
              <Compass size={13} />
            </button>

            <button
              onClick={handleToggleContinuousRun}
              className={`p-1.5 rounded-full transition ${
                isContinuousRunning ? 'bg-amber-500/50 text-yellow-300 ring-2 ring-yellow-400 animate-pulse' : 'hover:bg-yellow-500/30 text-yellow-300'
              }`}
              title={isContinuousRunning ? 'Stop SHOW RUN' : 'SHOW RUN'}
            >
              <Zap size={13} />
            </button>

            {/* Collapse/Expand Lyrics Quick Action */}
            {isMediaSessionActive && (
              <button
                onClick={() => setIsLyricsCollapsed((p) => !p)}
                className={`p-1.5 rounded-full transition ${
                  isLyricsCollapsed ? 'bg-purple-500/30 text-purple-300' : 'hover:bg-white/20 text-gray-300'
                }`}
                title={isLyricsCollapsed ? 'Expand Lyrics Card' : 'Collapse Lyrics Card to Mini Pill'}
              >
                {isLyricsCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
            )}

            <button
              onClick={() => {
                setShowText((p) => {
                  const next = !p;
                  messageManager.enqueue(next ? 'Text & subtitles visible' : 'Text hidden', 'normal', 'interaction');
                  return next;
                });
              }}
              className={`p-1.5 rounded-full transition ${
                showText ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-white/20 text-gray-400'
              }`}
              title={showText ? 'Hide Text & Subtitles' : 'Show Text & Subtitles'}
            >
              <FileText size={13} />
            </button>

            <button
              onClick={() => {
                setLyricsMode((prev) => {
                  const next = prev === 'auto_lyrics' ? 'normal_text' : 'auto_lyrics';
                  messageManager.enqueue(next === 'auto_lyrics' ? 'Live Lyrics Studio Active' : 'Normal Text Lulu Active', 'normal', 'interaction');
                  return next;
                });
              }}
              className={`p-1.5 rounded-full transition ${
                lyricsMode === 'auto_lyrics' ? 'bg-emerald-500/30 text-emerald-300' : 'hover:bg-purple-500/20 text-purple-300'
              }`}
              title={lyricsMode === 'auto_lyrics' ? 'Switch to Normal Text Lulu' : 'Switch to Live Lyrics'}
            >
              <Music size={13} />
            </button>

            <button
              onClick={handleOpenControlCenter}
              className="p-1.5 rounded-full hover:bg-purple-500/30 text-purple-300 transition"
              title="Open Control Center"
            >
              <Settings size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Right Click Context Menu (100% SVG Icons) */}
      {showContextMenu && (
        <div
          style={{ top: `${contextPos.y}px`, left: `${contextPos.x}px` }}
          className="fixed z-50 bg-[#1e1e2e]/95 border border-[#313244] rounded-xl shadow-2xl py-1 text-xs text-gray-200 min-w-[190px] overflow-hidden backdrop-blur-md"
        >
          {/* Header */}
          <div className="px-3 py-1.5 font-bold text-white flex items-center gap-2 select-none text-[13px]">
            <PawPrint size={14} className="text-purple-400" />
            <span>Lulu</span>
          </div>

          <div className="h-[1px] bg-[#313244] my-1" />

          {/* Walk Go & Back */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              handleToggleContinuousWalk();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-cyan-300 font-semibold"
          >
            <Footprints size={13} className="text-cyan-400" />
            <span>{isContinuousWalking ? 'Stop Walk Go & Back' : 'Walk Go & Back'}</span>
          </button>

          {/* Flame Sprint */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              handleStart40sRun();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-yellow-600 hover:text-white flex items-center gap-2 text-yellow-300 font-semibold"
          >
            <Flame size={13} className="text-yellow-400" />
            <span>{is40sRunActive ? 'Stop Sprint' : 'Flame Sprint'}</span>
          </button>

          {/* SHOW RUN */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              handleToggleContinuousRun();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-yellow-600 hover:text-white flex items-center gap-2 text-amber-300 font-semibold"
          >
            <Zap size={13} className="text-amber-400" />
            <span>{isContinuousRunning ? 'Stop SHOW RUN' : 'SHOW RUN'}</span>
          </button>

          {/* Pause */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              movementRef.current.pause();
              setMovementPaused(true);
              messageManager.enqueue('Movement paused.', 'normal', 'interaction');
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-600 hover:text-white flex items-center gap-2 text-gray-300"
          >
            <Pause size={13} className="text-gray-400" />
            <span>Pause Movement</span>
          </button>

          {/* Resume */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              movementRef.current.resume();
              setMovementPaused(false);
              messageManager.enqueue('Movement resumed!', 'normal', 'interaction');
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-600 hover:text-white flex items-center gap-2 text-gray-300"
          >
            <Play size={13} className="text-emerald-400" />
            <span>Resume Movement</span>
          </button>

          {/* Step Down / Sit */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              setIsSleeping(false);
              setAnimation('sit');
              messageManager.enqueue('Resting peacefully cross-legged...', 'normal', 'interaction');
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-600 hover:text-white flex items-center gap-2 text-emerald-300 font-semibold"
          >
            <Armchair size={13} className="text-emerald-400" />
            <span>Step Down / Sit</span>
          </button>

          {/* Zen Slumber / Lullaby Sleep */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              setIsSleeping(true);
              isSleepingRef.current = true;
              setAnimation('sleep');
              if (isMusicPlaying) {
                messageManager.enqueue('Peaceful Lullaby Mode • Sleeping soundly to the melody...', 'normal', 'interaction');
              } else {
                messageManager.enqueue('Zzz... Peacefully resting soundly.', 'normal', 'interaction');
              }
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2 text-indigo-300 font-semibold"
          >
            <Moon size={13} className="text-indigo-400" />
            <span>{isMusicPlaying ? 'Lullaby Sleep' : 'Zen Slumber'}</span>
          </button>

          <div className="h-[1px] bg-[#313244] my-1" />

          {/* Open Chat */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              messageManager.reopenLatest();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-600 hover:text-white flex items-center gap-2 text-gray-300"
          >
            <MessageSquare size={13} className="text-purple-400" />
            <span>Open Chat</span>
          </button>

          {/* Toggle Text / Subtitles */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              setShowText((p) => {
                const next = !p;
                messageManager.enqueue(next ? 'Text & subtitles visible' : 'Text hidden', 'normal', 'interaction');
                return next;
              });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 text-cyan-300 font-medium"
          >
            <FileText size={13} className="text-cyan-400" />
            <span>{showText ? 'Hide Text' : 'Show Text'}</span>
          </button>

          {/* Live Lyrics / Normal Text Mode Toggle */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              setLyricsMode((prev) => {
                const next = prev === 'auto_lyrics' ? 'normal_text' : 'auto_lyrics';
                messageManager.enqueue(next === 'auto_lyrics' ? 'Live Lyrics Studio Active' : 'Normal Text Lulu Active', 'normal', 'interaction');
                return next;
              });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-600 hover:text-white flex items-center gap-2 text-emerald-300 font-medium"
          >
            <Music size={13} className="text-emerald-400" />
            <span>{lyricsMode === 'auto_lyrics' ? 'Mode: Live Lyrics' : 'Mode: Normal Text'}</span>
          </button>

          {/* Toggle All Lyrics View */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              setShowAllLyrics((p) => {
                const next = !p;
                messageManager.enqueue(next ? 'Showing full lyrics scroll' : 'Showing 3-line focused lyrics', 'normal', 'interaction');
                return next;
              });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-pink-600 hover:text-white flex items-center gap-2 text-pink-300 font-medium"
          >
            <ListMusic size={13} className="text-pink-400" />
            <span>{showAllLyrics ? '3-Line Focus View' : 'Show All Lyrics'}</span>
          </button>

          {/* Collapse / Expand Lyrics Mini Pill */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              setIsLyricsCollapsed((p) => {
                const next = !p;
                messageManager.enqueue(next ? 'Lyrics collapsed to mini pill' : 'Lyrics expanded to full card', 'normal', 'interaction');
                return next;
              });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-blue-300 font-medium"
          >
            {isLyricsCollapsed ? <ChevronDown size={13} className="text-blue-400" /> : <ChevronUp size={13} className="text-blue-400" />}
            <span>{isLyricsCollapsed ? 'Expand Lyrics Card' : 'Collapse to Mini Pill'}</span>
          </button>

          {/* Hinge Lyrics: Top vs Bottom */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              setLyricsPosition((p) => {
                const next = p === 'top' ? 'bottom' : 'top';
                messageManager.enqueue(`Lyrics hinged at ${next}`, 'normal', 'interaction');
                return next;
              });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2 text-indigo-300 font-medium"
          >
            <ArrowUpDown size={13} className="text-indigo-400" />
            <span>{lyricsPosition === 'top' ? 'Hinge Lyrics: Bottom' : 'Hinge Lyrics: Top'}</span>
          </button>

          {/* Boundary Physics Mode: Screen Wrap vs Edge Bounce */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              const nextMode = boundaryMode === 'wrap' ? 'bounce' : 'wrap';
              setBoundaryMode(nextMode);
              movementRef.current.setBoundaryPhysicsMode(nextMode);
              messageManager.enqueue(nextMode === 'wrap' ? 'Screen Wrapping enabled!' : 'Edge Bounce physics enabled!', 'normal', 'interaction');
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-600 hover:text-white flex items-center gap-2 text-purple-300 font-medium"
          >
            {boundaryMode === 'wrap' ? <Zap size={13} className="text-amber-400" /> : <RotateCcw size={13} className="text-purple-400" />}
            <span>{boundaryMode === 'wrap' ? 'Mode: Screen Wrap' : 'Mode: Edge Bounce'}</span>
          </button>

          {/* Sound FX Mute Toggle */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              const muted = soundFxEngine.toggleMute();
              messageManager.enqueue(muted ? 'Sound effects muted' : 'Sound effects unmuted', 'normal', 'interaction');
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-pink-600 hover:text-white flex items-center gap-2 text-pink-300 font-medium"
          >
            {isSoundMuted ? <VolumeX size={13} className="text-rose-400" /> : <Volume2 size={13} className="text-pink-400" />}
            <span>{isSoundMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}</span>
          </button>

          <div className="h-[1px] bg-[#313244] my-1" />

          {/* Control Center */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              handleOpenControlCenter();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-600 hover:text-white flex items-center gap-2 text-purple-300 font-medium"
          >
            <Settings size={13} className="text-purple-400" />
            <span>Control Center</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              handleOpenControlCenter();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-600 hover:text-white flex items-center gap-2 text-gray-300"
          >
            <Sliders size={13} className="text-gray-400" />
            <span>Settings</span>
          </button>

          {/* Quit */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              invokeCommand('exit_app').catch(() => window.close());
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-red-600 hover:text-white flex items-center gap-2 text-red-400 font-medium"
          >
            <LogOut size={13} className="text-red-400" />
            <span>Quit Lulu</span>
          </button>
        </div>
      )}
    </div>
  );
};
