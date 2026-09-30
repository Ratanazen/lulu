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
} from '../types/pet';
import { Heart, Coffee, Moon, Settings, Sparkles, Footprints, Music, Bell, Compass, Zap } from 'lucide-react';
import { spotifyLyricsService } from '../features/lyrics/spotifyLyricsService';
import { ParsedLrc } from '../features/lyrics/lrcParser';

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
  const [activeLyricText, setActiveLyricText] = useState<string | null>(null);
  const [currentSpotifyTrack, setCurrentSpotifyTrack] = useState<{ artist: string; title: string } | null>(null);

  const [preferences, setPreferences] = useState<PetPreferences>({
    scale: 1.0,
    theme: 'Lulu Dark',
    character_style: 'shadow_shinobi',
    behavior_mode: 'NORMAL',
    wander_speed: 1.0,
    speech_enabled: true,
    sound_volume: 0.8,
    always_on_top: true,
    fps_limit: 60,
  });

  const needSystemRef = useRef<NeedSystem>(new NeedSystem());
  const movementRef = useRef<MovementEngine>(new MovementEngine());
  const behaviorRef = useRef<BehaviorEngine>(new BehaviorEngine());

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
        // Trigger surprised alert animation
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
  }, [isSleeping, isMusicPlaying, activeLyricText]);

  // 4. MPRIS Music Status Poller & Spotify Synced Lyrics (Section 16)
  useEffect(() => {
    const musicTimer = setInterval(async () => {
      try {
        const status = await invokeCommand<any>('get_music_status');
        if (status && status.playback_status === 'Playing') {
          if (!isMusicPlaying) {
            setIsMusicPlaying(true);
            setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'dance'));
            eventBus.emit('music:playback_changed', { status: 'Playing', title: status.title });
          }

          // Spotify Synced Lyrics Detection & Realtime Line Match
          const trackChanged =
            !currentSpotifyTrack ||
            currentSpotifyTrack.artist !== status.artist ||
            currentSpotifyTrack.title !== status.title;

          if (trackChanged && status.title) {
            setCurrentSpotifyTrack({ artist: status.artist, title: status.title });
            const lrc = await spotifyLyricsService.getLyricsForTrack(status.artist, status.title);
            setSpotifyLyrics(lrc);
            if (lrc) {
              const line = spotifyLyricsService.getActiveLine(lrc, status.position_secs);
              setActiveLyricText(line);
              if (line) {
                setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'sing'));
              } else {
                setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'dance'));
              }
            } else {
              setActiveLyricText(null);
              setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'dance'));
            }
          } else if (spotifyLyrics) {
            const line = spotifyLyricsService.getActiveLine(spotifyLyrics, status.position_secs);
            setActiveLyricText(line);
            if (line) {
              setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'sing'));
            } else {
              setAnimation((prev) => (prev.startsWith('walk') || prev.startsWith('run') ? prev : 'dance'));
            }
          }
        } else {
          if (isMusicPlaying) {
            setIsMusicPlaying(false);
            setAnimation((prev) => (prev === 'dance' || prev === 'sing' ? 'idle' : prev));
            eventBus.emit('music:playback_changed', { status: 'Paused' });
            setActiveLyricText(null);
          }
        }
      } catch {}
    }, 800);

    return () => clearInterval(musicTimer);
  }, [isMusicPlaying, currentSpotifyTrack, spotifyLyrics]);

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
        animation.startsWith('walk')
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
  }, [isSleeping, animation, preferences.speech_enabled, preferences.behavior_mode, movementPaused, isMusicPlaying, activeLyricText]);

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

  const handleToggleContinuousRun = () => {
    if (isSleeping) {
      needSystemRef.current.wakeUp();
      setIsSleeping(false);
    }
    const running = movementRef.current.toggleContinuousRun();
    setIsContinuousRunning(running);
    if (running) {
      messageManager.enqueue('SHOW RUN active! Continuous 40-frame sprint! ⚡🏃💨', 'normal', 'interaction');
    } else {
      messageManager.enqueue('Sprint paused. Catching breath! 🍃', 'normal', 'interaction');
    }
  };

  const handleStart40sRun = () => {
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
    messageManager.enqueue('40-Second Flame Sprint active! ⚡🏃💨 (1 frame / 40ms)', 'high', 'interaction');
    movementRef.current.startTimedRun(40, () => {
      setIs40sRunActive(false);
      setIsContinuousRunning(false);
      messageManager.enqueue('40s Flame Sprint complete! Full speed achieved! 🏆🔥', 'high', 'interaction');
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

  // Control Center Window Resizing
  const handleOpenControlCenter = async () => {
    setIsControlCenterOpen(true);
    try {
      await invokeCommand('set_window_size', { width: 780, height: 650 });
    } catch {}
  };

  const handleCloseControlCenter = async () => {
    setIsControlCenterOpen(false);
    try {
      await invokeCommand('set_window_size', { width: 260, height: 300 });
    } catch {}
  };

  // Double Click: Open Control Center (Section 10)
  const handleDoubleClick = () => {
    handleOpenControlCenter();
  };

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

      {/* Spotify Synced Live Lyrics Pill */}
      {isMusicPlaying && activeLyricText && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 z-40 max-w-[245px] px-3 py-1.5 rounded-full bg-[#121212]/95 border border-[#1DB954]/70 shadow-[0_4px_18px_rgba(29,185,84,0.4)] flex items-center gap-2 pointer-events-auto transition-all duration-300 animate-fade-in group cursor-pointer"
          title={`${currentSpotifyTrack?.artist || 'Spotify'} - ${currentSpotifyTrack?.title || ''} (Click to open Control Center)`}
          onClick={handleOpenControlCenter}
        >
          <div className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse shrink-0" />
          <span className="text-[10px] font-bold text-[#1DB954] uppercase tracking-wider shrink-0">
            Spotify
          </span>
          <span className="text-[11px] text-white font-medium truncate select-text">
            {activeLyricText}
          </span>
        </div>
      )}

      {/* Thought & Speech Bubble */}
      {preferences.speech_enabled && (
        <SpeechBubble mood={mood} className={isMusicPlaying && activeLyricText ? 'top-11' : undefined} />
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
                  messageManager.enqueue('Following cursor with 40-frame sprint! ⚡', 'normal', 'interaction');
                }
                return next;
              });
            }}
            className={`p-1.5 rounded-full transition ${
              isFollowingCursor ? 'bg-cyan-500/40 text-cyan-200 ring-1 ring-cyan-400' : 'hover:bg-cyan-500/30 text-cyan-300'
            }`}
            title={isFollowingCursor ? 'Stop Following Cursor' : 'Follow Cursor (40-Frame Sprint)'}
          >
            <Compass size={13} />
          </button>

          <button
            onClick={handleToggleContinuousRun}
            className={`p-1.5 rounded-full transition ${
              isContinuousRunning ? 'bg-amber-500/50 text-yellow-300 ring-2 ring-yellow-400 animate-pulse' : 'hover:bg-yellow-500/30 text-yellow-300'
            }`}
            title={isContinuousRunning ? 'Stop SHOW RUN' : 'SHOW RUN (Continuous 40-Frame Sprint)'}
          >
            <Zap size={13} />
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

          {/* ⚡ 40s Flame Sprint */}
          <button
            onClick={() => {
              setShowContextMenu(false);
              handleStart40sRun();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-yellow-600 hover:text-white flex items-center gap-2 text-yellow-300 font-semibold"
          >
            <Zap size={13} className="text-yellow-400" />
            <span>{is40sRunActive ? 'Stop 40s Sprint ⚡' : '⚡ 40s Flame Sprint'}</span>
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
      />
    </div>
  );
};
