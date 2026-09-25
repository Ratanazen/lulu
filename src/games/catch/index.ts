import { IGameInstance, GameStats } from '../core/gameInterface';
import { GameDifficulty, GameId } from '../../types';

interface FallingItem {
  x: number;
  y: number;
  speed: number;
  radius: number;
  isBomb: boolean;
  color: string;
}

export class CatchGame implements IGameInstance {
  public id: GameId = 'catch';
  public title = 'Star Catcher';
  public description = 'Catch glowing falling starlight drops! Avoid dark cosmic orbs!';
  public difficulty: GameDifficulty = 'normal';

  private canvas: HTMLCanvasElement | null = null;
  private paddleX: number = 180;
  private paddleWidth: number = 70;
  private paddleHeight: number = 14;
  private items: FallingItem[] = [];
  private spawnTimer: number = 0;

  private stats: GameStats = {
    score: 0,
    highScore: 0,
    combo: 0,
    lives: 3,
    isGameOver: false,
    isPaused: false,
  };

  public onGameOver?: (stats: GameStats) => void;
  public onScoreChange?: (score: number) => void;

  public initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.paddleX = canvas.width / 2 - this.paddleWidth / 2;
    this.items = [];
    this.spawnTimer = 0;
    this.stats = {
      score: 0,
      highScore: this.stats.highScore,
      combo: 0,
      lives: 3,
      isGameOver: false,
      isPaused: false,
    };
  }

  public update(dt: number): void {
    if (this.stats.isGameOver || this.stats.isPaused || !this.canvas) return;

    this.spawnTimer += dt;
    const interval = this.difficulty === 'hard' ? 0.4 : this.difficulty === 'normal' ? 0.6 : 0.9;
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      this.spawnItem();
    }

    const paddleY = this.canvas.height - 24;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.y += item.speed * dt;

      // Check collision with paddle
      if (
        item.y + item.radius >= paddleY &&
        item.y - item.radius <= paddleY + this.paddleHeight &&
        item.x >= this.paddleX &&
        item.x <= this.paddleX + this.paddleWidth
      ) {
        if (item.isBomb) {
          this.stats.lives = Math.max(0, (this.stats.lives || 1) - 1);
          this.stats.combo = 0;
          if (this.stats.lives === 0) {
            this.stats.isGameOver = true;
            if (this.stats.score > this.stats.highScore) this.stats.highScore = this.stats.score;
            if (this.onGameOver) this.onGameOver(this.stats);
          }
        } else {
          this.stats.combo++;
          this.stats.score += 50 + this.stats.combo * 10;
          if (this.onScoreChange) this.onScoreChange(this.stats.score);
        }
        this.items.splice(i, 1);
        continue;
      }

      // Check floor collision
      if (item.y > this.canvas.height + 10) {
        if (!item.isBomb) {
          this.stats.combo = 0; // missed star breaks combo
        }
        this.items.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas?.width || 400;
    const h = this.canvas?.height || 300;

    ctx.fillStyle = '#0B1120';
    ctx.fillRect(0, 0, w, h);

    // Header info
    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.stats.score}  (Combo: x${this.stats.combo})`, 15, 25);
    ctx.textAlign = 'right';
    const hearts = '❤️'.repeat(this.stats.lives || 0);
    ctx.fillText(hearts, w - 15, 25);

    // Paddle
    const paddleY = h - 24;
    ctx.fillStyle = '#6366F1';
    ctx.beginPath();
    ctx.roundRect(this.paddleX, paddleY, this.paddleWidth, this.paddleHeight, 7);
    ctx.fill();
    ctx.strokeStyle = '#A5B4FC';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Falling items
    for (const item of this.items) {
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.fill();

      if (item.isBomb) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✕', item.x, item.y);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', item.x, item.y);
      }
    }
  }

  public handleClick(x: number, _y: number): void {
    this.paddleX = Math.max(0, Math.min((this.canvas?.width || 400) - this.paddleWidth, x - this.paddleWidth / 2));
  }

  public handleKeyDown(key: string): void {
    const step = 28;
    if (key === 'ArrowLeft' || key === 'a') {
      this.paddleX = Math.max(0, this.paddleX - step);
    } else if (key === 'ArrowRight' || key === 'd') {
      this.paddleX = Math.min((this.canvas?.width || 400) - this.paddleWidth, this.paddleX + step);
    }
  }

  public pause(): void {
    this.stats.isPaused = true;
  }

  public resume(): void {
    this.stats.isPaused = false;
  }

  public dispose(): void {
    this.items = [];
    this.canvas = null;
  }

  public getStats(): GameStats {
    return { ...this.stats };
  }

  private spawnItem(): void {
    if (!this.canvas) return;
    const isBomb = Math.random() < (this.difficulty === 'hard' ? 0.35 : 0.2);
    const speed = (this.difficulty === 'hard' ? 220 : 160) + Math.random() * 60;
    this.items.push({
      x: 20 + Math.random() * (this.canvas.width - 40),
      y: -10,
      speed,
      radius: isBomb ? 12 : 10,
      isBomb,
      color: isBomb ? '#DC2626' : '#FBBF24',
    });
  }
}
