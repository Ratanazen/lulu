import { ICharacterRenderer, CharacterRenderContext, CharacterRendererCapability } from './ICharacterRenderer';
import { CharacterRendererType } from '../../types';

export class ImageAvatarRendererAdapter implements ICharacterRenderer {
  readonly id: CharacterRendererType = 'image_avatar';
  readonly name = 'Image Avatar Companion Engine';

  private imageCache = new Map<string, HTMLImageElement>();
  private imageLoadFailed = new Set<string>();

  checkCapability(): CharacterRendererCapability {
    return {
      supported: true,
      rendererId: 'image_avatar',
      name: this.name,
      hardwareAccelerated: true,
    };
  }

  public getImage(url: string): HTMLImageElement | null {
    if (this.imageLoadFailed.has(url)) return null;

    let img = this.imageCache.get(url);
    if (!img && typeof window !== 'undefined' && typeof Image !== 'undefined') {
      img = new Image();
      img.src = url;
      img.onload = () => {
        this.imageCache.set(url, img!);
      };
      img.onerror = () => {
        this.imageLoadFailed.add(url);
      };
      this.imageCache.set(url, img);
    }
    return img || null;
  }

  render(context: CharacterRenderContext): void {
    const { ctx, width, height, animationState, animationFrame, facing, character } = context;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.52;
    const scale = (context.scale || character.scale || 1.0);

    // Compute lively animation motion
    const t = animationFrame * 0.3;
    let bobY = 0;
    let tilt = 0;
    let auraScale = 1.0;

    switch (animationState) {
      case 'walk':
        bobY = Math.sin(t * 2) * 4;
        tilt = Math.sin(t * 2) * 0.05;
        break;
      case 'run':
        bobY = Math.sin(t * 3) * 6;
        tilt = 0.08;
        break;
      case 'jump':
      case 'dance':
        bobY = -Math.abs(Math.sin(t * 2)) * 14;
        tilt = Math.sin(t * 2) * 0.1;
        auraScale = 1.25;
        break;
      case 'celebrate':
        bobY = -Math.abs(Math.sin(t * 3)) * 10;
        tilt = Math.sin(t * 3) * 0.06;
        auraScale = 1.2;
        break;
      case 'sit':
      case 'sleep':
        bobY = 6;
        tilt = 0.03;
        auraScale = 0.85;
        break;
      default:
        // Idle gentle breathing
        bobY = Math.sin(t) * 2.5;
        auraScale = 1.0 + Math.sin(t) * 0.05;
        break;
    }

    ctx.translate(cx, cy + bobY);

    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    ctx.rotate(tilt);
    ctx.scale(scale, scale);

    // 1. Render Sharingan / Chakra Aura
    const auraColor = character.aura || character.palette.glow || 'rgba(225, 29, 72, 0.4)';
    const radGrad = ctx.createRadialGradient(0, 5, 20, 0, 5, 65 * auraScale);
    radGrad.addColorStop(0, auraColor);
    radGrad.addColorStop(0.65, auraColor.replace(/[\d\.]+\)$/, '0.15)'));
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(0, 5, 65 * auraScale, 0, Math.PI * 2);
    ctx.fill();

    // 2. Resolve image asset
    const imgUrl = character.modelPath || character.avatarUrl || '/characters/lulu-character.png';
    const img = this.getImage(imgUrl);

    if (img && img.complete && img.naturalWidth > 0) {
      const targetW = 100;
      const aspect = img.naturalHeight / img.naturalWidth;
      const targetH = targetW * aspect;

      ctx.drawImage(
        img,
        -targetW / 2,
        -targetH / 2,
        targetW,
        targetH
      );
    } else {
      // Elegant Shinobi Placeholder while asset loads
      ctx.fillStyle = character.palette.primary || '#E11D48';
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👁️', 0, 0);
    }

    ctx.restore();
  }
}
