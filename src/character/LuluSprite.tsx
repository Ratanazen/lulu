import React, { useEffect, useState } from 'react';
import { AnimationState, MoodType, CharacterStyle } from '../types/pet';
import shinobiIdle from '../assets/avatars/shinobi_idle.png';
import shinobiRun from '../assets/avatars/shinobi_run.png';
import shinobiHappy from '../assets/avatars/shinobi_happy.png';
import shinobiSleep from '../assets/avatars/shinobi_sleep.png';
import shinobiSad from '../assets/avatars/shinobi_sad.png';
import shinobiSing from '../assets/avatars/shinobi_sing.png';
import shinobiProtect from '../assets/avatars/shinobi_protect.png';
import shinobiSitdown from '../assets/avatars/shinobi_sitdown.png';

// Helper to sort and extract URLs from Vite glob
const loadFrames = (globRecord: Record<string, { default: string }>) => {
  return Object.keys(globRecord)
    .sort((a, b) => {
      const numA = parseInt(a.match(/_(\d+)\.png$/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/_(\d+)\.png$/)?.[1] || '0', 10);
      return numA - numB;
    })
    .map((k) => globRecord[k].default);
};

// 100 Frames (20 frames each across 5 styles) extracted directly from User Sprite Sheets
const runFrames = loadFrames(import.meta.glob<{ default: string }>('../assets/avatars/animations/run/*.png', { eager: true }));
const sleepFrames = loadFrames(import.meta.glob<{ default: string }>('../assets/avatars/animations/sleep/*.png', { eager: true }));
const sitFrames = loadFrames(import.meta.glob<{ default: string }>('../assets/avatars/animations/sit/*.png', { eager: true }));
const happyFrames = loadFrames(import.meta.glob<{ default: string }>('../assets/avatars/animations/happy/*.png', { eager: true }));
const musicFrames = loadFrames(import.meta.glob<{ default: string }>('../assets/avatars/animations/music/*.png', { eager: true }));
const sadFrames = loadFrames(import.meta.glob<{ default: string }>('../assets/avatars/animations/sad/*.png', { eager: true }));
const singFrames = loadFrames(import.meta.glob<{ default: string }>('../assets/avatars/animations/sing/*.png', { eager: true }));

// Sub-categories for companion behaviors
const walkFrames = loadFrames(import.meta.glob<{ default: string }>('../assets/avatars/animations/walk/*.png', { eager: true }));
const protectFrames = loadFrames(import.meta.glob<{ default: string }>('../assets/avatars/animations/protect/*.png', { eager: true }));
const petFrames = loadFrames(import.meta.glob<{ default: string }>('../assets/avatars/animations/pet/*.png', { eager: true }));
const idleFrames = loadFrames(import.meta.glob<{ default: string }>('../assets/avatars/animations/idle/*.png', { eager: true }));

interface LuluSpriteProps {
  animation: AnimationState;
  mood: MoodType;
  scale?: number;
  showShadow?: boolean;
  characterStyle?: CharacterStyle;
  cursorPos?: { x: number; y: number };
  cursorOffset?: { x: number; y: number };
  isDragging?: boolean;
  speedMultiplier?: number;
  isMusicPlaying?: boolean;
  fpsLimit?: number;
  beatPulse?: number;
  audioEnergy?: number;
}

