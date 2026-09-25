import { IGameInstance, GameStats } from '../core/gameInterface';
import { GameDifficulty, GameId } from '../../types';

interface Target {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export class QuickClickGame implements IGameInstance {
  public id: GameId = 'quick_click';
  public title = 'Quick Click';
  public description = 'Click the popping star bubbles as fast as you can before they disappear!';
  public difficulty: GameDifficulty = 'normal';

  private canvas: HTMLCanvasElement | null = null;
  private stats: GameStats = {
    score: 0,
    highScore: 0,
    combo: 0,
    timeRemaining: 30,
    accuracy: 100,
    isGameOver: false,
    isPaused: false,
  };

  private targets: Target[] = [];
  private totalClicks: number = 0;
  private hits: number = 0;
  private spawnTimer: number = 0;

  public onGameOver?: (stats: GameStats) => void;
  public onScoreChange?: (score: number) => void;

  public initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.stats = {
      score: 0,
      highScore: this.stats.highScore,
      combo: 0,
      timeRemaining: 30,
      accuracy: 100,
      isGameOver: false,
      isPaused: false,
    };
    this.targets = [];
    this.totalClicks = 0;
    this.hits = 0;
    this.spawnTimer = 0;
  }

  public update(dt: number): void {
    if (this.stats.isGameOver || this.stats.isPaused) return;

    this.stats.timeRemaining = Math.max(0, (this.stats.timeRemaining || 0) - dt);
    if (this.stats.timeRemaining <= 0) {
      this.stats.isGameOver = true;
      if (this.stats.score > this.stats.highScore) {
        this.stats.highScore = this.stats.score;
      }
      if (this.onGameOver) this.onGameOver(this.stats);
      return;
    }

    // Spawn targets
    this.spawnTimer += dt;
    const spawnRate = this.difficulty === 'hard' ? 0.45 : this.difficulty === 'normal' ? 0.7 : 1.0;
    if (this.spawnTimer >= spawnRate && this.targets.length < 5) {
      this.spawnTimer = 0;
      this.spawnTarget();
    }

    // Update targets lifetime
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.targets.splice(i, 1);
        this.stats.combo = 0; // combo break
      } else {
        t.radius = t.maxRadius * (t.life / t.maxLife);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas?.width || 400;
    const h = this.canvas?.height || 300;

    ctx.clearRect(0, 0, w, h);

    // Draw Targets
    for (const t of this.targets) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, Math.max(2, t.radius), 0, Math.PI * 2);
      ctx.fillStyle = t.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Inner star dot
      ctx.beginPath();
      ctx.arc(t.x, t.y, Math.max(1, t.radius * 0.3), 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    }
  }

  public handleClick(x: number, y: number): void {
    if (this.stats.isGameOver || this.stats.isPaused) return;

    this.totalClicks++;
    let hitIndex = -1;

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const dist = Math.hypot(x - t.x, y - t.y);
      if (dist <= t.radius + 6) {
        hitIndex = i;
        break;
      }
    }

    if (hitIndex >= 0) {
      this.hits++;
      this.stats.combo++;
      const basePoints = 100;
      const bonus = (this.stats.combo - 1) * 25;
      this.stats.score += basePoints + bonus;
      this.targets.splice(hitIndex, 1);
      if (this.onScoreChange) this.onScoreChange(this.stats.score);
    } else {
      this.stats.combo = 0;
    }

    this.stats.accuracy = Math.round((this.hits / Math.max(1, this.totalClicks)) * 100);
  }

  public handleKeyDown(_key: string): void {}

  public pause(): void {
    this.stats.isPaused = true;
  }

  public resume(): void {
    this.stats.isPaused = false;
  }

  public dispose(): void {
    this.targets = [];
    this.canvas = null;
  }

  public getStats(): GameStats {
    return { ...this.stats };
  }

  private spawnTarget(): void {
    if (!this.canvas) return;
    const padding = 40;
    const x = padding + Math.random() * (this.canvas.width - padding * 2);
    const y = padding + Math.random() * (this.canvas.height - padding * 2);
    const colors = ['#818CF8', '#F472B6', '#34D399', '#FBBF24', '#60A5FA'];

    this.targets.push({
      x,
      y,
      radius: 28,
      maxRadius: 28,
      life: 2.2,
      maxLife: 2.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}
