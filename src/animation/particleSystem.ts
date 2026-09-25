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
  shape: 'star' | 'heart' | 'circle' | 'note' | 'zzz' | 'fire' | 'snowflake' | 'petal' | 'confetti';
  rotation?: number;
  rotationSpeed?: number;
}

export type ParticlePreset =
  | 'hearts'
  | 'sparkles'
  | 'music_notes'
  | 'sleep_zzz'
  | 'level_up'
  | 'fire_streak'
  | 'snowfall'
  | 'sakura'
  | 'confetti'
  | 'surprise'
  | 'error_sweat';

export class ParticleSystem {
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private lastAmbientSpawn: number = 0;
  private maxParticles: number = 80;

  private allocate(): Particle {
    const recycled = this.pool.pop();
    if (recycled) return recycled;
    return {
      x: 0, y: 0, vx: 0, vy: 0, size: 4, color: '#fff',
      alpha: 1, maxLife: 1, life: 1, shape: 'circle',
      rotation: 0, rotationSpeed: 0,
    };
  }

  private emit(overrides: Partial<Particle>): void {
    if (this.particles.length >= this.maxParticles) return;
    const p = this.allocate();
    Object.assign(p, {
      x: 0, y: 0, vx: 0, vy: 0, size: 4, color: '#fff',
      alpha: 1, maxLife: 1, life: 1, shape: 'circle' as const,
      rotation: 0, rotationSpeed: 0,
      ...overrides,
    });
    this.particles.push(p);
  }

  public spawnPreset(preset: ParticlePreset, x: number, y: number, count?: number): void {
    switch (preset) {
      case 'hearts': this.spawnHeart(x, y); break;
      case 'sparkles': this.spawnSparkles(x, y, '#FDE68A', count ?? 10); break;
      case 'music_notes': this.spawnMusicNotes(x, y, count ?? 5); break;
      case 'sleep_zzz': this.spawnSleepZzz(x, y); break;
      case 'level_up': this.spawnLevelUp(x, y); break;
      case 'fire_streak': this.spawnFireStreak(x, y, count ?? 8); break;
      case 'snowfall': this.spawnSnowfall(x, y, count ?? 6); break;
      case 'sakura': this.spawnSakura(x, y, count ?? 5); break;
      case 'confetti': this.spawnConfetti(x, y, count ?? 20); break;
      case 'surprise': this.spawnSurprise(x, y); break;
      case 'error_sweat': this.spawnSweat(x, y); break;
    }
  }

