import React, { useState, useEffect, useRef } from 'react';
import { GAME_CATALOG, createGameInstance } from '../../../games';
import { IGameInstance, GameStats } from '../../../games/core/gameInterface';
import { GameId } from '../../../types';
import { useLuluStore } from '../../../stores/useLuluStore';
import { soundService } from '../../../services/soundService';
import { getGameScores, saveGameRecord } from '../../../services/storageService';

export const GamesTab: React.FC = () => {
  const { activeGameId, setActiveGame, addXp, progressAchievement } = useLuluStore();
  const [gameInstance, setGameInstance] = useState<IGameInstance | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [highScores, setHighScores] = useState<Record<string, number>>({});
  const [newHighScore, setNewHighScore] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load high scores from SQLite storage
  useEffect(() => {
    getGameScores().then((scores) => {
      const scoresMap: Record<string, number> = {};
      scores.forEach(s => { scoresMap[s.game_id] = s.high_score; });
      setHighScores(scoresMap);
    });
  }, []);

  // Mount/unmount game instance
  useEffect(() => {
    if (!activeGameId) {
      if (gameInstance) {
        gameInstance.dispose();
        setGameInstance(null);
        setStats(null);
        setNewHighScore(false);
      }
      return;
    }

    const instance = createGameInstance(activeGameId);
    setGameInstance(instance);
    setNewHighScore(false);

    return () => {
      instance.dispose();
    };
  }, [activeGameId]);

  // Game loop & canvas attachment
  useEffect(() => {
    if (!gameInstance || !canvasRef.current) return;

    const canvas = canvasRef.current;
    gameInstance.initialize(canvas);

    gameInstance.onGameOver = (finalStats) => {
      soundService.play('game_over', 'game');
      addXp(Math.max(20, Math.floor(finalStats.score / 10)));
      if (finalStats.score >= 1000) {
        progressAchievement('game_master', 1);
      }
      setStats({ ...finalStats });

      // Save high score if record broken
      if (activeGameId) {
        saveGameRecord(activeGameId, finalStats.score).catch(console.error);
        
        setHighScores((prev) => {
          const prevBest = prev[activeGameId] || 0;
          if (finalStats.score > prevBest) {
            setNewHighScore(true);
            return { ...prev, [activeGameId]: finalStats.score };
          }
          return prev;
        });
      }
    };

    gameInstance.onScoreChange = (_score) => {
      setStats(gameInstance.getStats());
    };

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      gameInstance.update(dt);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        gameInstance.render(ctx);
      }
      setStats(gameInstance.getStats());

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const handleKeyDown = (e: KeyboardEvent) => {
      gameInstance.handleKeyDown(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameInstance]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameInstance || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    gameInstance.handleClick(x, y);
    soundService.play('click', 'game');
  };

  // 1. If playing a game, show Game Arena
  if (activeGameId && gameInstance) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{gameInstance.title}</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '13px' }}>
              {gameInstance.description}
            </p>
          </div>
          <button
            onClick={() => setActiveGame(null)}
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '8px',
              color: 'var(--color-text, #F8FAFC)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ← Exit Game
          </button>
        </div>

        {/* Game Canvas Container */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: '#0F172A',
            border: '2px solid var(--color-border, #334155)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <canvas
            ref={canvasRef}
            width={560}
            height={360}
            onClick={handleCanvasClick}
            style={{
              display: 'block',
              cursor: 'pointer',
              maxWidth: '100%',
            }}
          />

          {stats?.isGameOver && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '28px', color: '#F8FAFC' }}>Game Over!</h2>
              <div style={{ fontSize: '18px', color: 'var(--color-primary, #818CF8)', fontWeight: 700 }}>
                Final Score: {stats.score}
              </div>
              <button
                onClick={() => {
                  if (canvasRef.current) gameInstance.initialize(canvasRef.current);
                }}
                style={{
                  padding: '8px 20px',
                  backgroundColor: 'var(--color-primary, #818CF8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Game Controls footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
          <div>
            Score: <strong style={{ color: 'var(--color-primary, #818CF8)' }}>{stats?.score || 0}</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {newHighScore && (
              <span style={{ 
                color: '#FBBF24', 
                fontSize: '11px', 
                fontWeight: 800,
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                padding: '2px 6px',
                borderRadius: '4px',
                animation: 'pulse 1.5s infinite'
              }}>
                NEW HIGH SCORE!
              </span>
            )}
            <span>Personal Best: <strong>{stats?.highScore || highScores[activeGameId] || 0}</strong></span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Otherwise, show Game Catalog
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Lulu Mini-Game Arcade</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Play isolated, zero-dependency offline mini-games to boost companion happiness and earn XP!
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {GAME_CATALOG.map((g) => (
          <div
            key={g.id}
            onClick={() => setActiveGame(g.id)}
            style={{
              backgroundColor: 'var(--color-bg-card, #1E293B)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '16px',
              padding: '18px',
              cursor: 'pointer',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              transition: 'transform 0.15s ease, border-color 0.15s ease',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0,
              }}
            >
              {g.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{g.title}</span>
                {highScores[g.id] ? (
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#FBBF24',
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      fontWeight: 600,
                    }}
                  >
                    🏆 Best: {highScores[g.id]}
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                {g.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
