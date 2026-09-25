import { GameId, GameMetadata } from '../types';
import { IGameInstance } from './core/gameInterface';
import { CatchGame } from './catch';
import { DodgeGame } from './dodge';
import { MemoryGame } from './memory';
import { QuickClickGame } from './quick-click';
import { ReactionGame } from './reaction';
import { CareGame } from './care';
import { ExplorationGame } from './exploration';
import { CustomGame } from './custom';

export const GAME_CATALOG: GameMetadata[] = [
  {
    id: 'quick_click',
    title: 'Quick Click',
    description: 'Pop star bubbles rapidly and build combo multipliers.',
    icon: '⚡',
  },
  {
    id: 'reaction',
    title: 'Speed Reaction',
    description: 'Test your reaction speed in milliseconds when the signal changes.',
    icon: '🎯',
  },
  {
    id: 'memory',
    title: 'Memory Match',
    description: 'Flip celestial cards and find matching pairs in minimal moves.',
    icon: '🧩',
  },
  {
    id: 'catch',
    title: 'Star Catcher',
    description: 'Catch falling star drops with your paddle and dodge dark cosmic bombs.',
    icon: '🌟',
  },
  {
    id: 'dodge',
    title: 'Cosmic Dodge',
    description: 'Survive in deep space while dodging meteor swarms.',
    icon: '🚀',
  },
  {
    id: 'care',
    title: 'Lulu Pet Care',
    description: 'Feed, brush, play with, and tuck Lulu into bed to fulfill her needs.',
    icon: '💖',
  },
  {
    id: 'exploration',
    title: 'Starlight Expedition',
    description: 'Explore mystery sectors on a planetary grid to uncover ancient relics.',
    icon: '🗺️',
  },
  {
    id: 'custom',
    title: 'Starlight Ripple (Custom API)',
    description: 'Community and developer extension sample mini-game.',
    icon: '✨',
  },
];

export function createGameInstance(id: GameId): IGameInstance {
  switch (id) {
    case 'quick_click':
      return new QuickClickGame();
    case 'reaction':
      return new ReactionGame();
    case 'memory':
      return new MemoryGame();
    case 'catch':
      return new CatchGame();
    case 'dodge':
      return new DodgeGame();
    case 'care':
      return new CareGame();
    case 'exploration':
      return new ExplorationGame();
    case 'custom':
    default:
      return new CustomGame();
  }
}
