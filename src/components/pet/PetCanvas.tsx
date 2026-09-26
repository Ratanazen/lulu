import React, { useEffect, useRef } from 'react';
import { characterManager } from '../../character/CharacterManager';
import { ANIMATION_DEFINITIONS } from '../../animation/definitions';
import { useLuluStore } from '../../stores/useLuluStore';
import { DesktopWindowService } from '../../services/desktopWindow';
import { particleSystem } from '../../animation/particleSystem';
import { eventBus } from '../../services/eventBus';
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

  const animDef = ANIMATION_DEFINITIONS[animationState] || ANIMATION_DEFINITIONS.idle;
  const isImageAvatar =
    character.renderer === 'image_avatar' ||
    Boolean(character.avatarUrl) ||
    character.id === 'madara_shinobi' ||
    character.id === 'lulu';

  // Animation frame updater loop
  useEffect(() => {
    let animId: number;
    let lastFrameTime = performance.now();
    let currentFrame = animationFrame;
    let forward = true;

    const frameInterval = 1000 / (animDef.fps || 6);

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
  }, [animationState, animDef]);

  // Render to canvas & particles animation loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const w = canvas.width;
      const h = canvas.height;

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

      // Update and render particle effects (hearts, sparkles, level-up)
      particleSystem.update(dt, w, h, time);
      particleSystem.render(ctx);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [character, animationState, animationFrame, facing, isImageAvatar]);

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
        <div
          style={{
            position: 'absolute',
            width: `${Math.round(canvasSize * 0.75)}px`,
            height: `${Math.round(canvasSize * 0.75)}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${character.aura || 'rgba(225, 29, 72, 0.45)'} 0%, rgba(225, 29, 72, 0.1) 65%, transparent 100%)`,
            filter: 'blur(4px)',
            transform: `scale(${animationState === 'jump' ? 1.25 : 1.0 + Math.sin(t) * 0.05})`,
            pointerEvents: 'none',
          }}
        />

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
          filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25))',
        }}
      />
    </div>
  );
};
