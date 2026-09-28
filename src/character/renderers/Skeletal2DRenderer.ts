import { ICharacterRenderer, CharacterRenderContext, CharacterRendererCapability } from './ICharacterRenderer';
import { CharacterRendererType } from '../../types';

export class Skeletal2DRenderer implements ICharacterRenderer {
  readonly id: CharacterRendererType = 'skeletal_2d';
  readonly name = 'Vector Skeletal 2D Engine';

  checkCapability(): CharacterRendererCapability {
    return {
      supported: true,
      rendererId: 'skeletal_2d',
      name: this.name,
      hardwareAccelerated: true,
    };
  }

  render(context: CharacterRenderContext): void {
    const { ctx, width, height, animationState, animationFrame, facing, character, mouthShape = 'closed' } = context;

    ctx.save();

    const cx = width / 2;
    const cy = height * 0.65;
    const scale = (context.scale || character.scale || 1.0) * 1.1;

    ctx.translate(cx, cy);
    if (facing === 'left') {
      ctx.scale(-1, 1);
    }
    ctx.scale(scale, scale);

    // Dynamic bone rotations based on animation state and frame
    const time = animationFrame * 0.4;
    let bobY = 0;
    let headRot = 0;
    let armRotL = 0;
    let armRotR = 0;
    let legRotL = 0;
    let legRotR = 0;
    let tailRot = Math.sin(time) * 0.15;

    switch (animationState) {
      case 'walk':
        bobY = Math.sin(time * 2) * 4;
        legRotL = Math.sin(time * 2) * 0.4;
        legRotR = -Math.sin(time * 2) * 0.4;
        armRotL = -legRotL * 0.6;
        armRotR = -legRotR * 0.6;
        headRot = Math.sin(time) * 0.05;
        break;
      case 'run':
        bobY = Math.sin(time * 3) * 6;
        legRotL = Math.sin(time * 3) * 0.6;
        legRotR = -Math.sin(time * 3) * 0.6;
        armRotL = -legRotL * 0.8;
        armRotR = -legRotR * 0.8;
        headRot = 0.1;
        break;
      case 'jump':
      case 'dance':
        bobY = -Math.abs(Math.sin(time * 2)) * 14;
        armRotL = -0.8 + Math.sin(time * 4) * 0.3;
        armRotR = 0.8 - Math.sin(time * 4) * 0.3;
        legRotL = 0.2;
        legRotR = -0.2;
        headRot = Math.sin(time * 2) * 0.15;
        break;
      case 'celebrate':
        bobY = -Math.abs(Math.sin(time * 3)) * 10;
        armRotL = -1.2;
        armRotR = 1.2;
        headRot = Math.sin(time * 3) * 0.1;
        break;
      case 'sit':
      case 'sleep':
        bobY = 6;
        legRotL = 0.7;
        legRotR = 0.7;
        armRotL = 0.3;
        armRotR = -0.3;
        headRot = 0.2;
        tailRot = Math.sin(time * 0.5) * 0.08;
        break;
      case 'curious':
        headRot = 0.25;
        bobY = Math.sin(time) * 2;
        break;
      default:
        // idle breathing
        bobY = Math.sin(time) * 2;
        headRot = Math.sin(time * 0.5) * 0.03;
        armRotL = Math.sin(time * 0.8) * 0.05;
        armRotR = -Math.sin(time * 0.8) * 0.05;
        break;
    }

    const p = character.palette;

    // 1. Render Aura Glow
    if (character.aura) {
      const grad = ctx.createRadialGradient(0, -20 + bobY, 10, 0, -20 + bobY, 65);
      grad.addColorStop(0, character.aura);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -20 + bobY, 65, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Tail Bone
    ctx.save();
    ctx.translate(14, -12 + bobY);
    ctx.rotate(tailRot);
    ctx.strokeStyle = p.shadow;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(24, -10, 32, -26);
    ctx.stroke();

    ctx.strokeStyle = p.primary;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(24, -10, 32, -26);
    ctx.stroke();
    ctx.restore();

    // 3. Legs / Feet Bones
    const drawLeg = (offsetX: number, rot: number) => {
      ctx.save();
      ctx.translate(offsetX, 4 + bobY);
      ctx.rotate(rot);
      ctx.fillStyle = p.shadow;
      ctx.beginPath();
      ctx.ellipse(0, 8, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.primary;
      ctx.beginPath();
      ctx.ellipse(0, 8, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    drawLeg(-12, legRotL);
    drawLeg(12, legRotR);

    // 4. Torso Bone
    ctx.save();
    ctx.translate(0, -10 + bobY);
    ctx.fillStyle = p.shadow;
    ctx.beginPath();
    ctx.roundRect(-18, -16, 36, 32, 14);
    ctx.fill();

    ctx.fillStyle = p.primary;
    ctx.beginPath();
    ctx.roundRect(-17, -15, 34, 30, 13);
    ctx.fill();

    // Chest / Belly Patch
    ctx.fillStyle = p.secondary;
    ctx.beginPath();
    ctx.ellipse(0, 2, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Accessory: Backpack
    if (character.accessories?.includes('backpack')) {
      ctx.fillStyle = '#B45309'; // Rich leather amber
      ctx.beginPath();
      ctx.roundRect(-16, -10, 32, 24, 7);
      ctx.fill();
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.roundRect(-12, -4, 24, 15, 5);
      ctx.fill();
      // Buckle & Straps
      ctx.fillStyle = '#FDE68A';
      ctx.fillRect(-4, 0, 8, 4);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, -10); ctx.lineTo(-10, 8);
      ctx.moveTo(10, -10);  ctx.lineTo(10, 8);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Arms / Paws Bones
    const drawArm = (offsetX: number, rot: number, isRight: boolean) => {
      ctx.save();
      ctx.translate(offsetX, -16 + bobY);
      ctx.rotate(rot);
      ctx.fillStyle = p.shadow;
      ctx.beginPath();
      ctx.ellipse(isRight ? 6 : -6, 12, 5, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = p.primary;
      ctx.beginPath();
      ctx.ellipse(isRight ? 6 : -6, 12, 4, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    drawArm(-16, armRotL, false);
    drawArm(16, armRotR, true);

    // 6. Head Bone
    ctx.save();
    ctx.translate(0, -38 + bobY);
    ctx.rotate(headRot);

    // Ears
    const drawEar = (isRight: boolean) => {
      ctx.save();
      ctx.translate(isRight ? 18 : -18, -20);
      ctx.rotate(isRight ? 0.2 : -0.2);
      ctx.fillStyle = p.shadow;
      ctx.beginPath();
      ctx.moveTo(-10, 8);
      ctx.lineTo(0, -18);
      ctx.lineTo(10, 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = p.primary;
      ctx.beginPath();
      ctx.moveTo(-9, 7);
      ctx.lineTo(0, -16);
      ctx.lineTo(9, 7);
      ctx.closePath();
      ctx.fill();

      // Inner Ear
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.moveTo(-5, 5);
      ctx.lineTo(0, -10);
      ctx.lineTo(5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawEar(false);
    drawEar(true);

    // Head Base
    ctx.fillStyle = p.shadow;
    ctx.beginPath();
    ctx.ellipse(0, 0, 27, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.primary;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 23, 0, 0, Math.PI * 2);
    ctx.fill();

    // Accessory: Hat
    if (character.accessories?.includes('hat') || character.accessories?.includes('wizard_hat')) {
      ctx.fillStyle = '#4C1D95';
      ctx.beginPath();
      ctx.ellipse(0, -18, 28, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5B21B6';
      ctx.beginPath();
      ctx.moveTo(-18, -18);
      ctx.quadraticCurveTo(-4, -42, 6, -46);
      ctx.quadraticCurveTo(8, -34, 18, -18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.ellipse(0, -19, 19, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.arc(6, -46, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Accessory: Headset
    if (character.accessories?.includes('headset')) {
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, -12, 26, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.fillStyle = '#0369A1';
      ctx.beginPath();
      ctx.roundRect(-29, -8, 7, 18, 3);
      ctx.fill();
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(-27, -5, 3, 12);
      ctx.fillStyle = '#0369A1';
      ctx.beginPath();
      ctx.roundRect(22, -8, 7, 18, 3);
      ctx.fill();
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(24, -5, 3, 12);
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-26, 6);
      ctx.lineTo(-14, 13);
      ctx.stroke();
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(-14, 13, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Starlight Forehead Mark / Leaf Headband
    if (character.accessories?.includes('leaf_headband') || character.id === 'naruto_shinobi') {
      // Hidden Leaf Forehead Protector Band
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(-22, -17, 44, 9, 2);
      ctx.fill();

      // Metallic Plate
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.roundRect(-14, -16, 28, 7, 2);
      ctx.fill();
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Corner rivets
      ctx.fillStyle = '#64748B';
      ctx.beginPath();
      ctx.arc(-11.5, -12.5, 0.9, 0, Math.PI * 2);
      ctx.arc(11.5, -12.5, 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Engraved Konoha Leaf Spiral
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, -12.5, 2.2, 0.4 * Math.PI, 1.8 * Math.PI);
      ctx.lineTo(2.2, -10.5);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.arc(0, -10, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cheeks
    ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-16, 6, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(16, 6, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers (Naruto Shinobi)
    if (character.accessories?.includes('whisker_marks') || character.id === 'naruto_shinobi') {
      ctx.strokeStyle = '#C2410C';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Left cheek 3 whiskers
      ctx.moveTo(-12, 3.5); ctx.lineTo(-19, 2.5);
      ctx.moveTo(-13, 6);   ctx.lineTo(-20, 6);
      ctx.moveTo(-12, 8.5); ctx.lineTo(-19, 9.5);
      // Right cheek 3 whiskers
      ctx.moveTo(12, 3.5);  ctx.lineTo(19, 2.5);
      ctx.moveTo(13, 6);    ctx.lineTo(20, 6);
      ctx.moveTo(12, 8.5);  ctx.lineTo(19, 9.5);
      ctx.stroke();
    }

    // Eyes
    if (animationState === 'sleep') {
      ctx.strokeStyle = '#1E1B4B';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(-10, 1, 5, 0.1 * Math.PI, 0.9 * Math.PI, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(10, 1, 5, 0.1 * Math.PI, 0.9 * Math.PI, false);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.ellipse(-10, 0, 4.5, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(10, 0, 4.5, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye Highlights
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-11, -2, 2, 0, Math.PI * 2);
      ctx.arc(9, -2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Accessory: Glasses
    if (character.accessories?.includes('glasses') || character.accessories?.includes('star_glasses')) {
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.2;
      // Left frame
      ctx.beginPath();
      ctx.roundRect(-16, -6, 12, 11, 3);
      ctx.stroke();
      // Right frame
      ctx.beginPath();
      ctx.roundRect(4, -6, 12, 11, 3);
      ctx.stroke();
      // Bridge
      ctx.beginPath();
      ctx.moveTo(-4, -1);
      ctx.lineTo(4, -1);
      ctx.stroke();
      // Lens shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(-12, -3, 3, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.arc(8, -3, 3, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.fill();
    }

    // Nose
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(-2, 3);
    ctx.lineTo(2, 3);
    ctx.closePath();
    ctx.fill();

    // 7. Dynamic Lip Sync Mouth Shapes
    ctx.fillStyle = '#1E1B4B';
    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = 2;
    ctx.beginPath();

    switch (mouthShape) {
      case 'open':
        ctx.ellipse(0, 10, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#F472B6';
        ctx.beginPath();
        ctx.ellipse(0, 12, 2.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'medium':
        ctx.ellipse(0, 10, 3.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'small':
        ctx.ellipse(0, 9, 2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'smile':
        ctx.arc(0, 7, 5, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        break;
      case 'closed':
      default:
        ctx.arc(-2.5, 8, 2.5, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(2.5, 8, 2.5, 0, Math.PI);
        ctx.stroke();
        break;
    }

    ctx.restore(); // Head
    ctx.restore(); // Main transform
  }
}
