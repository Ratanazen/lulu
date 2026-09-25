import React, { useEffect, useRef } from 'react';
import { PixelRenderer } from '../../animation/pixelRenderer';
import { characterManager } from '../../character/CharacterManager';
import { ANIMATION_DEFINITIONS } from '../../animation/definitions';
import { useLuluStore } from '../../stores/useLuluStore';
import { DesktopWindowService } from '../../services/desktopWindow';
import { particleSystem } from '../../animation/particleSystem';
import { eventBus } from '../../services/eventBus';

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
            // Once finished, revert to idle if not looping
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

      // 1. Render character frame using active capability-resolved renderer
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

      // 2. Update and render particle effects
      particleSystem.update(dt, w, h, time);
      particleSystem.render(ctx);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [character, animationState, animationFrame, facing]);

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
    // If left click held and not on context menu, initiate native drag
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