  public spawnHeart(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      this.emit({
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
      this.emit({
        x, y,
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

  public spawnMusicNotes(x: number, y: number, count: number = 5): void {
    const noteColors = ['#A78BFA', '#F472B6', '#34D399', '#60A5FA', '#FBBF24'];
    for (let i = 0; i < count; i++) {
      this.emit({
        x: x + (Math.random() - 0.5) * 30,
        y: y - Math.random() * 10,
        vx: (Math.random() - 0.5) * 15 + Math.sin(i) * 10,
        vy: -20 - Math.random() * 20,
        size: 6 + Math.random() * 4,
        color: noteColors[i % noteColors.length],
        alpha: 1.0,
        maxLife: 1.8,
        life: 1.8,
        shape: 'note',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 2,
      });
    }
  }

  public spawnSleepZzz(x: number, y: number): void {
    this.emit({
      x: x + 10,
      y: y - 5,
      vx: 3 + Math.random() * 5,
      vy: -10 - Math.random() * 8,
      size: 8 + Math.random() * 4,
      color: '#94A3B8',
      alpha: 0.9,
      maxLife: 2.5,
      life: 2.5,
      shape: 'zzz',
      rotation: -0.1,
      rotationSpeed: 0.2,
    });
  }

  public spawnLevelUp(x: number, y: number): void {
    this.spawnSparkles(x, y, '#FBBF24', 15);
    this.spawnSparkles(x, y, '#F59E0B', 10);
    for (let i = 0; i < 5; i++) {
      this.emit({
        x, y,
        vx: (Math.random() - 0.5) * 40,
        vy: -40 - Math.random() * 30,
        size: 4 + Math.random() * 3,
        color: '#FDE68A',
        alpha: 1.0,
        maxLife: 1.5,
        life: 1.5,
        shape: 'star',
      });
    }
  }

  public spawnFireStreak(x: number, y: number, count: number = 8): void {
    const fireColors = ['#EF4444', '#F97316', '#FBBF24', '#FDE68A'];
    for (let i = 0; i < count; i++) {
      this.emit({
        x: x + (Math.random() - 0.5) * 12,
        y: y + Math.random() * 5,
        vx: (Math.random() - 0.5) * 15,
        vy: -30 - Math.random() * 25,
        size: 4 + Math.random() * 4,
        color: fireColors[Math.floor(Math.random() * fireColors.length)],
        alpha: 1.0,
        maxLife: 0.8,
        life: 0.8,
        shape: 'fire',
      });
    }
  }

  public spawnSnowfall(x: number, y: number, count: number = 6): void {
    for (let i = 0; i < count; i++) {
      this.emit({
        x: x + (Math.random() - 0.5) * 60,
        y: y - 20 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 8,
        vy: 8 + Math.random() * 12,
        size: 3 + Math.random() * 3,
        color: '#E0E7FF',
        alpha: 0.85,
        maxLife: 3.0,
        life: 3.0,
        shape: 'snowflake',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 3,
      });
    }
  }

  public spawnSakura(x: number, y: number, count: number = 5): void {
    const petalColors = ['#FBCFE8', '#F9A8D4', '#F472B6'];
    for (let i = 0; i < count; i++) {
      this.emit({
        x: x + (Math.random() - 0.5) * 50,
        y: y - 30 - Math.random() * 20,
        vx: 5 + Math.random() * 10,
        vy: 5 + Math.random() * 10,
        size: 4 + Math.random() * 3,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        alpha: 0.9,
        maxLife: 3.5,
        life: 3.5,
        shape: 'petal',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: 1 + Math.random() * 2,
      });
    }
  }

  public spawnConfetti(x: number, y: number, count: number = 20): void {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      this.emit({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        size: 3 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        maxLife: 1.5,
        life: 1.5,
        shape: 'confetti',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: 5 + Math.random() * 10,
      });
    }
  }

  public spawnSurprise(x: number, y: number): void {
    this.spawnSparkles(x, y - 10, '#FBBF24', 8);
    this.emit({
      x, y: y - 15,
      vx: 0, vy: -30,
      size: 10,
      color: '#FBBF24',
      alpha: 1.0,
      maxLife: 0.8,
      life: 0.8,
      shape: 'star',
    });
  }

  public spawnSweat(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      this.emit({
        x: x + 8 + i * 4,
        y: y - 5 - Math.random() * 5,
        vx: 2 + Math.random() * 3,
        vy: 10 + Math.random() * 15,
        size: 3 + Math.random() * 2,
        color: '#93C5FD',
        alpha: 0.8,
        maxLife: 0.7,
        life: 0.7,
        shape: 'circle',
      });
    }
  }

  public update(dt: number, width: number, height: number, now: number = performance.now()): void {
    // Ambient twinkling dust
    if (now - this.lastAmbientSpawn > 500 && this.particles.length < 15) {
      this.lastAmbientSpawn = now;
      this.emit({
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
        this.pool.push(this.particles.splice(i, 1)[0]);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.rotation !== undefined && p.rotationSpeed) {
        p.rotation += p.rotationSpeed * dt;
      }
      // Gravity for confetti and fire
      if (p.shape === 'confetti') p.vy += 60 * dt;
      if (p.shape === 'fire') p.size = Math.max(1, p.size - 3 * dt);
      // Sway for snowflakes and petals
      if (p.shape === 'snowflake' || p.shape === 'petal') {
        p.vx += Math.sin(now * 0.002 + i) * 2 * dt;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.particles.length === 0) return;

    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.rotation) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.translate(-p.x, -p.y);
      }

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
      } else if (p.shape === 'note') {
        // Musical note ♪
        const s = p.size;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(p.x + s / 3 - 1, p.y - s, 2, s);
        ctx.fillRect(p.x + s / 3 - 1, p.y - s, s / 2, 2);
      } else if (p.shape === 'zzz') {
        // Z letter
        ctx.font = `bold ${p.size}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Z', p.x, p.y);
      } else if (p.shape === 'fire') {
        // Teardrop flame
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s);
        ctx.quadraticCurveTo(p.x + s, p.y, p.x, p.y + s / 2);
        ctx.quadraticCurveTo(p.x - s, p.y, p.x, p.y - s);
        ctx.closePath();
        ctx.fill();
      } else if (p.shape === 'snowflake') {
        // 6-point snowflake
        const s = p.size;
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + Math.cos(angle) * s, p.y + Math.sin(angle) * s);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else if (p.shape === 'petal') {
        // Elliptical petal
        const s = p.size;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, s, s / 2, p.rotation || 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'confetti') {
        // Small rotated rectangle
        const s = p.size;
        ctx.fillRect(p.x - s / 2, p.y - s / 4, s, s / 2);
      }

      if (p.rotation) {
        ctx.restore();
      }
    }
    ctx.restore();
  }

  public clear(): void {
    this.pool.push(...this.particles);
    this.particles = [];
  }

  public get count(): number {
    return this.particles.length;
  }
}

export const particleSystem = new ParticleSystem();

