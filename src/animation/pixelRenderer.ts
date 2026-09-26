import { AnimationState, ColorPalette } from '../types';

export class PixelRenderer {
  /**
   * Procedurally renders Lulu's pixel-art frame to an HTMLCanvasElement
   * with crisp nearest-neighbor integer scaling and support for accessories/auras.
   */
  public static renderFrame(
    ctx: CanvasRenderingContext2D,
    state: AnimationState,
    frame: number,
    facing: 'left' | 'right',
    palette: ColorPalette,
    width: number = 96,
    height: number = 96,
    aura?: string,
    accessories?: string[]
  ): void {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);

    ctx.save();

    // Center origin
    ctx.translate(width / 2, height / 2);

    // Flip horizontally if facing left
    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    // Base pixel grid size
    const pixelSize = Math.floor(width / 28);

    const drawPixel = (px: number, py: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(px * pixelSize, py * pixelSize, pixelSize, pixelSize);
    };

    const drawRect = (px: number, py: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(px * pixelSize, py * pixelSize, w * pixelSize, h * pixelSize);
    };

    // Animation bob offsets & angles
    let bodyY = 0;
    let earAngle = 0;
    let pawOffset = 0;

    switch (state) {
      case 'idle':
        bodyY = Math.sin(frame * Math.PI) * 0.8;
        break;
      case 'walk':
        bodyY = Math.abs(Math.sin((frame / 4) * Math.PI * 2)) * -1.5;
        pawOffset = Math.sin((frame / 4) * Math.PI * 2) * 2;
        break;
      case 'run':
        bodyY = Math.abs(Math.sin((frame / 4) * Math.PI * 2)) * -2.5;
        pawOffset = Math.sin((frame / 4) * Math.PI * 2) * 3.5;
        break;
      case 'jump':
      case 'celebrate':
        bodyY = -3.5 - Math.sin((frame / 4) * Math.PI) * 2;
        break;
      case 'sleep':
        bodyY = 1.5;
        break;
      case 'yawn':
        bodyY = -1.0;
        earAngle = -1.0;
        break;
      case 'nod':
        bodyY = Math.sin(frame * Math.PI) * 1.5;
        break;
      case 'dizzy':
        bodyY = Math.sin(frame * Math.PI * 2) * 0.8;
        earAngle = Math.cos(frame * Math.PI * 2) * 2.0;
        break;
      case 'meditate':
        bodyY = -2.5 + Math.sin(frame * 0.5 * Math.PI) * 1.2; // floating hover
        break;
      case 'pout':
        bodyY = 0;
        earAngle = -1.5;
        break;
      case 'dance':
        bodyY = Math.abs(Math.sin((frame / 6) * Math.PI * 2)) * -2;
        earAngle = Math.sin((frame / 6) * Math.PI * 2) * 1.5;
        break;
      case 'curious':
        earAngle = 1.2;
        break;
    }

    const by = Math.round(bodyY);

