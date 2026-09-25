import { IGameInstance, GameStats } from '../core/gameInterface';
import { GameDifficulty, GameId } from '../../types';

/**
 * CustomGame API Template
 * Developers can implement IGameInstance to mount custom games in Lulu's game framework.
 */
export class CustomGame implements IGameInstance {
  public id: GameId = 'custom';
  public title = 'Starlight Ripple (Custom API)';
  public description = 'Example game demonstrating Lulu custom game extension API. Click to create ripple waves!';
  public difficulty: GameDifficulty = 'normal';

  private canvas: HTMLCanvasElement | null = null;
  private ripples: { x: number; y: number; r: number; alpha: number }[] = [];

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
    this.ripples = [];
    this.stats = {
      score: 0,
      highScore: this.stats.highScore,
      combo: 0,
      isGameOver: false,
      isPaused: false,
    };
  }

  public update(dt: number): void {
    if (this.stats.isGameOver || this.stats.isPaused) return;

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.r += 60 * dt;
      rip.alpha -= 0.8 * dt;
      if (rip.alpha <= 0) {
        this.ripples.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas?.width || 400;
    const h = this.canvas?.height || 300;

    ctx.fillStyle = '#172554';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#93C5FD';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Ripples: ${this.ripples.length} | Score: ${this.stats.score}`, 15, 25);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#BFDBFE';
    ctx.font = '16px sans-serif';
    ctx.fillText('Click anywhere to create custom particle ripples!', w / 2, h / 2);

    for (const rip of this.ripples) {
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(147, 197, 253, ${Math.max(0, rip.alpha)})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  public handleClick(x: number, y: number): void {
    this.ripples.push({ x, y, r: 5, alpha: 1.0 });
    this.stats.score += 20;
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
    }
    if (this.onScoreChange) this.onScoreChange(this.stats.score);
  }

  public handleKeyDown(_key: string): void {}

  public pause(): void {
    this.stats.isPaused = true;
  }

  public resume(): void {
    this.stats.isPaused = false;
  }

  public dispose(): void {
    this.ripples = [];
    this.canvas = null;
  }

  public getStats(): GameStats {
    return { ...this.stats };
  }
}
