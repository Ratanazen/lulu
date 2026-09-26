import React, { useEffect, useRef } from 'react';
import { characterManager } from '../../character/CharacterManager';
import { ANIMATION_DEFINITIONS } from '../../animation/definitions';
import { useLuluStore } from '../../stores/useLuluStore';
import { DesktopWindowService } from '../../services/desktopWindow';
import { particleSystem } from '../../animation/particleSystem';
import { eventBus } from '../../services/eventBus';
import { usePerformanceStore } from '../../features/performance/performanceStore';
import luluCharacter from '@/assets/character/lulu/lulu-character.png';

interface PetCanvasProps {
  onContextMenu: (e: React.MouseEvent) => void;
}

export const PetCanvas: React.FC<PetCanvasProps> = ({ onContextMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    character,
    animationState,
    animationFrame,
    facing,
    settings,
    setFrame,
    setAnimation,
    interact,
  } = useLuluStore();

  const { config: perfConfig, setRendererState } = usePerformanceStore();
  const [renderState, setLocalRenderState] = React.useState<'ACTIVE' | 'IDLE' | 'HIDDEN' | 'BACKGROUND'>('ACTIVE');

  // Track window visibility and user idle state for adaptive rendering
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let bgTimer: ReturnType<typeof setTimeout> | null = null;

    const resetActivity = () => {
      if (document.hidden) return;
      setLocalRenderState('ACTIVE');
      setRendererState('ACTIVE');

      if (idleTimer) clearTimeout(idleTimer);
      if (bgTimer) clearTimeout(bgTimer);

      idleTimer = setTimeout(() => {
        setLocalRenderState('IDLE');
        setRendererState('IDLE');
      }, 15000);

      bgTimer = setTimeout(() => {
        setLocalRenderState('BACKGROUND');
        setRendererState('BACKGROUND');
      }, 60000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setLocalRenderState('HIDDEN');
        setRendererState('HIDDEN');
      } else {
        resetActivity();
      }
    };

    const handleFocus = () => resetActivity();
    const handleBlur = () => {
      if (bgTimer) clearTimeout(bgTimer);
      bgTimer = setTimeout(() => {
        setLocalRenderState('BACKGROUND');
        setRendererState('BACKGROUND');
      }, 30000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('mousemove', resetActivity);
    window.addEventListener('mousedown', resetActivity);

    resetActivity();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('mousedown', resetActivity);
      if (idleTimer) clearTimeout(idleTimer);
      if (bgTimer) clearTimeout(bgTimer);
    };
  }, [setRendererState]);

  const animDef = ANIMATION_DEFINITIONS[animationState] || ANIMATION_DEFINITIONS.idle;
  const isImageAvatar =
    character.renderer === 'image_avatar' ||
    Boolean(character.avatarUrl) ||
    character.id === 'madara_shinobi' ||
    character.id === 'lulu';

  // Animation frame updater loop
  useEffect(() => {
    if (renderState === 'HIDDEN') return;

    let animId: number;
    let lastFrameTime = performance.now();
    let currentFrame = animationFrame;
    let forward = true;

    // Throttle animation frame updates in BACKGROUND / IDLE states
    let baseFps = animDef.fps || 6;
    if (renderState === 'BACKGROUND') {
      baseFps = Math.min(baseFps, 3);
    } else if (renderState === 'IDLE' && animationState === 'idle') {
      baseFps = Math.min(baseFps, 4);
    }

    const frameInterval = 1000 / baseFps;

    const loop = (time: number) => {
      const elapsed = time - lastFrameTime;

      if (elapsed >= frameInterval) {
        lastFrameTime = time - (elapsed % frameInterval);

        if (animDef.loopMode === 'loop') {
          currentFrame = (currentFrame + 1) % animDef.frames;
        } else if (animDef.loopMode === 'ping-pong') {
          if (forward) {
            if (currentFrame + 1 < animDef.frames) {
              currentFrame++;
            } else {
              forward = false;
              currentFrame = Math.max(0, currentFrame - 1);
            }
          } else {
            if (currentFrame - 1 >= 0) {
              currentFrame--;
            } else {
              forward = true;
              currentFrame = Math.min(animDef.frames - 1, currentFrame + 1);
            }
          }
        } else if (animDef.loopMode === 'once') {
          if (currentFrame + 1 < animDef.frames) {
            currentFrame++;
          } else {
            setAnimation('idle');
            currentFrame = 0;
          }
        }

        setFrame(currentFrame);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [animationState, animDef, renderState]);

  // Render to canvas & particles animation loop with adaptive frame pacing
  useEffect(() => {
    if (renderState === 'HIDDEN') return;

    let animId: number;
    let lastTime = performance.now();
    let wasEmpty = false;

    // Effective FPS based on performance config & adaptive state
    let targetFps = perfConfig.performance.fps || 30;
    if (renderState === 'IDLE') {
      targetFps = Math.min(targetFps, 20);
    } else if (renderState === 'BACKGROUND') {
      targetFps = Math.min(targetFps, 10);
    }

    const minFrameInterval = 1000 / targetFps;

    const renderLoop = (time: number) => {
      const elapsed = time - lastTime;
      if (elapsed < minFrameInterval) {
        animId = requestAnimationFrame(renderLoop);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dt = Math.min(elapsed / 1000, 0.1);
      lastTime = time;

      const w = canvas.width;
      const h = canvas.height;

      const hasParticles = perfConfig.performance.particles && particleSystem.hasActiveParticles();

      // On low-spec/old computers, avoid continuous clears when no particles exist
      if (isImageAvatar && !hasParticles) {
        if (!wasEmpty) {
          ctx.clearRect(0, 0, w, h);
          wasEmpty = true;
        }
        animId = requestAnimationFrame(renderLoop);
        return;
      }

      wasEmpty = false;
      ctx.clearRect(0, 0, w, h);

      if (!isImageAvatar) {
        // Render procedural character frame for non-image companions
        const { renderer } = characterManager.getEffectiveRenderer(character);
        renderer.render({
          ctx,
          width: w,
          height: h,
          animationState,
          animationFrame,
          facing,
          character,
          mouthShape: characterManager.lipSync.getShape(),
          scale: character.scale,
        });
      }

      // Update and render particle effects if enabled
      if (perfConfig.performance.particles) {
        particleSystem.update(dt, w, h, time);
        particleSystem.render(ctx);
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [character, animationState, animationFrame, facing, isImageAvatar, perfConfig.performance.fps, perfConfig.performance.particles, renderState]);


  // Event bus listeners for level up & achievement sparkles
  useEffect(() => {
    const unsub = eventBus.on('ACHIEVEMENT_UNLOCKED', () => {
      particleSystem.spawnSparkles(70, 60, '#FDE68A', 22);
    });
    return () => {
      unsub();
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !settings.clickThrough) {
      DesktopWindowService.startDragging();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    particleSystem.spawnHeart(70, 50);
    interact();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    particleSystem.spawnSparkles(70, 60, '#FDE68A', 16);
    setAnimation('celebrate');
    setTimeout(() => setAnimation('idle'), 2500);
  };

  const scale = character.scale * settings.characterScale;
  const canvasSize = Math.round(140 * scale);

  // Subtle transformations per Requirements 10 & 11
  const t = animationFrame * 0.35;
  let translateY = 0;
  let translateX = 0;
  let scaleVal = 1.0;
  let rotateDeg = 0;

  switch (animationState) {
    case 'idle':
      translateY = Math.sin(t) * 2.5;
      scaleVal = 1.0 + Math.sin(t) * 0.015;
      break;
    case 'walk':
      translateY = Math.abs(Math.sin(t * 2)) * -4;
      translateX = Math.sin(t * 2) * 2;
      rotateDeg = Math.sin(t * 2) * 2;
      break;
    case 'run':
      translateY = Math.abs(Math.sin(t * 3)) * -6;
      translateX = Math.sin(t * 3) * 3;
      rotateDeg = 3;
      break;
    case 'jump':
    case 'celebrate':
      translateY = -Math.abs(Math.sin(t * 2)) * 12;
      scaleVal = 1.02;
      rotateDeg = Math.sin(t * 2) * 2.5;
      break;
    case 'dance':
      translateY = Math.sin(t * 2) * 3;
      translateX = Math.sin(t * 2) * 4;
      rotateDeg = Math.sin(t * 2) * 4.5;
      break;
    case 'sleep':
    case 'sit':
      translateY = 4;
      scaleVal = 0.98;
      break;
    default:
      translateY = Math.sin(t) * 2;
      break;
  }

  if (isImageAvatar) {
    return (
      <div
        className="lulu-character"
        style={{
          position: 'relative',
          width: `${canvasSize}px`,
          height: `${canvasSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          cursor: 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          transform: `translate(${translateX}px, ${translateY}px) scale(${facing === 'left' ? -scaleVal : scaleVal}, ${scaleVal}) rotate(${facing === 'left' ? -rotateDeg : rotateDeg}deg)`,
          transition: 'transform 0.08s ease-out',
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={onContextMenu}
      >
        {/* Subtle Sharingan Aura */}
        {perfConfig.performance.glow && (
          <div
            style={{
              position: 'absolute',
              width: `${Math.round(canvasSize * 0.75)}px`,
              height: `${Math.round(canvasSize * 0.75)}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${character.aura || 'rgba(225, 29, 72, 0.45)'} 0%, rgba(225, 29, 72, 0.1) 65%, transparent 100%)`,
              filter: perfConfig.performance.blur ? 'blur(4px)' : 'none',
              transform: `scale(${animationState === 'jump' ? 1.25 : 1.0 + Math.sin(t) * 0.05})`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* User-Provided Exact Character Asset */}
        <img
          src={character.avatarUrl || luluCharacter}
          alt={character.displayName || 'Lulu'}
          draggable={false}
          style={{
            width: 'auto',
            height: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            userSelect: 'none',
            position: 'relative',
            zIndex: 1,
            filter: perfConfig.performance.shadows ? 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35))' : 'none',
          }}
        />

        {/* Particle Canvas Overlay for Sparkles, Hearts, Level Up */}
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{
            position: 'absolute',
            inset: 0,
            width: `${canvasSize}px`,
            height: `${canvasSize}px`,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        cursor: 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{
          width: `${canvasSize}px`,
          height: `${canvasSize}px`,
          imageRendering: 'pixelated',
          display: 'block',
          filter: perfConfig.performance.shadows ? 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25))' : 'none',
        }}
      />
    </div>
  );
};