    // 0. Celestial Aura Glow (if configured or meditating)
    const effectiveAura = aura || (state === 'meditate' ? palette.glow : undefined);
    if (effectiveAura) {
      ctx.fillStyle = effectiveAura.startsWith('rgba') ? effectiveAura : `${effectiveAura}33`;
      ctx.beginPath();
      ctx.ellipse(0, by * pixelSize, 11 * pixelSize, 9 * pixelSize, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 1. Soft Ground Shadow
    if (state !== 'sleep') {
      const shadowW = state === 'meditate' ? 5 : 7;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 9 * pixelSize, shadowW * pixelSize, 2.5 * pixelSize, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Ears
    const earY = -7 + by;
    // Left Ear
    drawRect(-6, earY - 4 - Math.round(earAngle), 3, 5, palette.shadow);
    drawRect(-5, earY - 3 - Math.round(earAngle), 2, 4, palette.primary);
    drawRect(-5, earY - 1 - Math.round(earAngle), 1, 2, palette.accent);

    // Right Ear
    drawRect(3, earY - 4 + Math.round(earAngle), 3, 5, palette.shadow);
    drawRect(3, earY - 3 + Math.round(earAngle), 2, 4, palette.primary);
    drawRect(4, earY - 1 + Math.round(earAngle), 1, 2, palette.accent);

    // 3. Body (Main Head & Torso)
    drawRect(-7, -4 + by, 14, 11, palette.shadow);
    drawRect(-8, -2 + by, 16, 7, palette.shadow);

    drawRect(-6, -3 + by, 12, 9, palette.primary);
    drawRect(-7, -1 + by, 14, 5, palette.primary);

    // Inner Glow / Belly
    drawRect(-4, 0 + by, 8, 5, palette.secondary);
    drawRect(-3, 1 + by, 6, 4, palette.glow);

    // 4. Forehead Celestial Star
    drawPixel(0, -2 + by, palette.accent);
    drawPixel(-1, -2 + by, palette.accent);
    drawPixel(1, -2 + by, palette.accent);
    drawPixel(0, -3 + by, palette.accent);
    drawPixel(0, -1 + by, palette.accent);

    // 5. Cheeks (Blush)
    if (state === 'happy' || state === 'celebrate' || state === 'excited' || state === 'playful' || state === 'pout') {
      drawRect(-6, 2 + by, 2, 1, '#F472B6');
      drawRect(4, 2 + by, 2, 1, '#F472B6');
    }

    // 6. Eyes
    const eyeY = 0 + by;
    if (state === 'sleep' || state === 'meditate') {
      // Peaceful closed curved eyes
      drawRect(-5, eyeY, 3, 1, palette.shadow);
      drawRect(2, eyeY, 3, 1, palette.shadow);
      drawPixel(-4, eyeY + 1, palette.shadow);
      drawPixel(3, eyeY + 1, palette.shadow);
    } else if (state === 'happy' || state === 'celebrate' || state === 'nod') {
      // Joyful ^ ^ eyes
      drawPixel(-5, eyeY, palette.shadow);
      drawPixel(-4, eyeY - 1, palette.shadow);
      drawPixel(-3, eyeY, palette.shadow);

      drawPixel(2, eyeY, palette.shadow);
      drawPixel(3, eyeY - 1, palette.shadow);
      drawPixel(4, eyeY, palette.shadow);
    } else if (state === 'dizzy') {
      // Swirly @ @ eyes
      drawPixel(-5, eyeY - 1, palette.shadow);
      drawPixel(-4, eyeY, palette.shadow);
      drawPixel(-3, eyeY + 1, palette.shadow);

      drawPixel(2, eyeY - 1, palette.shadow);
      drawPixel(3, eyeY, palette.shadow);
      drawPixel(4, eyeY + 1, palette.shadow);
    } else if (state === 'pout') {
      // Annoyed half-closed slit eyes
      drawRect(-5, eyeY, 3, 1, palette.shadow);
      drawRect(2, eyeY, 3, 1, palette.shadow);
    } else if (state === 'read') {
      // Looking down into book
      drawRect(-5, eyeY + 1, 2, 2, palette.shadow);
      drawRect(3, eyeY + 1, 2, 2, palette.shadow);
      drawPixel(-5, eyeY + 1, '#FFFFFF');
      drawPixel(3, eyeY + 1, '#FFFFFF');
    } else if (state === 'excited') {
      // Star sparkling eyes
      drawPixel(-4, eyeY, palette.accent);
      drawPixel(-5, eyeY, palette.shadow);
      drawPixel(-3, eyeY, palette.shadow);
      drawPixel(-4, eyeY - 1, palette.shadow);
      drawPixel(-4, eyeY + 1, palette.shadow);

      drawPixel(3, eyeY, palette.accent);
      drawPixel(2, eyeY, palette.shadow);
      drawPixel(4, eyeY, palette.shadow);
      drawPixel(3, eyeY - 1, palette.shadow);
      drawPixel(3, eyeY + 1, palette.shadow);
    } else {
      // Normal / Curious / Idle open eyes
      const blink = state === 'idle' && frame === 3;
      if (blink) {
        drawRect(-5, eyeY, 3, 1, palette.shadow);
        drawRect(2, eyeY, 3, 1, palette.shadow);
      } else {
        drawRect(-5, eyeY - 1, 2, 3, palette.shadow);
        drawRect(3, eyeY - 1, 2, 3, palette.shadow);
        drawPixel(-5, eyeY - 1, '#FFFFFF');
        drawPixel(3, eyeY - 1, '#FFFFFF');
      }
    }

    // 7. Mouth
    const mouthY = 3 + by;
    if (state === 'yawn') {
      // Wide open yawn 'O'
      drawRect(-2, mouthY, 4, 3, '#BE185D');
    } else if (state === 'pout') {
      // Downwards frown
      drawPixel(-1, mouthY + 1, palette.shadow);
      drawPixel(0, mouthY, palette.shadow);
      drawPixel(1, mouthY + 1, palette.shadow);
    } else if (state === 'happy' || state === 'excited' || state === 'celebrate') {
      drawRect(-1, mouthY, 2, 2, '#BE185D');
    } else if (state === 'surprised') {
      drawRect(-1, mouthY, 2, 2, palette.shadow);
    } else {
      drawPixel(-1, mouthY, palette.shadow);
      drawPixel(0, mouthY + 1, palette.shadow);
      drawPixel(1, mouthY, palette.shadow);
    }

    // 8. Paws / Held Items
    const feetY = 7 + by;
    if (state === 'read') {
      // Holding open spellbook/tablet
      drawRect(-5, feetY - 2, 10, 4, '#3B82F6');
      drawRect(-4, feetY - 1, 8, 2, '#F8FAFC');
      drawPixel(0, feetY - 1, '#1E293B'); // Book spine
      drawRect(-6, feetY, 2, 2, palette.secondary);
      drawRect(4, feetY, 2, 2, palette.secondary);
    } else if (state === 'sleep' || state === 'meditate') {
      drawRect(-4, feetY, 3, 2, palette.secondary);
      drawRect(1, feetY, 3, 2, palette.secondary);
    } else if (state === 'wave') {
      drawRect(-5, feetY, 3, 2, palette.secondary);
      drawRect(2, feetY, 3, 2, palette.secondary);
      const waveY = -2 + Math.round(Math.sin((frame / 4) * Math.PI * 2) * 2);
      drawRect(6, waveY, 3, 3, palette.secondary);
    } else {
      drawRect(-5, feetY + Math.round(pawOffset), 3, 2, palette.secondary);
      drawRect(2, feetY - Math.round(pawOffset), 3, 2, palette.secondary);
    }

    // 9. Floating particle effects
    if (state === 'sleep' || state === 'yawn') {
      const zOffset = (frame % 4) * 2;
      drawPixel(6 + zOffset, -4 - zOffset, palette.accent);
      drawPixel(7 + zOffset, -5 - zOffset, palette.accent);
    } else if (state === 'meditate') {
      // Starlight particles orbiting
      drawPixel(-8, -6 + Math.round(Math.sin(frame) * 2), palette.accent);
      drawPixel(8, -6 + Math.round(Math.cos(frame) * 2), palette.accent);
    } else if (state === 'dance' || state === 'listen') {
      drawPixel(7, -6 + Math.round(Math.sin(frame) * 2), '#EC4899');
      drawPixel(8, -7 + Math.round(Math.sin(frame) * 2), '#EC4899');
    }

    // 10. Accessories
    if (accessories?.includes('halo')) {
      // Golden celestial halo
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, earY - 7, 6 * pixelSize, 2 * pixelSize, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (accessories?.includes('star_glasses')) {
      // Cute star glasses
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-6 * pixelSize, (eyeY - 2) * pixelSize, 4 * pixelSize, 4 * pixelSize);
      ctx.strokeRect(2 * pixelSize, (eyeY - 2) * pixelSize, 4 * pixelSize, 4 * pixelSize);
      ctx.beginPath();
      ctx.moveTo(-2 * pixelSize, eyeY * pixelSize);
      ctx.lineTo(2 * pixelSize, eyeY * pixelSize);
      ctx.stroke();
    }
    if (accessories?.includes('crown')) {
      // Golden regal crown with ruby gem
      drawRect(-3, earY - 4, 6, 2, '#F59E0B');
      drawPixel(-3, earY - 5, '#FBBF24');
      drawPixel(0, earY - 6, '#EF4444'); // Ruby peak
      drawPixel(2, earY - 5, '#FBBF24');
    }
    if (accessories?.includes('ribbon')) {
      // Cute pastel ribbon bow
      drawRect(4, earY - 2, 3, 3, '#F472B6');
      drawPixel(3, earY - 1, '#FB7185');
      drawPixel(7, earY - 1, '#FB7185');
    }
    if (accessories?.includes('wizard_hat')) {
      // Celestial wizard hat with gold star
      drawRect(-5, earY - 3, 10, 2, '#4338CA');
      drawRect(-3, earY - 6, 6, 3, '#4338CA');
      drawRect(-2, earY - 9, 4, 3, '#6366F1');
      drawPixel(-1, earY - 11, '#FDE68A');
    }
    if (accessories?.includes('leaf_headband') || accessories?.includes('naruto_headband')) {
      // Hidden Leaf Forehead Protector
      drawRect(-6, earY - 1, 12, 3, '#1E293B'); // Blue fabric band
      drawRect(-4, earY - 1, 8, 3, '#CBD5E1'); // Metallic plate
      drawPixel(-3, earY, '#64748B'); // Rivet L
      drawPixel(2, earY, '#64748B'); // Rivet R
      drawPixel(-1, earY, '#0F172A'); // Leaf swirl center
      drawPixel(0, earY, '#0F172A');
    }
    if (accessories?.includes('whisker_marks')) {
      // Naruto cheek whiskers (3 on each cheek)
      drawPixel(-6, eyeY + 1, '#C2410C');
      drawPixel(-7, eyeY + 2, '#C2410C');
      drawPixel(-6, eyeY + 3, '#C2410C');
      drawPixel(5, eyeY + 1, '#C2410C');
      drawPixel(6, eyeY + 2, '#C2410C');
      drawPixel(5, eyeY + 3, '#C2410C');
    }

    ctx.restore();
  }
}
