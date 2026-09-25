export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
  shape: 'star' | 'heart' | 'circle';
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private lastAmbientSpawn: number = 0;

  public spawnHeart(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 20,
        vy: -25 - Math.random() * 25,
        size: 5 + Math.random() * 4,
        color: '#F472B6', // Rose Pink
        alpha: 1.0,
        maxLife: 1.2,
        life: 1.2,
        shape: 'heart',
      });
    }
  }

  public spawnSparkles(x: number, y: number, color: string = '#FDE68A', count: number = 10): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 45;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color,
        alpha: 1.0,
        maxLife: 0.9,
        life: 0.9,
        shape: 'star',
      });
    }
  }

  public update(dt: number, width: number, height: number, now: number = performance.now()): void {
    // Ambient twinkling dust
    if (now - this.lastAmbientSpawn > 500 && this.particles.length < 15) {
      this.lastAmbientSpawn = now;
      this.particles.push({
        x: Math.random() * width,
        y: height - 10 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 8,
        vy: -8 - Math.random() * 12,
        size: 2 + Math.random() * 2,
        color: '#E0E7FF',
        alpha: 0.7,
        maxLife: 2.5,
        life: 2.5,
        shape: 'circle',
      });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.particles.length === 0) return;

    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'star') {
        // 4-point twinkling starlight diamond
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size / 2, p.y);
        ctx.lineTo(p.x, p.y + p.size);
        ctx.lineTo(p.x - p.size / 2, p.y);
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'heart') {
        // Small heart
        const s = p.size;
        ctx.beginPath();
        ctx.arc(p.x - s / 4, p.y, s / 3, Math.PI, 0, false);
        ctx.arc(p.x + s / 4, p.y, s / 3, Math.PI, 0, false);
        ctx.lineTo(p.x, p.y + s / 1.5);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  public clear(): void {
    this.particles = [];
  }
}

export const particleSystem = new ParticleSystem();
