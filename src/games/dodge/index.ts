import { IGameInstance, GameStats } from '../core/gameInterface';
import { GameDifficulty, GameId } from '../../types';

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export class DodgeGame implements IGameInstance {
  public id: GameId = 'dodge';
  public title = 'Cosmic Dodge';
  public description = 'Guide your starlight spark to dodge high-speed cosmic meteors!';
  public difficulty: GameDifficulty = 'normal';

  private canvas: HTMLCanvasElement | null = null;
  private player = { x: 200, y: 150, radius: 8 };
  private asteroids: Asteroid[] = [];
  private survivalTime: number = 0;
  private spawnTimer: number = 0;

  private stats: GameStats = {
    score: 0,
    highScore: 0,
    combo: 0,
    isGameOver: false,
    isPaused: false,
  };

  public onGameOver?: (stats: GameStats) => void;
  public onScoreChange?: (score: number) => void;

  public initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.player = { x: canvas.width / 2, y: canvas.height / 2, radius: 8 };
    this.asteroids = [];
    this.survivalTime = 0;
    this.spawnTimer = 0;
    this.stats = {
      score: 0,
      highScore: this.stats.highScore,
      combo: 0,
      isGameOver: false,
      isPaused: false,
    };
  }

  public update(dt: number): void {
    if (this.stats.isGameOver || this.stats.isPaused || !this.canvas) return;

    this.survivalTime += dt;
    this.stats.score = Math.floor(this.survivalTime * 100);
    if (this.onScoreChange) this.onScoreChange(this.stats.score);

    this.spawnTimer += dt;
    const interval = this.difficulty === 'hard' ? 0.35 : 0.6;
    if (this.spawnTimer >= interval && this.asteroids.length < 15) {
      this.spawnTimer = 0;
      this.spawnAsteroid();
    }

    // Move asteroids
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const ast = this.asteroids[i];
      ast.x += ast.vx * dt;
      ast.y += ast.vy * dt;

      // Check collision with player
      const dist = Math.hypot(ast.x - this.player.x, ast.y - this.player.y);
      if (dist < ast.radius + this.player.radius) {
        this.stats.isGameOver = true;
        if (this.stats.score > this.stats.highScore) {
          this.stats.highScore = this.stats.score;
        }
        if (this.onGameOver) this.onGameOver(this.stats);
        return;
      }

      // Remove offscreen
      if (
        ast.x < -40 ||
        ast.x > this.canvas.width + 40 ||
        ast.y < -40 ||
        ast.y > this.canvas.height + 40
      ) {
        this.asteroids.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas?.width || 400;
    const h = this.canvas?.height || 300;

    ctx.fillStyle = '#05050A';
    ctx.fillRect(0, 0, w, h);

    // Score & survival
    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Survival: ${this.survivalTime.toFixed(1)}s  |  Score: ${this.stats.score}`, 15, 25);

    // Player spark
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#38BDF8';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Asteroids
    for (const a of this.asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#E11D48';
      ctx.fill();
      ctx.strokeStyle = '#FDA4AF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  public handleClick(x: number, y: number): void {
    this.player.x = x;
    this.player.y = y;
  }

  public handleKeyDown(key: string): void {
    const step = 20;
    if (key === 'ArrowLeft' || key === 'a') this.player.x = Math.max(10, this.player.x - step);
    if (key === 'ArrowRight' || key === 'd') this.player.x = Math.min((this.canvas?.width || 400) - 10, this.player.x + step);
    if (key === 'ArrowUp' || key === 'w') this.player.y = Math.max(10, this.player.y - step);
    if (key === 'ArrowDown' || key === 's') this.player.y = Math.min((this.canvas?.height || 300) - 10, this.player.y + step);
  }

  public pause(): void {
    this.stats.isPaused = true;
  }

  public resume(): void {
    this.stats.isPaused = false;
  }

  public dispose(): void {
    this.asteroids = [];
    this.canvas = null;
  }

  public getStats(): GameStats {
    return { ...this.stats };
  }

  private spawnAsteroid(): void {
    if (!this.canvas) return;
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x = 0;
    let y = 0;

    if (side === 0) {
      x = Math.random() * this.canvas.width;
      y = -20;
    } else if (side === 1) {
      x = this.canvas.width + 20;
      y = Math.random() * this.canvas.height;
    } else if (side === 2) {
      x = Math.random() * this.canvas.width;
      y = this.canvas.height + 20;
    } else {
      x = -20;
      y = Math.random() * this.canvas.height;
    }

    // Aim towards center roughly
    const targetX = this.canvas.width / 2 + (Math.random() - 0.5) * 150;
    const targetY = this.canvas.height / 2 + (Math.random() - 0.5) * 150;
    const angle = Math.atan2(targetY - y, targetX - x);
    const speed = (this.difficulty === 'hard' ? 180 : 130) + Math.random() * 70;

    this.asteroids.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 10 + Math.random() * 12,
    });
  }
}
