import { GameDifficulty, GameId } from '../../types';

export interface GameStats {
  score: number;
  highScore: number;
  combo: number;
  timeRemaining?: number;
  accuracy?: number;
  lives?: number;
  isGameOver: boolean;
  isPaused: boolean;
}

export interface IGameInstance {
  id: GameId;
  title: string;
  description: string;
  difficulty: GameDifficulty;
  initialize(canvas: HTMLCanvasElement): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D): void;
  pause(): void;
  resume(): void;
  dispose(): void;
  handleClick(x: number, y: number): void;
  handleKeyDown(key: string): void;
  getStats(): GameStats;
  onGameOver?: (stats: GameStats) => void;
  onScoreChange?: (score: number) => void;
}
