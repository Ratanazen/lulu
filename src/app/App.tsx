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
import { Heart, Coffee, Moon, Settings, Sparkles, Footprints, Music, Bell, Compass, Zap, FileText } from 'lucide-react';
import { spotifyLyricsService } from '../features/lyrics/spotifyLyricsService';
import { ParsedLrc } from '../features/lyrics/lrcParser';
import { MediaSession, normalizeMediaSession, getProviderTheme } from '../features/media/mediaSession';

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
  const [is40sRunActive, setIs40sRunActive] = useState(false);
  const [spotifyLyrics, setSpotifyLyrics] = useState<ParsedLrc | null>(null);
  const [prevLyricText, setPrevLyricText] = useState<string | null>(null);
  const [activeLyricText, setActiveLyricText] = useState<string | null>(null);
  const [nextLyricText, setNextLyricText] = useState<string | null>(null);
  const [currentSpotifyTrack, setCurrentSpotifyTrack] = useState<{ artist: string; title: string } | null>(null);
  const [activeMediaSession, setActiveMediaSession] = useState<MediaSession | null>(null);
  const [musicPositionSecs, setMusicPositionSecs] = useState<number>(0);
  const [musicDurationSecs, setMusicDurationSecs] = useState<number>(0);
  const [systemTelemetry, setSystemTelemetry] = useState<SystemTelemetry | null>(null);

  // Flame speed multiplier: default 1.0 (Normal & Smooth)
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [showText, setShowText] = useState<boolean>(true);
  const [lyricsMode, setLyricsMode] = useState<'auto_lyrics' | 'normal_text'>('auto_lyrics');

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

  // Keep MovementEngine synchronized with speedMultiplier
  useEffect(() => {
    movementRef.current.setSpeedMultiplier(speedMultiplier);
  }, [speedMultiplier]);

  const getActionBadgeText = (anim: string, mult: number): string => {
    const speedTag = mult < 0.9 ? ' (Relaxed)' : mult > 1.1 ? ' (Fast)' : '';
    if (anim.startsWith('run')) return `⚡ Sprint${speedTag}`;
    if (anim.startsWith('walk')) return `🐾 Desktop Patrol${speedTag}`;
    if (anim === 'sing') return `🎤 Singing Lip-Sync${speedTag}`;
    if (anim === 'dance') return `💃 Chakra Dance${speedTag}`;
    if (anim === 'happy') return `✨ Flame Celebration${speedTag}`;
    if (anim === 'protect') return `🛡️ Susanoo Defense`;
    if (anim === 'wave') return `👋 Ninja Salute`;
    if (anim === 'sad') return `🧘 Deep Contemplation`;
    if (anim === 'sleep') return `🌙 Peaceful Rest`;
    return `🔥 ${anim}`;
  };

  const getNormalLuluText = (anim: string, moodState: MoodType, sleeping: boolean, mult: number): string => {
    if (sleeping || anim === 'sleep') return '😴 Peaceful Slumber • Zzz...';
    if (anim === 'sit') return '🧘 Step Down Zen • Deep Peace';
    if (anim.startsWith('run')) return `⚡ Shinobi Sprint${mult > 1.1 ? ' (Hyper)' : ''} • Patrolling`;
    if (anim.startsWith('walk')) return '🐾 Desktop Patrol • Wandering';
    if (anim === 'sing') return '🎤 Singing to Melody • Joyful Spirit';
    if (anim === 'dance') return '💃 Chakra Dance • Pure Joy';
    if (anim === 'protect') return '🛡️ Susanoo Defense • Guarding Screen';
    if (anim === 'happy') return '✨ Shinobi Spirit • Radiant Chakra';
    if (anim === 'sad') return '🧘 Deep Stillness • Meditating';

    switch (moodState) {
      case 'happy':
        return '💖 Lulu • Peaceful & Content';
      case 'playful':
        return '✨ Lulu • Ready for Action';
      case 'curious':
        return '🐾 Lulu • Watching Over Desktop';
      case 'tired':
        return '🌙 Lulu • Resting Gently';
      case 'calm':
        return '🍃 Lulu • Calm & Mindful';
      default:
        return '🐾 Lulu • Shinobi Companion';
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
        }

        // Welcome speech line
        messageManager.enqueue('Wake up to reality! Lulu is ready. ⚔️', 'high', 'startup');
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
          messageManager.enqueue('💻 Follow Computer System mode activated! ⚡', 'high', 'interaction');
          return;
        }
        if (item.title === '__LULU_CMD_SIT__') {
          setIsSleeping(false);
          setAnimation('sit');
          messageManager.enqueue('Taking a calm cross-legged breather... 🧘✨', 'high', 'interaction');
          return;
        }
        if (item.title === '__LULU_CMD_SLEEP__') {
          setIsSleeping(true);
          setAnimation('sleep');
          messageManager.enqueue('Zzz... Peacefully resting soundly. 😴🌙', 'high', 'interaction');
          return;
        }
        if (item.title === '__LULU_CMD_SING__') {
          setIsSleeping(false);
          setAnimation('sing');
          messageManager.enqueue('🎤 ♪ Singing karaoke with joy! ♪ ✨', 'high', 'music');
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

  // Periodic System Telemetry Poller (Computer CPU, RAM, Battery, OS)
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const sys = await invokeCommand<any>('get_system_info');
        if (sys) {
          setSystemTelemetry({
            cpuPercent: sys.cpu?.global_usage_percent ?? 0,
            cpuCores: sys.cpu?.logical_cores,
            memUsedMb: sys.memory?.used_mb ?? 0,
            memTotalMb: sys.memory?.total_mb ?? 0,
            memPercent: sys.memory?.usage_percent ?? 0,
            batteryPercent: sys.power?.battery_level_percent,
            isCharging: sys.power?.is_charging,
            osName: sys.os?.name ? `${sys.os.name} ${sys.os.kernel_version || ''}`.trim() : undefined,
            profile: sys.active_profile,
          });
        }
      } catch {}
    };

    fetchTelemetry();
    const telemetryTimer = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(telemetryTimer);
  }, []);

  // 4. Media & Lyrics Poller (MPRIS, Spotify, YouTube, YouTube Music)
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

          if (session.playing) {
            if (!isMusicPlayingRef.current) {
              isMusicPlayingRef.current = true;
              setIsMusicPlaying(true);
              setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'dance'));
              eventBus.emit('music:playback_changed', { status: 'Playing', title: normalized.title });
            }

            // Synced Lyrics Detection & Realtime Line Match
            const trackKey = `${normalized.artist} - ${normalized.title}`.toLowerCase().trim();
            const trackChanged =
              !currentSpotifyTrackRef.current ||
              currentSpotifyTrackRef.current.artist !== normalized.artist ||
              currentSpotifyTrackRef.current.title !== normalized.title;

            if (trackChanged && normalized.title) {
              currentSpotifyTrackRef.current = { artist: normalized.artist, title: normalized.title };
              setCurrentSpotifyTrack({ artist: normalized.artist, title: normalized.title });
            }

            if (
              (trackChanged || (!lyricsRef.current && lastFetchedKeyRef.current !== trackKey)) &&
              !isFetchingLyricsRef.current &&
              normalized.title
            ) {
              isFetchingLyricsRef.current = true;
              lastFetchedKeyRef.current = trackKey;
              lyricsRef.current = null;
              setSpotifyLyrics(null);

              spotifyLyricsService
                .getLyricsForTrack(normalized.artist, normalized.title, durSecs)
                .then((lrc) => {
                  lyricsRef.current = lrc;
                  setSpotifyLyrics(lrc);
                  if (lrc) {
                    const lineInfo = spotifyLyricsService.getSyncedLyricsLines(lrc, posSecs);
                    setPrevLyricText(lineInfo.previous);
                    setActiveLyricText(lineInfo.current);
                    setNextLyricText(lineInfo.next);
                    if (lineInfo.current) {
                      setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'sing'));
                    } else {
                      setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'dance'));
                    }
                  } else {
                    setPrevLyricText(null);
                    setActiveLyricText(null);
                    setNextLyricText(null);
                    setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'dance'));
                  }
                })
                .finally(() => {
                  isFetchingLyricsRef.current = false;
                });
            } else if (lyricsRef.current) {
              const lineInfo = spotifyLyricsService.getSyncedLyricsLines(lyricsRef.current, posSecs);
              setPrevLyricText(lineInfo.previous);
              setActiveLyricText(lineInfo.current);
              setNextLyricText(lineInfo.next);
              if (lineInfo.current) {
                setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'sing'));
              } else {
                setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'dance'));
              }
            }
          } else {
            // Paused: freeze lyrics and set paused state
            if (isMusicPlayingRef.current) {
              isMusicPlayingRef.current = false;
              setIsMusicPlaying(false);
              setAnimation((prev) => (prev === 'dance' || prev === 'sing' ? 'idle' : prev));
              eventBus.emit('music:playback_changed', { status: 'Paused' });
            }
          }
        } else {
          // No media session
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
            setAnimation((prev) => (prev === 'dance' || prev === 'sing' ? 'idle' : prev));
            eventBus.emit('music:playback_changed', { status: 'Paused' });
          }
        }
      } catch {}
    }, 250);

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
    "Wake up to reality... I acknowledge your greatness! 🔥✨",
    "Would you like these clones to use Susanoo or not? ⚡❤️",
    "Hmph... Even the legendary shinobi needs a loyal comrade. ⚔️💕",
    "These hands were forged for battle... but your bond is worthy! ✨",
    "A legendary warrior's bond transcends all boundaries! 💥❤️",
  ];

  const ANIME_AFFECTION_LINES = [
    "Lulu t'aime de tout son cœur! ❤️✨",
    "Nyaa~ Daisuki dayo! (♥‿♥) ✨",
    "Lulu loves you so much! 🥰💕",
    "Je t'aime! Tu es le meilleur! 💖",
    "Purr... Lulu is so happy with you! ✨❤️",
  ];

  // Affection burst (Lulu Aime / Shinobi Bond)
  const handleSendLove = () => {
    needSystemRef.current.petInteraction();
    needSystemRef.current.feedSnack();
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
    setNeeds(needSystemRef.current.getNeeds());
    setAnimation('happy');
    setShowLoveHearts(true);
    const pool = (preferences.character_style || 'shadow_shinobi') === 'shadow_shinobi'
      ? [
          "Hmph! You dare pat the legendary shinobi? ...Do not stop. (⁄ ⁄•⁄ω⁄•⁄ ⁄)",
          "A true warrior appreciates such gentle treatment. ⚔️✨",
          "The Gunbai is ready. Our power is unmatched! 💥",
        ]
      : [
          "Nyaa~ That tickles! Daisuki! ❤️",
          "Hehe, Lulu loves headpats! ✨",
          "Purr... Lulu t'aime! 💕",
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
    setNeeds(needSystemRef.current.getNeeds());
    setAnimation('happy');
    messageManager.enqueue('Yummy! Delicious snack! 🧁', 'high', 'interaction');
    setTimeout(() => setAnimation(isSleeping ? 'sleep' : isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle'), 2500);
  };

  const handleToggleSleep = () => {
    if (isSleeping) {
      needSystemRef.current.wakeUp();
      setIsSleeping(false);
      setAnimation('wake');
      messageManager.enqueue('Yawn... Awake and ready! ✨', 'normal', 'interaction');
      setTimeout(() => setAnimation(isMusicPlaying ? (activeLyricText ? 'sing' : 'dance') : 'idle'), 1500);
    } else {
      setIsSleeping(true);
      setAnimation('sleep');
      messageManager.enqueue('Zzz... Good night~ 🌙', 'normal', 'interaction');
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
      messageManager.enqueue('SHOW RUN active! Continuous sprint! ⚡🏃💨', 'normal', 'interaction');
    } else {
      messageManager.enqueue('Sprint paused. Catching breath! 🍃', 'normal', 'interaction');
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
      messageManager.enqueue('Sprint paused. Catching breath! 🍃', 'normal', 'interaction');
      return;
    }
    setIs40sRunActive(true);
    setIsContinuousRunning(true);
    messageManager.enqueue('Flame Sprint active! ⚡🏃💨', 'high', 'interaction');
    movementRef.current.startTimedRun(40, () => {
      setIs40sRunActive(false);
      setIsContinuousRunning(false);
      messageManager.enqueue('Sprint complete! Full speed achieved! 🏆🔥', 'high', 'interaction');
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

  // Single Click: Jump or Pet reaction
  const handlePetClick = () => {
    if (isSleeping) {
      handleToggleSleep();
    } else {
      setAnimation('jump');
      handlePetLulu();
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
    } catch {
      await invokeCommand('set_window_size', { width: 820, height: 680 });
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
      await invokeCommand('set_window_size', { width: 260, height: 300 });
      if (!movementPaused && !isSleeping) {
        movementRef.current.resume();
      }
    } catch {}
  };

  const handleUnlockAll = () => {
    setAnimation('happy');
    setShowLoveHearts(true);
    messageManager.enqueue('🎉 All 9 Master Flames and 12 Shinobi Tasks are 100% Unlocked! 💥✨', 'high', 'interaction');
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

  return (
    <div
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
      onClick={() => setShowContextMenu(false)}
      className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center select-none bg-transparent"
      style={{ background: 'transparent' }}
    >
      {/* Drag handle container allowing window dragging via data-tauri-drag-region */}
      <div
        data-tauri-drag-region
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
        title="Drag Lulu anywhere on your screen"
      />

      {/* Unified Text & Subtitle Displays (Show Txt: ON) */}
      {showText && (
        <div className="absolute top-2 left-0 right-0 z-40 flex flex-col items-center gap-1.5 pointer-events-none px-2">
          {/* 1. Multi-Provider Synced Live-Time Lyrics Card (Exact 3-Line Blueprint) */}
          {isMusicPlaying && lyricsMode === 'auto_lyrics' && (
            <div
              className={`max-w-[320px] w-full px-4 py-2.5 rounded-2xl bg-[#090d16]/95 border ${mediaTheme.borderColor} flex flex-col gap-1.5 pointer-events-auto transition-all duration-300 animate-fade-in group cursor-pointer backdrop-blur-md`}
              style={{ boxShadow: `0 8px 28px ${mediaTheme.glowColor}` }}
              title={`Click to open Lyrics Studio (${mediaTheme.badgeText})`}
              onClick={handleOpenControlCenter}
            >
              {/* Header: Lulu + Equalizer & Live Synced Badge */}
              <div
                className="flex items-center justify-between pb-1"
                style={{ borderBottom: `1px solid ${mediaTheme.primaryColor}33` }}
              >
                <span className="text-[11px] font-bold text-white tracking-wide flex items-center gap-1.5">
                  🐾 <span style={{ color: mediaTheme.accentColor }}>Lulu</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-end gap-0.5 h-2.5 shrink-0">
                    <span className="w-0.5 rounded-full animate-pulse h-1.5" style={{ backgroundColor: mediaTheme.primaryColor }} />
                    <span className="w-0.5 rounded-full animate-bounce h-2.5" style={{ backgroundColor: mediaTheme.primaryColor }} />
                    <span className="w-0.5 rounded-full animate-pulse h-1.5" style={{ backgroundColor: mediaTheme.accentColor }} />
                    <span className="w-0.5 rounded-full animate-bounce h-2" style={{ backgroundColor: mediaTheme.primaryColor }} />
                  </div>
                  <span
                    className="text-[9px] font-semibold uppercase tracking-wider flex items-center gap-1"
                    style={{ color: mediaTheme.accentColor }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-ping inline-block" style={{ backgroundColor: mediaTheme.accentColor }} />
                    {mediaTheme.badgeIcon} {mediaTheme.badgeText}
                  </span>
                </div>
              </div>

              {/* Artist - Song Header */}
              <div className="text-center pt-0.5">
                <p className="text-[10px] font-bold text-gray-300 truncate tracking-wide">
                  {currentSpotifyTrack?.artist || mediaTheme.badgeText} - {currentSpotifyTrack?.title || 'Unknown Track'}
                </p>
              </div>

              {/* 3-Line Synced Lyrics Display */}
              <div className="flex flex-col items-center gap-1 py-1 min-h-[58px] justify-center text-center">
                {/* previous line */}
                <p className="text-[10px] text-gray-400/70 truncate max-w-full px-1 font-medium select-none transition-all duration-300">
                  {prevLyricText ? prevLyricText : '···'}
                </p>

                {/* ► CURRENT LYRIC ◄ */}
                <p
                  className="text-[12px] font-extrabold line-clamp-2 px-1 leading-snug tracking-wide transition-all duration-200"
                  style={{
                    color: mediaTheme.accentColor,
                    filter: `drop-shadow(0 0 10px ${mediaTheme.glowColor})`,
                  }}
                >
                  ► {activeLyricText ? activeLyricText : (nextLyricText ? '♪ Instrumental Melody ♪' : 'Singing to the rhythm...')} ◄
                </p>

                {/* next line */}
                <p
                  className="text-[10px] truncate max-w-full px-1 font-medium select-none italic transition-all duration-300"
                  style={{ color: mediaTheme.accentColor, opacity: 0.6 }}
                >
                  {nextLyricText ? nextLyricText : '···'}
                </p>
              </div>

              {/* Progress Bar & 01:24 / 03:45 Timestamp */}
              <div className="space-y-1 pt-0.5">
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
                    className="text-[9px] font-mono font-bold bg-black/60 px-2 py-0.5 rounded border"
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
          )}

          {/* 2. Floating Follow Computer Telemetry Badge (When in SYSTEM_SYNC mode & not in live lyrics) */}
          {(!isMusicPlaying || lyricsMode === 'normal_text') && preferences.behavior_mode === 'SYSTEM_SYNC' && systemTelemetry && (
            <div className="max-w-[260px] px-3 py-1 rounded-full bg-[#0f172a]/95 border border-cyan-500/60 shadow-[0_4px_16px_rgba(6,182,212,0.35)] flex items-center gap-1.5 pointer-events-none transition-all duration-300 animate-fade-in backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="text-[10px] font-bold text-cyan-200 truncate">
                💻 System Follow: CPU {Math.round(systemTelemetry.cpuPercent)}% • RAM {Math.round(systemTelemetry.memPercent)}%
              </span>
            </div>
          )}

          {/* 3. Floating Normal Lulu Text Badge (When not playing live lyrics & not in system sync) */}
          {(!isMusicPlaying || lyricsMode === 'normal_text') && preferences.behavior_mode !== 'SYSTEM_SYNC' && (
            <div
              onClick={handlePetClick}
              className="max-w-[260px] px-3.5 py-1 rounded-full bg-[#0b0f19]/90 border border-purple-500/50 shadow-[0_4px_16px_rgba(168,85,247,0.35)] flex items-center gap-1.5 pointer-events-auto cursor-pointer transition-all duration-300 animate-fade-in backdrop-blur-md hover:border-purple-400 group"
              title="Lulu Normal Status — Click to interact"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[10px] font-bold text-purple-200 truncate group-hover:text-white transition-colors">
                {getNormalLuluText(animation, mood, isSleeping, speedMultiplier)}
              </span>
            </div>
          )}

          {/* 4. Thought & Speech Bubble: strictly disabled during live lyrics playback */}
          {preferences.speech_enabled && (!isMusicPlaying || lyricsMode === 'normal_text') && (
            <SpeechBubble mood={mood} />
          )}
        </div>
      )}

      {/* Main Character Sprite & Love Hearts */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handlePetClick}
        onDoubleClick={handleDoubleClick}
        className="relative z-10 cursor-pointer pointer-events-auto transform hover:scale-105 active:scale-95 transition-transform mt-5"
      >
        {/* Floating Love Heart Particles */}
        {showLoveHearts && (
          <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
            <span className="absolute -top-6 text-rose-500 animate-bounce text-xl">❤️</span>
            <span className="absolute -top-9 -left-5 text-pink-400 animate-pulse text-lg">💖</span>
            <span className="absolute -top-8 -right-5 text-purple-400 animate-pulse text-base">✨</span>
            <span className="absolute top-2 right-9 text-rose-400 animate-bounce text-sm">💕</span>
            <span className="absolute top-2 -left-8 text-amber-300 animate-pulse text-sm">⭐</span>
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
        />
      </div>

      {/* Quick Action Floating Bar on Hover */}
      {isHovered && (
        <div className="absolute bottom-2 z-20 flex items-center gap-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-xl pointer-events-auto transition-opacity animate-fade-in">
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
            title="Lulu Aime (Send Love ❤️)"
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
            className="p-1.5 rounded-full hover:bg-indigo-500/30 text-indigo-300 transition"
            title={isSleeping ? 'Wake Up' : 'Sleep'}
          >
            <Moon size={13} />
          </button>

          <button
            onClick={() => setMovementPaused((p) => !p)}
            className={`p-1.5 rounded-full transition ${
              movementPaused ? 'bg-amber-500/30 text-amber-300' : 'hover:bg-white/20 text-gray-300'
            }`}
            title={movementPaused ? 'Resume Movement' : 'Pause Movement'}
          >
            <Footprints size={13} />
          </button>

          <button
            onClick={() => {
              setIsFollowingCursor((prev) => {
                const next = !prev;
                if (next) {
                  messageManager.enqueue('Following cursor! ⚡', 'normal', 'interaction');
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

          <button
            onClick={() => {
              setShowText((p) => {
                const next = !p;
                messageManager.enqueue(next ? 'Text & subtitles visible 💬' : 'Text hidden 🤫', 'normal', 'interaction');
                return next;
              });
            }}
            className={`p-1.5 rounded-full transition ${
              showText ? 'bg-cyan-500/30 text-cyan-300' : 'hover:bg-white/20 text-gray-400'
            }`}
            title={showText ? 'Hide Text & Subtitles (Show Txt: ON)' : 'Show Text & Subtitles (Show Txt: OFF)'}
          >
            <FileText size={13} />
          </button>

          <button
            onClick={() => {
              setLyricsMode((prev) => {
                const next = prev === 'auto_lyrics' ? 'normal_text' : 'auto_lyrics';
                messageManager.enqueue(next === 'auto_lyrics' ? '🎵 Live Lyrics Studio Active' : '🐾 Normal Text Lulu Active', 'normal', 'interaction');
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

      {/* Right Click Context Menu (Section 10) */}
      {/* Right Click Context Menu (Requirement 17) */}
      {showContextMenu && (
        <div
          style={{ top: `${contextPos.y}px`, left: `${contextPos.x}px` }}
          className="fixed z-50 bg-[#1e1e2e]/95 border border-[#313244] rounded-xl shadow-2xl py-1 text-xs text-gray-200 min-w-[175px] overflow-hidden backdrop-blur-md"
        >
          {/* Header */}
          <div className="px-3 py-1.5 font-bold text-white flex items-center gap-1.5 select-none text-[13px]">
            🐾 <span>Lulu</span>
          </div>

          <div className="h-[1px] bg-[#313244] my-1" />

          {/* ⚡ Flame Sprint */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              handleStart40sRun();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-yellow-600 hover:text-white flex items-center gap-2 text-yellow-300 font-semibold"
          >
            <Zap size={13} className="text-yellow-400" />
            <span>{is40sRunActive ? 'Stop Sprint ⚡' : '⚡ Flame Sprint'}</span>
          </button>

          {/* ⚡ SHOW RUN */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              handleToggleContinuousRun();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-yellow-600 hover:text-white flex items-center gap-2 text-amber-300 font-semibold"
          >
            <Zap size={13} className="text-amber-400" />
            <span>{isContinuousRunning ? 'Stop SHOW RUN ⚡' : '⚡ SHOW RUN'}</span>
          </button>

          {/* ⏸ Pause */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              movementRef.current.pause();
              setMovementPaused(true);
              messageManager.enqueue('Movement paused. ⏸', 'normal', 'interaction');
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-600 hover:text-white flex items-center gap-2 text-gray-300"
          >
            <span>⏸ Pause</span>
          </button>

          {/* ▶ Resume */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              movementRef.current.resume();
              setMovementPaused(false);
              messageManager.enqueue('Movement resumed! ▶', 'normal', 'interaction');
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-600 hover:text-white flex items-center gap-2 text-gray-300"
          >
            <span>▶ Resume</span>
          </button>

          {/* 🧘 Step Down / Sit */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              setIsSleeping(false);
              setAnimation('sit');
              messageManager.enqueue('Resting peacefully cross-legged... 🧘✨', 'normal', 'interaction');
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-600 hover:text-white flex items-center gap-2 text-emerald-300 font-semibold"
          >
            <span>🧘 Step Down / Sit</span>
          </button>

          {/* 😴 Zen Slumber */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              setIsSleeping(true);
              setAnimation('sleep');
              messageManager.enqueue('Zzz... Peacefully resting soundly. 😴🌙', 'normal', 'interaction');
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white flex items-center gap-2 text-indigo-300 font-semibold"
          >
            <span>😴 Zen Slumber</span>
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
            <span>💬 Open Chat</span>
          </button>

          {/* 💬 Toggle Text / Subtitles */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              setShowText((p) => {
                const next = !p;
                messageManager.enqueue(next ? 'Text & subtitles visible 💬' : 'Text hidden 🤫', 'normal', 'interaction');
                return next;
              });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white flex items-center gap-2 text-cyan-300 font-medium"
          >
            <FileText size={13} />
            <span>{showText ? '💬 Hide Text' : '💬 Show Text'}</span>
          </button>

          {/* 🎵 Live Lyrics / Normal Text Mode Toggle */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              setLyricsMode((prev) => {
                const next = prev === 'auto_lyrics' ? 'normal_text' : 'auto_lyrics';
                messageManager.enqueue(next === 'auto_lyrics' ? '🎵 Live Lyrics Studio Active' : '🐾 Normal Text Lulu Active', 'normal', 'interaction');
                return next;
              });
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-600 hover:text-white flex items-center gap-2 text-emerald-300 font-medium"
          >
            <Music size={13} />
            <span>{lyricsMode === 'auto_lyrics' ? '🎵 Mode: Live Lyrics' : '🐾 Mode: Normal Text'}</span>
          </button>

          {/* Control Center */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              handleOpenControlCenter();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-purple-600 hover:text-white flex items-center gap-2 text-purple-300 font-medium"
          >
            <Settings size={13} />
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
            <span>🎨 Settings</span>
          </button>

          {/* Quit */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              invokeCommand('exit_app').catch(() => window.close());
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-red-600 hover:text-white flex items-center gap-2 text-red-400 font-medium"
          >
            <span>🚪 Quit</span>
          </button>
        </div>
      )}

      {/* Control Center Modal */}
      <ControlCenterModal
        isOpen={isControlCenterOpen}
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
            movementRef.current.sprintLap();
          } else {
            setAnimation(anim as AnimationState);
          }
        }}
        onTriggerFocusEvent={handleTriggerFocusEvent}
        focusIntervalSeconds={focusIntervalSeconds}
        onSetFocusInterval={setFocusIntervalSeconds}
        isContinuousRunning={isContinuousRunning}
        onToggleContinuousRun={handleToggleContinuousRun}
        is40sRunActive={is40sRunActive}
        onStart40sRun={handleStart40sRun}
        parsedLrc={spotifyLyrics}
        onStopMovement={() => {
          movementRef.current.stop();
          setIs40sRunActive(false);
          setIsContinuousRunning(false);
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
            messageManager.enqueue(next === 'auto_lyrics' ? '🎵 Live Lyrics Studio Active' : '🐾 Normal Text Lulu Active', 'normal', 'interaction');
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
      />
    </div>
  );
};
