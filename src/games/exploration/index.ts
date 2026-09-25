import { IGameInstance, GameStats } from '../core/gameInterface';
import { GameDifficulty, GameId } from '../../types';

interface Tile {
  revealed: boolean;
  type: 'empty' | 'stardust' | 'crystal' | 'portal';
}

export class ExplorationGame implements IGameInstance {
  public id: GameId = 'exploration';
  public title = 'Starlight Expedition';
  public description = 'Navigate Lulu across an unexplored planetary grid to uncover cosmic artifacts!';
  public difficulty: GameDifficulty = 'normal';

  private canvas: HTMLCanvasElement | null = null;
  private grid: Tile[][] = [];
  private readonly rows = 5;
  private readonly cols = 7;
  private playerPos = { r: 2, c: 0 };
  private relicsFound = 0;
  private totalRelics = 5;

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
    this.playerPos = { r: 2, c: 0 };
    this.relicsFound = 0;
    this.setupGrid();
    this.stats = {
      score: 0,
      highScore: this.stats.highScore,
      combo: 0,
      isGameOver: false,
      isPaused: false,
    };
  }

  private setupGrid(): void {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push({ revealed: false, type: 'empty' });
      }
      this.grid.push(row);
    }

    // Place stardust & crystals
    let placed = 0;
    while (placed < this.totalRelics) {
      const rr = Math.floor(Math.random() * this.rows);
      const cc = Math.floor(Math.random() * this.cols);
      if (!(rr === this.playerPos.r && cc === this.playerPos.c) && this.grid[rr][cc].type === 'empty') {
        this.grid[rr][cc].type = placed % 2 === 0 ? 'stardust' : 'crystal';
        placed++;
      }
    }

    // Reveal starting tile
    this.grid[this.playerPos.r][this.playerPos.c].revealed = true;
  }

  public update(_dt: number): void {}

  public render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas?.width || 400;
    const h = this.canvas?.height || 300;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    // Header
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Relics: ${this.relicsFound} / ${this.totalRelics}  |  Score: ${this.stats.score}`, 15, 25);

    const tileSize = 44;
    const gap = 6;
    const startX = (w - (this.cols * tileSize + (this.cols - 1) * gap)) / 2;
    const startY = (h - (this.rows * tileSize + (this.rows - 1) * gap)) / 2 + 10;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = startX + c * (tileSize + gap);
        const y = startY + r * (tileSize + gap);
        const tile = this.grid[r][c];
        const isPlayer = this.playerPos.r === r && this.playerPos.c === c;

        if (tile.revealed) {
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(x, y, tileSize, tileSize);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, tileSize, tileSize);

          if (tile.type === 'stardust') {
            ctx.fillStyle = '#FDE68A';
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✨', x + tileSize / 2, y + tileSize / 2 + 6);
          } else if (tile.type === 'crystal') {
            ctx.fillStyle = '#A855F7';
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔮', x + tileSize / 2, y + tileSize / 2 + 6);
          }
        } else {
          // Fog of war
          ctx.fillStyle = '#334155';
          ctx.fillRect(x, y, tileSize, tileSize);
        }

        // Draw Player
        if (isPlayer) {
          ctx.fillStyle = '#818CF8';
          ctx.beginPath();
          ctx.arc(x + tileSize / 2, y + tileSize / 2, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🐾', x + tileSize / 2, y + tileSize / 2 + 4);
        }
      }
    }
  }

  public handleClick(x: number, y: number): void {
    if (this.stats.isGameOver || this.stats.isPaused || !this.canvas) return;

    const tileSize = 44;
    const gap = 6;
    const startX = (this.canvas.width - (this.cols * tileSize + (this.cols - 1) * gap)) / 2;
    const startY = (this.canvas.height - (this.rows * tileSize + (this.rows - 1) * gap)) / 2 + 10;

    const col = Math.floor((x - startX) / (tileSize + gap));
    const row = Math.floor((y - startY) / (tileSize + gap));

    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      // Must be adjacent to player
      const dRow = Math.abs(row - this.playerPos.r);
      const dCol = Math.abs(col - this.playerPos.c);
      if (dRow + dCol === 1) {
        this.playerPos = { r: row, c: col };
        const tile = this.grid[row][col];
        if (!tile.revealed) {
          tile.revealed = true;
          if (tile.type === 'stardust' || tile.type === 'crystal') {
            this.relicsFound++;
            this.stats.score += 250;
            if (this.onScoreChange) this.onScoreChange(this.stats.score);
            if (this.relicsFound === this.totalRelics) {
              this.stats.isGameOver = true;
              if (this.stats.score > this.stats.highScore) this.stats.highScore = this.stats.score;
              if (this.onGameOver) this.onGameOver(this.stats);
            }
          } else {
            this.stats.score += 25;
            if (this.onScoreChange) this.onScoreChange(this.stats.score);
          }
        }
      }
    }
  }

  public handleKeyDown(key: string): void {
    let nr = this.playerPos.r;
    let nc = this.playerPos.c;
    if (key === 'ArrowUp' || key === 'w') nr--;
    if (key === 'ArrowDown' || key === 's') nr++;
    if (key === 'ArrowLeft' || key === 'a') nc--;
    if (key === 'ArrowRight' || key === 'd') nc++;

    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
      this.playerPos = { r: nr, c: nc };
      const tile = this.grid[nr][nc];
      if (!tile.revealed) {
        tile.revealed = true;
        if (tile.type !== 'empty') {
          this.relicsFound++;
          this.stats.score += 250;
          if (this.onScoreChange) this.onScoreChange(this.stats.score);
          if (this.relicsFound === this.totalRelics) {
            this.stats.isGameOver = true;
            if (this.stats.score > this.stats.highScore) this.stats.highScore = this.stats.score;
            if (this.onGameOver) this.onGameOver(this.stats);
          }
        }
      }
    }
  }

  public pause(): void {
    this.stats.isPaused = true;
  }

  public resume(): void {
    this.stats.isPaused = false;
  }

  public dispose(): void {
    this.grid = [];
    this.canvas = null;
  }

  public getStats(): GameStats {
    return { ...this.stats };
  }
}
