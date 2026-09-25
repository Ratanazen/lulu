# Mini-Games Platform

## 1. Game Isolation Architecture

Every mini-game implements the `IGameInstance` contract:
```typescript
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
}
```

Games run within their own isolated animation loops. A crash or error in a game will never crash the companion window or corrupt SQLite state.

## 2. Included Games

1. **Quick Click**: Spawns shrinking star bubbles. Score increases with accuracy and combo streaks.
2. **Speed Reaction**: Millisecond reaction test turning from wait (red) to signal (green). Tracks best and average reaction times.
3. **Memory Match**: Card matching grid with varying difficulty levels (easy: 4 pairs, normal: 6 pairs, hard: 8 pairs).
4. **Star Catcher**: Move your paddle to catch falling stars while avoiding dark cosmic bombs.
5. **Cosmic Dodge**: Navigate your starlight spark to avoid incoming asteroid storms.
6. **Lulu Pet Care**: Interactive simulation with 4 care tools (Feed, Brush, Play, Bed) which directly fulfill Lulu's local needs.
7. **Starlight Expedition**: Tile grid expedition uncovering hidden artifacts in fog of war.
8. **Custom Game API**: Documented sample template for plugin and third-party games.
