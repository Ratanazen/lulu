import { IGameInstance, GameStats } from '../core/gameInterface';
import { GameDifficulty, GameId } from '../../types';

export type CareTool = 'FEED' | 'BRUSH' | 'BALL' | 'BED';

export class CareGame implements IGameInstance {
  public id: GameId = 'care';
  public title = 'Lulu Pet Care';
  public description = 'Pamper Lulu! Feed berries, brush her soft fur, play ball, and tuck her in for cozy rests!';
  public difficulty: GameDifficulty = 'normal';

  private canvas: HTMLCanvasElement | null = null;
  public selectedTool: CareTool = 'FEED';
  private affectionHearts: { x: number; y: number; life: number; color: string }[] = [];

  private stats: GameStats = {
    score: 0,
    highScore: 0,
    combo: 0,
    isGameOver: false,
    isPaused: false,
  };

  public onGameOver?: (stats: GameStats) => void;
  public onScoreChange?: (score: number) => void;
  public onCareAction?: (tool: CareTool) => void;

  public initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.affectionHearts = [];
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

    for (let i = this.affectionHearts.length - 1; i >= 0; i--) {
      const h = this.affectionHearts[i];
      h.y -= 30 * dt;
      h.life -= dt;
      if (h.life <= 0) {
        this.affectionHearts.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas?.width || 400;
    const h = this.canvas?.height || 300;

    ctx.fillStyle = '#1E1B4B';
    ctx.fillRect(0, 0, w, h);

    // Header info
    ctx.fillStyle = '#E0E7FF';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Affection Score: ${this.stats.score}`, 15, 25);

    // Draw Lulu in center
    const cx = w / 2;
    const cy = h / 2 + 10;

    ctx.fillStyle = '#818CF8';
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4338CA';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#1E1B4B';
    ctx.beginPath();
    ctx.arc(cx - 15, cy - 6, 6, 0, Math.PI * 2);
    ctx.arc(cx + 15, cy - 6, 6, 0, Math.PI * 2);
    ctx.fill();

    // Blush
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.arc(cx - 24, cy + 8, 7, 0, Math.PI * 2);
    ctx.arc(cx + 24, cy + 8, 7, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#312E81';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy + 5, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Starlight symbol
    ctx.fillStyle = '#FDE68A';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy - 28);

    // Hearts floating
    for (const heart of this.affectionHearts) {
      ctx.fillStyle = heart.color;
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💖', heart.x, heart.y);
    }

    // Action tool selector hint at bottom
    ctx.fillStyle = '#C7D2FE';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Current Tool: [${this.selectedTool}] — Click Lulu to care!`, w / 2, h - 20);
  }

  public handleClick(x: number, y: number): void {
    if (this.stats.isPaused || !this.canvas) return;

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2 + 10;
    const dist = Math.hypot(x - cx, y - cy);

    if (dist <= 60) {
      // Lulu petted/cared
      this.stats.score += 50;
      this.stats.combo++;
      if (this.stats.score > this.stats.highScore) {
        this.stats.highScore = this.stats.score;
      }

      this.affectionHearts.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy - 20,
        life: 1.2,
        color: '#F472B6',
      });

      if (this.onScoreChange) this.onScoreChange(this.stats.score);
      if (this.onCareAction) this.onCareAction(this.selectedTool);
    }
  }

  public handleKeyDown(key: string): void {
    if (key === '1') this.selectedTool = 'FEED';
    if (key === '2') this.selectedTool = 'BRUSH';
    if (key === '3') this.selectedTool = 'BALL';
    if (key === '4') this.selectedTool = 'BED';
  }

  public pause(): void {
    this.stats.isPaused = true;
  }

  public resume(): void {
    this.stats.isPaused = false;
  }

  public dispose(): void {
    this.affectionHearts = [];
    this.canvas = null;
  }

  public getStats(): GameStats {
    return { ...this.stats };
  }
}
