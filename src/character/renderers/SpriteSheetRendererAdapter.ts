// Universal Sprite Sheet Animation Engine Adapter for Lulu Desktop
// Renders standard horizontal and vertical sprite sheets (PNG / WebP) with
// customizable frame pacing, loop trimming, and automatic fallback rendering.

import { ICharacterRenderer, CharacterRenderContext, CharacterRendererCapability } from './ICharacterRenderer';
import { CharacterRendererType, SpriteSheetActionConfig } from '../../types';

export class SpriteSheetRendererAdapter implements ICharacterRenderer {
  readonly id: CharacterRendererType = 'spritesheet';
  readonly name = 'Universal Sprite Sheet Animation Engine';

  private imageCache = new Map<string, HTMLImageElement>();
  private imageLoadFailed = new Set<string>();

  checkCapability(): CharacterRendererCapability {
    return {
      supported: true,
      rendererId: 'spritesheet',
      name: this.name,
      hardwareAccelerated: true,
    };
  }

  /**
   * Preloads or retrieves an image element from cache
   */
  public getImage(url: string): HTMLImageElement | null {
    if (this.imageLoadFailed.has(url)) {
      return null;
    }

    let img = this.imageCache.get(url);
    if (!img && typeof window !== 'undefined' && typeof Image !== 'undefined') {
      img = new Image();
      img.src = url;
      img.onerror = () => {
        this.imageLoadFailed.add(url);
      };
      this.imageCache.set(url, img);
    }
    return img || null;
  }

  render(context: CharacterRenderContext): void {
    const { ctx, width, height, animationState, animationFrame, facing, character } = context;
    const config = character.spriteSheetConfig;

    // Resolve action matching current animation state or fallback to idle
    let action: SpriteSheetActionConfig | undefined;
    if (config?.actions) {
      action = config.actions[animationState] || config.actions['idle'] || Object.values(config.actions)[0];
    }

    ctx.clearRect(0, 0, width, height);

    // If no sprite config or missing image, render procedural cyber placeholder
    if (!action || !action.fileUrl) {
      this.renderProceduralFallback(context);
      return;
    }

    const img = this.getImage(action.fileUrl);

    // If image not yet loaded, render stylized loading placeholder
    if (!img || !img.complete || img.naturalWidth === 0) {
      this.renderProceduralFallback(context);
      return;
    }

    const totalFrames = Math.max(1, action.frameCount || 1);
    const frameIndex = Math.abs(Math.floor(animationFrame)) % totalFrames;
    const orientation = action.orientation || 'horizontal';

    const fw = action.frameWidth || (orientation === 'horizontal' ? img.naturalWidth / totalFrames : img.naturalWidth);
    const fh = action.frameHeight || (orientation === 'vertical' ? img.naturalHeight / totalFrames : img.naturalHeight);

    const sx = orientation === 'horizontal' ? frameIndex * fw : 0;
    const sy = orientation === 'vertical' ? frameIndex * fh : 0;

    const scale = context.scale || character.scale || 1.0;
    const targetW = fw * scale;
    const targetH = fh * scale;

    ctx.save();
    ctx.imageSmoothingEnabled = false; // Nearest-neighbor crisp pixel rendering

    // Center on canvas
    ctx.translate(width / 2, height / 2);

    // Facing flip
    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    // Optional aura glow
    if (character.aura) {
      ctx.shadowColor = character.aura;
      ctx.shadowBlur = 12;
    }

    const dx = -targetW / 2 + (config?.offset?.x || 0);
    const dy = -targetH / 2 + (config?.offset?.y || 0);

    ctx.drawImage(img, sx, sy, fw, fh, dx, dy, targetW, targetH);
    ctx.restore();
  }

  /**
   * Procedural fallback rendered when sprite assets are still loading or unavailable
   */
  private renderProceduralFallback(context: CharacterRenderContext): void {
    const { ctx, width, height, animationFrame, character, facing } = context;
    const palette = character.palette;
    const bob = Math.sin(animationFrame * 0.2) * 3;

    ctx.save();
    ctx.translate(width / 2, height / 2 + bob);

    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    // Cyber aura
    if (character.aura) {
      ctx.beginPath();
      ctx.arc(0, -6, 26, 0, Math.PI * 2);
      ctx.fillStyle = character.aura;
      ctx.fill();
    }

    // Chassis body
    ctx.fillStyle = palette.primary;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-18, -24, 36, 36, [8]) : ctx.rect(-18, -24, 36, 36);
    ctx.fill();
    ctx.strokeStyle = palette.shadow;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Visor screen
    ctx.fillStyle = palette.shadow;
    ctx.fillRect(-14, -18, 28, 14);

    // Glowing eyes / matrix visor
    ctx.fillStyle = palette.glow || palette.accent;
    ctx.fillRect(-10, -14, 6, 6);
    ctx.fillRect(4, -14, 6, 6);

    // Antenna
    ctx.strokeStyle = palette.secondary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(0, -32);
    ctx.stroke();

    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(0, -33, 3, 0, Math.PI * 2);
    ctx.fill();

    // Hover thruster / feet
    ctx.fillStyle = palette.secondary;
    ctx.fillRect(-12, 12, 8, 4);
    ctx.fillRect(4, 12, 8, 4);

    ctx.restore();
  }
}
