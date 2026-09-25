import { IGameInstance, GameStats } from '../core/gameInterface';
import { GameDifficulty, GameId } from '../../types';

export class ReactionGame implements IGameInstance {
  public id: GameId = 'reaction';
  public title = 'Speed Reaction';
  public description = 'Wait for the signal to turn starlight green, then click as fast as humanly possible!';
  public difficulty: GameDifficulty = 'normal';

  private canvas: HTMLCanvasElement | null = null;
  private phase: 'WAIT' | 'READY' | 'CLICKED' | 'EARLY' = 'WAIT';
  private timer: number = 0;
  private delay: number = 0;
  private startTime: number = 0;
  private reactionMs: number = 0;
  private trials: number[] = [];

  private stats: GameStats = {
    score: 0,
    highScore: 9999, // lower is better for reaction ms
    combo: 0,
    isGameOver: false,
    isPaused: false,
  };

  public onGameOver?: (stats: GameStats) => void;
  public onScoreChange?: (score: number) => void;

  public initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.trials = [];
    this.resetRound();
    this.stats = {
      score: 0,
      highScore: this.stats.highScore === 9999 ? 0 : this.stats.highScore,
      combo: 0,
      isGameOver: false,
      isPaused: false,
    };
  }

  private resetRound(): void {
    this.phase = 'WAIT';
    this.timer = 0;
    this.delay = 1.5 + Math.random() * 3.0; // 1.5s - 4.5s
  }

  public update(dt: number): void {
    if (this.stats.isGameOver || this.stats.isPaused) return;

    if (this.phase === 'WAIT') {
      this.timer += dt;
      if (this.timer >= this.delay) {
        this.phase = 'READY';
        this.startTime = performance.now();
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas?.width || 400;
    const h = this.canvas?.height || 300;

    let bgColor = '#1E293B';
    let text = 'Click anywhere to begin...';
    let subtext = '';

    if (this.phase === 'WAIT') {
      bgColor = '#EF4444'; // Red: wait
      text = 'Wait for GREEN...';
      subtext = 'Do not click yet!';
    } else if (this.phase === 'READY') {
      bgColor = '#10B981'; // Green: click!
      text = 'CLICK NOW!';
      subtext = 'Fast!';
    } else if (this.phase === 'CLICKED') {
      bgColor = '#6366F1';
      text = `${this.reactionMs} ms`;
      subtext = this.reactionMs < 200 ? 'Incredible speed! ⚡' : this.reactionMs < 300 ? 'Great reflexes! ✨' : 'Nice try! Click to go again';
    } else if (this.phase === 'EARLY') {
      bgColor = '#F59E0B';
      text = 'Too early!';
      subtext = 'Wait for green. Click to retry';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, h / 2 - 10);

    if (subtext) {
      ctx.font = '16px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(subtext, w / 2, h / 2 + 25);
    }
  }

  public handleClick(_x: number, _y: number): void {
    if (this.stats.isGameOver || this.stats.isPaused) return;

    if (this.phase === 'WAIT') {
      this.phase = 'EARLY';
    } else if (this.phase === 'READY') {
      this.reactionMs = Math.round(performance.now() - this.startTime);
      this.phase = 'CLICKED';
      this.trials.push(this.reactionMs);

      // Score is points inversely proportional to ms (e.g. 1000 - ms)
      const points = Math.max(10, 1000 - this.reactionMs);
      this.stats.score += points;
      if (this.reactionMs < (this.stats.highScore || 9999) || this.stats.highScore === 0) {
        this.stats.highScore = this.reactionMs;
      }
      if (this.onScoreChange) this.onScoreChange(this.stats.score);
    } else if (this.phase === 'CLICKED' || this.phase === 'EARLY') {
      this.resetRound();
    }
  }

  public handleKeyDown(_key: string): void {
    this.handleClick(0, 0);
  }

  public pause(): void {
    this.stats.isPaused = true;
  }

  public resume(): void {
    this.stats.isPaused = false;
  }

  public dispose(): void {
    this.canvas = null;
  }

  public getStats(): GameStats {
    return { ...this.stats };
  }
}
