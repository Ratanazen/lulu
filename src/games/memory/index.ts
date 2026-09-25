import { IGameInstance, GameStats } from '../core/gameInterface';
import { GameDifficulty, GameId } from '../../types';

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

export class MemoryGame implements IGameInstance {
  public id: GameId = 'memory';
  public title = 'Memory Match';
  public description = 'Match pairs of celestial symbols with as few moves as possible!';
  public difficulty: GameDifficulty = 'normal';

  private canvas: HTMLCanvasElement | null = null;
  private cards: Card[] = [];
  private flippedCards: Card[] = [];
  private moves: number = 0;
  private matches: number = 0;
  private totalPairs: number = 6;
  private lockBoard: boolean = false;
  private elapsedSeconds: number = 0;

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
    this.setupCards();
    this.stats = {
      score: 0,
      highScore: this.stats.highScore,
      combo: 0,
      isGameOver: false,
      isPaused: false,
    };
    this.moves = 0;
    this.matches = 0;
    this.lockBoard = false;
    this.elapsedSeconds = 0;
  }

  private setupCards(): void {
    if (!this.canvas) return;
    const allSymbols = ['⭐', '🌙', '🪐', '☀️', '🚀', '🔮', '✨', '⚡'];
    this.totalPairs = this.difficulty === 'easy' ? 4 : this.difficulty === 'hard' ? 8 : 6;
    const symbols = allSymbols.slice(0, this.totalPairs);
    const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5);

    const cols = this.difficulty === 'hard' ? 4 : this.difficulty === 'easy' ? 4 : 4;
    const rows = Math.ceil(deck.length / cols);
    const cardW = 60;
    const cardH = 75;
    const gap = 12;

    const startX = (this.canvas.width - (cols * cardW + (cols - 1) * gap)) / 2;
    const startY = (this.canvas.height - (rows * cardH + (rows - 1) * gap)) / 2 + 15;

    this.cards = deck.map((symbol, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        id: i,
        symbol,
        isFlipped: false,
        isMatched: false,
        x: startX + col * (cardW + gap),
        y: startY + row * (cardH + gap),
        w: cardW,
        h: cardH,
      };
    });
  }

  public update(dt: number): void {
    if (this.stats.isGameOver || this.stats.isPaused) return;
    this.elapsedSeconds += dt;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const w = this.canvas?.width || 400;
    const h = this.canvas?.height || 300;

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    // Header stats
    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Moves: ${this.moves}`, 20, 25);
    ctx.textAlign = 'right';
    ctx.fillText(`Matches: ${this.matches} / ${this.totalPairs}`, w - 20, 25);

    // Render cards
    for (const c of this.cards) {
      if (c.isFlipped || c.isMatched) {
        // Face up
        ctx.fillStyle = c.isMatched ? '#059669' : '#3B82F6';
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.w, c.h, 8);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.symbol, c.x + c.w / 2, c.y + c.h / 2);
      } else {
        // Face down
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.w, c.h, 8);
        ctx.fill();
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#818CF8';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✦', c.x + c.w / 2, c.y + c.h / 2);
      }
    }
  }

  public handleClick(x: number, y: number): void {
    if (this.lockBoard || this.stats.isGameOver || this.stats.isPaused) return;

    for (const card of this.cards) {
      if (
        !card.isFlipped &&
        !card.isMatched &&
        x >= card.x &&
        x <= card.x + card.w &&
        y >= card.y &&
        y <= card.y + card.h
      ) {
        card.isFlipped = true;
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
          this.moves++;
          this.checkMatch();
        }
        break;
      }
    }
  }

  private checkMatch(): void {
    const [c1, c2] = this.flippedCards;
    if (c1.symbol === c2.symbol) {
      c1.isMatched = true;
      c2.isMatched = true;
      this.matches++;
      this.stats.score += 200;
      this.flippedCards = [];

      if (this.onScoreChange) this.onScoreChange(this.stats.score);

      if (this.matches === this.totalPairs) {
        this.stats.isGameOver = true;
        // Bonus for fewer moves
        const efficiencyBonus = Math.max(0, (this.totalPairs * 3 - this.moves) * 50);
        this.stats.score += efficiencyBonus;
        if (this.stats.score > this.stats.highScore) {
          this.stats.highScore = this.stats.score;
        }
        if (this.onGameOver) this.onGameOver(this.stats);
      }
    } else {
      this.lockBoard = true;
      setTimeout(() => {
        c1.isFlipped = false;
        c2.isFlipped = false;
        this.flippedCards = [];
        this.lockBoard = false;
      }, 700);
    }
  }

  public handleKeyDown(_key: string): void {}

  public pause(): void {
    this.stats.isPaused = true;
  }

  public resume(): void {
    this.stats.isPaused = false;
  }

  public dispose(): void {
    this.cards = [];
    this.canvas = null;
  }

  public getStats(): GameStats {
    return { ...this.stats };
  }
}