export const LuluSprite: React.FC<LuluSpriteProps> = ({
  animation,
  mood,
  scale = 1.0,
  showShadow = true,
  characterStyle = 'shadow_shinobi',
  cursorPos,
  cursorOffset,
  isDragging = false,
  speedMultiplier = 1.0, // Normal, smooth cadence default
  isMusicPlaying = false,
  fpsLimit = 30,
  beatPulse = 0,
  audioEnergy = 0,
}) => {
  const [frame, setFrame] = useState(0);
  const [tick, setTick] = useState(0);
  const activeCursor = cursorPos || cursorOffset;

  // Continuous physics clock scaled by fpsLimit to save CPU/battery on low-spec hardware
  useEffect(() => {
    const targetFps = Math.max(15, Math.min(60, fpsLimit));
    const intervalMs = Math.round(1000 / targetFps);
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 100000);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [fpsLimit]);

  // Behavior state detection across all 17 functions
  const isRunning = animation === 'run-left' || animation === 'run-right' || (animation as string) === 'run';
  const isWalking = animation === 'walk-left' || animation === 'walk-right' || (animation as string) === 'walk';
  const isMoving = isWalking || isRunning;
  const isJumping = animation === 'jump';
  const isSitting = animation === 'sit';
  const isSleeping = animation === 'sleep';
  const isAngry = animation === 'angry';
  const isSurprised = animation === 'surprised';
  const isDancing = animation === 'dance';
  const isSinging = animation === 'sing';
  const isThinking = animation === 'think';
  const isTalking = animation === 'talk';
  const isProtecting = animation === 'protect';
  const isWaving = animation === 'wave';
  const isFlipped = animation === 'walk-left' || animation === 'run-left';

  // Independent animation frame sequence timer (supports 1-frame and multi-frame sequences dynamically)
  useEffect(() => {
    // Explicit animation state strictly takes priority over ambient mood
    const activeLength = isRunning
      ? runFrames.length
      : isWalking
      ? walkFrames.length
      : isSinging
      ? singFrames.length
      : isSleeping
      ? sleepFrames.length
      : isSitting
      ? (sitFrames.length > 0 ? sitFrames.length : 1)
      : isDancing
      ? musicFrames.length
      : isProtecting || isThinking
      ? protectFrames.length
      : isWaving
      ? petFrames.length
      : animation === 'happy'
      ? happyFrames.length
      : (animation === 'sad' || animation === 'angry')
      ? sadFrames.length
      : (mood === 'happy' || mood === 'playful')
      ? happyFrames.length
      : (mood === 'sad' || mood === 'tired')
      ? sadFrames.length
      : idleFrames.length;

    // Normal, smooth anime animation frame rates (not too fast, balanced and comfortable)
    const fps = isRunning
      ? 12
      : isWalking
      ? 4
      : isSinging
      ? 5
      : isSleeping
      ? 2
      : isSitting
      ? 3
      : isDancing
      ? 6
      : (animation === 'happy' || mood === 'happy' || mood === 'playful')
      ? 5
      : (animation === 'sad' || animation === 'angry' || mood === 'sad' || mood === 'tired')
      ? 4
      : (isThinking || isProtecting || isWaving)
      ? 4
      : 3;

    const effectiveFps = Math.max(1, Math.round(fps * (speedMultiplier ?? 1.0)));
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % (activeLength || 1));
    }, 1000 / effectiveFps);

    return () => clearInterval(interval);
  }, [animation, mood, isSleeping, isSitting, isRunning, isDancing, isSinging, isWalking, isThinking, isProtecting, isWaving, speedMultiplier]);

  // Dynamic smooth physics: continuous sinusoidal curve gives natural life to 1-frame artwork
  const isSad = animation === 'sad' || animation === 'angry' || (animation === 'idle' && (mood === 'sad' || mood === 'tired'));
  const isJoyful = animation === 'happy' || (animation === 'idle' && (mood === 'happy' || mood === 'playful')) || isDancing;

  // Breathing motion during idle and resting
  const breathY = (animation === 'idle' || isSleeping || isSitting)
    ? Math.sin(tick * 0.1) * 3
    : 0;

  // Stride offset during walking and running
  const walkOffset = isWalking
    ? Math.sin(tick * 0.25) * 3
    : isRunning
    ? Math.sin(tick * 0.4) * 4
    : 0;

  // Expressive jumping, sitting, or joyful bouncing (modulated by live audio beatPulse)
  const beatHop = (isDancing || isSinging) ? beatPulse * -7 : 0;
  const bounceY = isJumping
    ? -26
    : isSitting
    ? 0
    : isSurprised
    ? -8
    : (animation === 'happy' || isJoyful)
    ? Math.abs(Math.sin(tick * 0.2)) * -5 + beatHop
    : beatHop;

  // Dynamic tilt & sway: running lean, dancing groove, walking wobble, singing gentle sway
  const dynamicDanceTilt = Math.sin(tick * 0.25) * (4 + beatPulse * 4);
  const tiltDeg = isRunning
    ? Math.sin(tick * 0.35) * 4
    : isDancing
    ? dynamicDanceTilt
    : isSinging
    ? Math.sin(tick * 0.15) * (3 + audioEnergy * 2.5)
    : isJoyful
    ? Math.sin(tick * 0.2) * 3
    : isWalking
    ? Math.sin(tick * 0.25) * 2.5
    : isThinking
    ? 2.5
    : isSurprised
    ? -3.0
    : isSad
    ? Math.sin(tick * 0.1) * 1.5
    : 0;

  // 1. AUTHENTIC SHADOW SHINOBI (Real Multi-Frame 2D Motion Engine from User Sprite Sheets)
  if (characterStyle === 'shadow_shinobi') {
    // Select the authentic multi-frame animation artwork: strict animation action priority
    let activeArtwork = idleFrames[frame % idleFrames.length];
    if (isRunning) {
      activeArtwork = runFrames[frame % runFrames.length];
    } else if (isWalking) {
      activeArtwork = walkFrames[frame % walkFrames.length];
    } else if (isSinging) {
      activeArtwork = singFrames[frame % singFrames.length];
    } else if (isSleeping) {
      activeArtwork = sleepFrames[frame % sleepFrames.length];
    } else if (isSitting) {
      activeArtwork = sitFrames.length > 0 ? sitFrames[frame % sitFrames.length] : shinobiSitdown;
    } else if (isDancing) {
      activeArtwork = musicFrames[frame % musicFrames.length];
    } else if (isProtecting || isThinking) {
      activeArtwork = protectFrames[frame % protectFrames.length];
    } else if (isWaving) {
      activeArtwork = petFrames[frame % petFrames.length];
    } else if (animation === 'happy') {
      activeArtwork = happyFrames[frame % happyFrames.length];
    } else if (animation === 'sad' || animation === 'angry') {
      activeArtwork = sadFrames[frame % sadFrames.length];
    } else if (mood === 'happy' || mood === 'playful') {
      activeArtwork = happyFrames[frame % happyFrames.length];
    } else if (mood === 'sad' || mood === 'tired') {
      activeArtwork = sadFrames[frame % sadFrames.length];
    }

    return (
      <div
        className="relative flex flex-col items-center justify-center select-none pointer-events-none transition-transform"
        style={{
          transform: `scale(${scale}) ${isDragging ? 'scale(1.08, 0.94)' : ''}`,
        }}
      >
        {/* Soft Dynamic Floor Drop Shadow */}
        {showShadow && !isSleeping && (
          <div
            className="absolute bottom-2 w-28 h-5 bg-black/35 rounded-full blur-[2px] transition-all duration-150"
            style={{
              transform: isJumping
                ? 'scale(0.55)'
                : isRunning
                ? 'scale(1.2, 0.85)'
                : isSitting
                ? 'scale(1.25, 0.7)'
                : isJoyful
                ? 'scale(1.1, 0.9)'
                : 'scale(1)',
            }}
          />
        )}

        {/* Dynamic Character Sprite with Physics Bobbing & Direction Flip */}
        <div
          className="relative transition-transform flex items-center justify-center"
          style={{
            transform: `translateY(${breathY + walkOffset + bounceY}px) ${
              isFlipped ? 'scaleX(-1)' : 'scaleX(1)'
            } rotate(${tiltDeg}deg)`,
            transformOrigin: 'bottom center',
            transition: isJumping
              ? 'transform 0.15s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
              : (isRunning || isWalking || isDancing || isSinging)
              ? 'none'
              : 'transform 0.05s linear',
          }}
        >
          {/* Authentic High-Resolution Transparent Character Artwork */}
          <img
            src={activeArtwork}
            alt="Lulu Shadow Shinobi"
            className="w-44 h-44 object-contain select-none pointer-events-none filter drop-shadow-md"
            draggable={false}
          />

          {/* Interactive Vector Animation Effects Overlay */}
          <svg
            className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
            viewBox="0 0 200 200"
          >
            {/* Glowing Susanoo Chakra Energy Shield (Protect Mode) */}
            {isProtecting && (
              <g className="animate-pulse">
                <polygon
                  points="100,15 175,55 175,145 100,185 25,145 25,55"
                  fill="rgba(59, 130, 246, 0.22)"
                  stroke="#60a5fa"
                  strokeWidth="2.5"
                  strokeDasharray="8,4"
                />
                <polygon
                  points="100,25 165,60 165,135 100,175 35,135 35,60"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="1.5"
                  opacity="0.75"
                />
              </g>
            )}

            {/* Manga Anger Mark on Temple (Angry Mode) */}
            {isAngry && (
              <g className="animate-bounce" transform="translate(138, 42)">
                <path
                  d="M 0 0 L 14 0 M 7 -7 L 7 7 M 1 -5 Q 7 0 13 -5 M 1 5 Q 7 0 13 5"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Floating Exclamation Mark (Surprised Mode) */}
            {isSurprised && (
              <g className="animate-bounce" transform="translate(144, 32)">
                <circle cx="10" cy="10" r="10" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
                <text x="7" y="15" fill="#000000" fontSize="13" fontWeight="bold">
                  !
                </text>
              </g>
            )}

            {/* Floating Musical Notes (Dance Mode) */}
            {isDancing && (
              <g className="animate-bounce">
                <text x="25" y="48" fill="#ec4899" fontSize="18" fontWeight="bold">
                  ♪
                </text>
                <text x="160" y="42" fill="#a855f7" fontSize="20" fontWeight="bold">
                  ♫
                </text>
                <text x="150" y="75" fill="#38bdf8" fontSize="16" fontWeight="bold">
                  ♬
                </text>
              </g>
            )}

            {/* Live Karaoke Singing Notes (Sing Mode) */}
            {isSinging && (
              <g className="animate-bounce">
                <text x="28" y="42" fill="#f43f5e" fontSize="20" fontWeight="bold">
                  ♪
                </text>
                <text x="164" y="36" fill="#a855f7" fontSize="22" fontWeight="bold">
                  ♫
                </text>
                <text x="155" y="74" fill="#38bdf8" fontSize="17" fontWeight="bold">
                  ♬
                </text>
              </g>
            )}

            {/* Sad Teardrop Particle (Sad Mode) */}
            {isSad && (
              <g className="animate-pulse" transform="translate(138, 54)">
                <circle cx="0" cy="0" r="3.5" fill="#38bdf8" opacity="0.9" />
                <path d="M 0 -5 L 2.5 0 L -2.5 0 Z" fill="#38bdf8" opacity="0.9" />
              </g>
            )}

            {/* Thinking Gears Bubble (Think Mode) */}
            {isThinking && (
              <g className="animate-pulse" transform="translate(142, 18)">
                <circle cx="2" cy="38" r="3.5" fill="#cbd5e1" />
                <circle cx="10" cy="28" r="5.5" fill="#cbd5e1" />
                <rect x="0" y="0" width="38" height="24" rx="12" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                <text x="11" y="17" fontSize="13">
                  ⚙️
                </text>
              </g>
            )}

            {/* Slashing Weapon Gleam on Wave */}
            {animation === 'wave' && (
              <g className="animate-pulse">
                <path
                  d="M 20 85 Q 60 55 100 80"
                  stroke="#fde047"
                  strokeWidth="3.5"
                  fill="none"
                  strokeDasharray="6,4"
                />
                <text x="95" y="65" fill="#fde047" fontSize="18">
                  ✦
                </text>
              </g>
            )}

            {/* Sleep Floating Zzz & Lullaby Notes Particle */}
            {isSleeping && (
              <g className="animate-pulse" transform="translate(142, 48)">
                <text x="0" y="20" fill="#c084fc" fontSize="16" fontWeight="bold">
                  Z
                </text>
                <text x="10" y="8" fill="#e879f9" fontSize="13" fontWeight="bold">
                  z
                </text>
                <text x="18" y="-2" fill="#a855f7" fontSize="10" fontWeight="bold">
                  z
                </text>
                {isMusicPlaying && (
                  <g className="animate-bounce">
                    <text x="-24" y="16" fill="#38bdf8" fontSize="14" fontWeight="bold">
                      ♪
                    </text>
                    <text x="-12" y="-2" fill="#f43f5e" fontSize="15" fontWeight="bold">
                      ♫
                    </text>
                  </g>
                )}
              </g>
            )}
          </svg>
        </div>
      </div>
    );
  }

  // Primary colors for Lulu: Celestial Lilac & Radiant Cream
  const furColor = '#9d84f5';      // Celestial Soft Violet
  const bellyColor = '#f5e9ff';    // Soft starlight cream
  const innerEarColor = '#fca5a5'; // Gentle blush pink
  const eyeColor = '#38bdf8';      // Luminous cyan-blue
  const starMarkColor = '#fde047'; // Golden starlight forehead emblem

  // ANIME CHIBI AVATAR RENDERER ("Lulu Anime")
  if (characterStyle === 'anime_chibi') {
    const hairColor = '#c4b5fd';       // Soft anime lavender/violet
    const hairShadow = '#a78bfa';      // Deep anime hair shadow
    const skinColor = '#fff1f2';       // Fair porcelain anime skin
    const blushColor = '#fb7185';      // Anime blush
    const dressColor = '#7c3aed';      // Royal anime magical dress
    const ribbonColor = '#f43f5e';     // Cute ruby anime ribbon

    return (
      <div
        className="relative flex flex-col items-center justify-center select-none pointer-events-none transition-transform"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        <svg
          width="170"
          height="170"
          viewBox="0 0 170 170"
          className="overflow-visible"
          style={{
            transform: `translateY(${breathY + walkOffset + bounceY}px) ${isFlipped ? 'scaleX(-1)' : 'scaleX(1)'}`,
            transformOrigin: 'bottom center',
            transition: 'transform 0.1s ease-out',
          }}
        >
          <defs>
            <linearGradient id="animeEyeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b0764" />
              <stop offset="40%" stopColor="#7c3aed" />
              <stop offset="80%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#a5f3fc" />
            </linearGradient>
            <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ddd6fe" />
              <stop offset="60%" stopColor="#c4b5fd" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>

          {/* Shadow */}
          {showShadow && (
            <ellipse cx="85" cy="155" rx="36" ry="8" fill="rgba(0, 0, 0, 0.28)" />
          )}

          {/* Back Hair Twin-Tails */}
          <path
            d={frame % 2 === 0
              ? "M 48 85 C 20 100, 15 135, 35 145 C 42 148, 48 135, 45 115 Z"
              : "M 48 85 C 22 105, 18 140, 38 148 C 45 150, 48 135, 45 115 Z"}
            fill={hairShadow}
          />
          <path
            d={frame % 2 === 0
              ? "M 122 85 C 150 100, 155 135, 135 145 C 128 148, 122 135, 125 115 Z"
              : "M 122 85 C 148 105, 152 140, 132 148 C 125 150, 122 135, 125 115 Z"}
            fill={hairShadow}
          />

          {/* Anime Cat Ears */}
          <polygon points="52,48 38,18 70,35" fill={hairColor} stroke="#6d28d9" strokeWidth="2.5" />
          <polygon points="52,44 44,25 64,36" fill="#fecdd3" />

          <polygon points="118,48 132,18 100,35" fill={hairColor} stroke="#6d28d9" strokeWidth="2.5" />
          <polygon points="118,44 126,25 106,36" fill="#fecdd3" />

          {/* Anime Magical Dress / Body */}
          <path
            d="M 65 115 L 55 148 C 70 152, 100 152, 115 148 L 105 115 Z"
            fill={dressColor}
            stroke="#4c1d95"
            strokeWidth="2.5"
          />

          {/* White Frill Apron */}
          <path
            d="M 72 118 L 68 146 C 78 148, 92 148, 102 146 L 98 118 Z"
            fill="#ffffff"
          />

          {/* Ribbon on Collar */}
          <polygon points="85,120 76,114 78,124" fill={ribbonColor} />
          <polygon points="85,120 94,114 92,124" fill={ribbonColor} />
          <circle cx="85" cy="120" r="3" fill="#fbbf24" />

          {/* Anime Little Shoes */}
          <ellipse cx="72" cy="151" rx="8" ry="4.5" fill="#312e81" />
          <ellipse cx="98" cy="151" rx="8" ry="4.5" fill="#312e81" />

          {/* Hands */}
          {animation === 'wave' ? (
            <ellipse cx="120" cy="95" rx="6" ry="6" fill={skinColor} stroke="#e11d48" strokeWidth="1.2" />
          ) : (
            <>
              <ellipse cx="60" cy="128" rx="5.5" ry="5.5" fill={skinColor} />
              <ellipse cx="110" cy="128" rx="5.5" ry="5.5" fill={skinColor} />
            </>
          )}

          {/* Chibi Face / Head */}
          <ellipse
            cx="85"
            cy="75"
            rx="36"
            ry="33"
            fill={skinColor}
            stroke="#6d28d9"
            strokeWidth="2.5"
          />

          {/* Anime Hair Bangs */}
          <path
            d="M 50 68 C 48 45, 122 45, 120 68 C 112 60, 100 75, 95 62 C 90 75, 80 75, 75 62 C 70 75, 58 60, 50 68 Z"
            fill="url(#hairGrad)"
            stroke="#6d28d9"
            strokeWidth="2"
          />

          {/* Golden Star Hair Clip */}
          <polygon
            points="54,42 56,46 61,47 57,50 58,55 54,52 50,55 51,50 47,47 52,46"
            fill="#fde047"
            stroke="#ca8a04"
            strokeWidth="1"
          />

          {/* Expressive Anime Eyes */}
          {animation === 'sleep' ? (
            // Anime Sleeping Eyes (◡ ◡)
            <>
              <path d="M 64 78 Q 72 85 80 78" fill="none" stroke="#4c1d95" strokeWidth="3" strokeLinecap="round" />
              <path d="M 90 78 Q 98 85 106 78" fill="none" stroke="#4c1d95" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : animation === 'happy' || mood === 'happy' ? (
            // Anime Joyful Heart Eyes (♥ ♥)
            <>
              <path
                d="M 72 74 C 72 70, 66 68, 66 73 C 66 78, 72 82, 72 82 C 72 82, 78 78, 78 73 C 78 68, 72 70, 72 74 Z"
                fill="#f43f5e"
              />
              <path
                d="M 98 74 C 98 70, 92 68, 92 73 C 92 78, 98 82, 98 82 C 98 82, 104 78, 104 73 C 104 68, 98 70, 98 74 Z"
                fill="#f43f5e"
              />
            </>
          ) : (
            // Large Sparkling Anime Eyes
            <>
              {/* Left Eye */}
              <ellipse cx="71" cy="78" rx="8" ry="11" fill="url(#animeEyeGrad)" stroke="#4c1d95" strokeWidth="2" />
              <ellipse cx="71" cy="75" rx="5" ry="7" fill="#1e1b4b" />
              {/* Highlights */}
              <circle cx="73" cy="73" r="3.2" fill="#ffffff" />
              <circle cx="68" cy="82" r="1.8" fill="#ffffff" />
              <circle cx="74" cy="83" r="1" fill="#ffffff" />
              {/* Upper Eyelashes */}
              <path d="M 62 70 Q 72 65 80 71" fill="none" stroke="#4c1d95" strokeWidth="2.5" strokeLinecap="round" />

              {/* Right Eye */}
              <ellipse cx="99" cy="78" rx="8" ry="11" fill="url(#animeEyeGrad)" stroke="#4c1d95" strokeWidth="2" />
              <ellipse cx="99" cy="75" rx="5" ry="7" fill="#1e1b4b" />
              {/* Highlights */}
              <circle cx="101" cy="73" r="3.2" fill="#ffffff" />
              <circle cx="96" cy="82" r="1.8" fill="#ffffff" />
              <circle cx="102" cy="83" r="1" fill="#ffffff" />
              {/* Upper Eyelashes */}
              <path d="M 90 71 Q 98 65 108 70" fill="none" stroke="#4c1d95" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}

          {/* Anime Blush Cheeks with Soft Starlight */}
          <ellipse cx="60" cy="85" rx="6" ry="3.5" fill={blushColor} opacity="0.5" />
          <ellipse cx="110" cy="85" rx="6" ry="3.5" fill={blushColor} opacity="0.5" />
          <text x="56" y="87" fill="#e11d48" fontSize="8" fontWeight="bold">///</text>
          <text x="106" y="87" fill="#e11d48" fontSize="8" fontWeight="bold">///</text>

          {/* Cute Anime Mouth */}
          {animation === 'happy' || mood === 'playful' ? (
            <path d="M 81 87 Q 85 92 89 87" fill="#f43f5e" stroke="#4c1d95" strokeWidth="1.5" />
          ) : animation === 'surprised' ? (
            <ellipse cx="85" cy="88" rx="3" ry="4" fill="#f43f5e" stroke="#4c1d95" strokeWidth="1.2" />
          ) : (
            <path d="M 82 86 Q 85 88 88 86" fill="none" stroke="#4c1d95" strokeWidth="1.8" strokeLinecap="round" />
          )}

          {/* Floating Love Heart on Happy / Love Mode */}
          {(animation === 'happy' || mood === 'happy') && (
            <g className="animate-bounce">
              <path
                d="M 130 50 C 130 44, 122 42, 122 48 C 122 55, 130 60, 130 60 C 130 60, 138 55, 138 48 C 138 42, 130 44, 130 50 Z"
                fill="#f43f5e"
              />
            </g>
          )}

          {/* Sleeping Zzz Bubble & Lullaby Note */}
          {animation === 'sleep' && (
            <g className="animate-pulse">
              <text x="120" y="52" fill="#c084fc" fontSize="15" fontWeight="bold">Z</text>
              <text x="130" y="40" fill="#e879f9" fontSize="12" fontWeight="bold">z</text>
              {isMusicPlaying && (
                <text x="105" y="60" fill="#38bdf8" fontSize="13" fontWeight="bold">♪</text>
              )}
            </g>
          )}
        </svg>
      </div>
    );
  }

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none pointer-events-none transition-transform"
      style={{
        transform: `scale(${scale})`,
        imageRendering: 'pixelated',
      }}
    >
      {/* SVG Canvas Pixel-Art Character */}
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        className="overflow-visible"
        style={{
          transform: `translateY(${breathY + walkOffset + bounceY}px) ${isFlipped ? 'scaleX(-1)' : 'scaleX(1)'}`,
          transformOrigin: 'bottom center',
          transition: 'transform 0.1s ease-out',
        }}
      >
        {/* Soft Drop Shadow */}
        {showShadow && (
          <ellipse
            cx="80"
            cy="148"
            rx={animation === 'sleep' ? 44 : 38}
            ry="9"
            fill="rgba(0, 0, 0, 0.25)"
          />
        )}

        {/* Fluffy Tail */}
        <path
          d={
            animation === 'sleep'
              ? 'M 50 120 C 35 110, 30 135, 55 140 C 70 142, 75 130, 50 120 Z'
              : frame % 2 === 0
              ? 'M 105 115 C 130 95, 145 110, 138 128 C 130 145, 110 135, 95 125 Z'
              : 'M 105 118 C 135 105, 148 125, 135 138 C 122 148, 105 138, 95 125 Z'
          }
          fill={furColor}
          stroke="#4c1d95"
          strokeWidth="3"
        />

        {/* Tail Tip (Cream Starlight Accent) */}
        <circle cx={animation === 'sleep' ? 38 : 138} cy={animation === 'sleep' ? 128 : 115} r="9" fill={bellyColor} />

        {/* Body Base */}
        <ellipse
          cx="80"
          cy="115"
          rx={animation === 'sleep' ? 38 : 32}
          ry={animation === 'sleep' ? 24 : 28}
          fill={furColor}
          stroke="#4c1d95"
          strokeWidth="3"
        />

        {/* Cream Belly Patch */}
        <ellipse
          cx="80"
          cy={animation === 'sleep' ? 116 : 118}
          rx={animation === 'sleep' ? 24 : 18}
          ry={animation === 'sleep' ? 15 : 18}
          fill={bellyColor}
        />

        {/* Feet / Paws */}
        {animation !== 'sleep' && (
          <>
            <ellipse
              cx={frame % 2 === 0 ? 64 : 62}
              cy="142"
              rx="10"
              ry="7"
              fill={bellyColor}
              stroke="#4c1d95"
              strokeWidth="2.5"
            />
            <ellipse
              cx={frame % 2 === 0 ? 96 : 98}
              cy="142"
              rx="10"
              ry="7"
              fill={bellyColor}
              stroke="#4c1d95"
              strokeWidth="2.5"
            />
          </>
        )}

        {/* Big Expressive Head */}
        <ellipse
          cx="80"
          cy="68"
          rx="40"
          ry="34"
          fill={furColor}
          stroke="#4c1d95"
          strokeWidth="3.5"
        />

        {/* Left Ear */}
        <polygon
          points="46,45 32,15 62,32"
          fill={furColor}
          stroke="#4c1d95"
          strokeWidth="3"
        />
        <polygon points="46,40 38,22 56,33" fill={innerEarColor} />

        {/* Right Ear */}
        <polygon
          points="114,45 128,15 98,32"
          fill={furColor}
          stroke="#4c1d95"
          strokeWidth="3"
        />
        <polygon points="114,40 122,22 104,33" fill={innerEarColor} />

        {/* Forehead Golden Star Emblem */}
        <polygon
          points="80,42 82,47 88,48 83,52 85,58 80,54 75,58 77,52 72,48 78,47"
          fill={starMarkColor}
          stroke="#ca8a04"
          strokeWidth="1"
        />

        {/* Eyes Rendering Based on State & Mood */}
        {animation === 'sleep' || mood === 'tired' ? (
          // Sleeping / Closed Content Eyes
          <>
            <path d="M 60 70 Q 68 76 74 70" fill="none" stroke="#2e1065" strokeWidth="3" strokeLinecap="round" />
            <path d="M 86 70 Q 92 76 100 70" fill="none" stroke="#2e1065" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : animation === 'happy' || mood === 'happy' ? (
          // Joyful Happy Squint Eyes (^_^)
          <>
            <path d="M 58 72 Q 68 62 76 72" fill="none" stroke="#2e1065" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 84 72 Q 92 62 102 72" fill="none" stroke="#2e1065" strokeWidth="3.5" strokeLinecap="round" />
          </>
        ) : animation === 'surprised' ? (
          // Wide Surprised Eyes
          <>
            <ellipse cx="66" cy="68" rx="8" ry="10" fill="#2e1065" />
            <circle cx="68" cy="65" r="3.5" fill="#ffffff" />
            <ellipse cx="94" cy="68" rx="8" ry="10" fill="#2e1065" />
            <circle cx="96" cy="65" r="3.5" fill="#ffffff" />
          </>
        ) : (
          // Normal Luminous Curious Eyes
          <>
            <ellipse cx="66" cy="70" rx="7.5" ry="9" fill={eyeColor} stroke="#2e1065" strokeWidth="2.5" />
            <ellipse cx="66" cy="71" rx="4.5" ry="6" fill="#1e293b" />
            <circle cx="68" cy="67" r="2.5" fill="#ffffff" />
            <circle cx="64" cy="73" r="1.2" fill="#ffffff" />

            <ellipse cx="94" cy="70" rx="7.5" ry="9" fill={eyeColor} stroke="#2e1065" strokeWidth="2.5" />
            <ellipse cx="94" cy="71" rx="4.5" ry="6" fill="#1e293b" />
            <circle cx="96" cy="67" r="2.5" fill="#ffffff" />
            <circle cx="92" cy="73" r="1.2" fill="#ffffff" />
          </>
        )}

        {/* Blush Cheeks */}
        <ellipse cx="54" cy="76" rx="5" ry="3" fill="#f43f5e" opacity="0.45" />
        <ellipse cx="106" cy="76" rx="5" ry="3" fill="#f43f5e" opacity="0.45" />

        {/* Cute Tiny Nose */}
        <polygon points="78,75 82,75 80,78" fill="#4c1d95" />

        {/* Mouth */}
        {animation === 'happy' || mood === 'playful' ? (
          <path d="M 75 78 Q 80 84 85 78" fill="#f43f5e" stroke="#4c1d95" strokeWidth="2" />
        ) : animation === 'surprised' ? (
          <ellipse cx="80" cy="80" rx="3.5" ry="5" fill="#f43f5e" stroke="#4c1d95" strokeWidth="1.5" />
        ) : (
          <path d="M 76 78 Q 80 81 84 78" fill="none" stroke="#4c1d95" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Waving Paw (When animation is 'wave') */}
        {animation === 'wave' && (
          <ellipse
            cx="115"
            cy={frame % 2 === 0 ? 55 : 45}
            rx="8"
            ry="11"
            fill={bellyColor}
            stroke="#4c1d95"
            strokeWidth="2.5"
            transform={`rotate(${frame % 2 === 0 ? 25 : -15} 115 50)`}
          />
        )}

        {/* Sleeping Zzz Bubble Particle */}
        {animation === 'sleep' && (
          <g className="animate-pulse">
            <text x="110" y="42" fill="#a78bfa" fontSize="16" fontWeight="bold" fontFamily="monospace">Z</text>
            <text x="122" y="30" fill="#c4b5fd" fontSize="13" fontWeight="bold" fontFamily="monospace">z</text>
            <text x="132" y="20" fill="#ddd6fe" fontSize="10" fontWeight="bold" fontFamily="monospace">z</text>
          </g>
        )}

        {/* Sparkle Star (When happy) */}
        {animation === 'happy' && (
          <g>
            <polygon points="40,30 42,34 46,35 43,38 44,42 40,39 36,42 37,38 34,35 38,34" fill="#fbbf24" />
            <polygon points="125,40 126,43 129,44 127,46 128,49 125,47 122,49 123,46 121,44 124,43" fill="#fbbf24" />
          </g>
        )}
      </svg>
    </div>
  );
};
