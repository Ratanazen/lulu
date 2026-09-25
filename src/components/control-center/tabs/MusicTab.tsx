import React, { useEffect, useState, useRef } from 'react';
import { useLuluStore } from '../../../stores/useLuluStore';
import { musicEngine } from '../../../features/music/MusicEngine';
import { lyricsSyncManager } from '../../../features/lyrics/LyricsSync';
import { LyricsFileInfo, ParsedLrc } from '../../../features/lyrics/types';
import { Play, Pause, SkipForward, SkipBack, Music, FileText, Sparkles, RefreshCw, Volume2 } from 'lucide-react';

export const MusicTab: React.FC = () => {
  const {
    mediaStatus,
    musicState,
    currentLyric,
    nextLyric,
    settings,
    updateSettings,
    speak,
    setAnimation,
  } = useLuluStore();

  const [lyricsList, setLyricsList] = useState<LyricsFileInfo[]>([]);
  const [selectedLrcPath, setSelectedLrcPath] = useState<string>('');
  const [activeLrc, setActiveLrc] = useState<ParsedLrc | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load available local .lrc files
  const loadAvailableLyrics = async () => {
    const list = await lyricsSyncManager.fetchLocalLyricsList();
    setLyricsList(list);
    if (list.length > 0 && !selectedLrcPath) {
      setSelectedLrcPath(list[0].path);
      const parsed = await lyricsSyncManager.loadLyricsFile(list[0].path);
      setActiveLrc(parsed);
    }
  };

  useEffect(() => {
    loadAvailableLyrics();
  }, []);

  const handleSelectLrc = async (path: string) => {
    setSelectedLrcPath(path);
    const parsed = await lyricsSyncManager.loadLyricsFile(path);
    setActiveLrc(parsed);
    if (parsed) {
      speak(`Loaded lyrics for ${parsed.title}! 🎶`);
    }
  };

  const handleControl = async (action: 'play-pause' | 'next' | 'previous') => {
    await musicEngine.control(action);
  };

  const handleSimulateDemo = async (file: LyricsFileInfo) => {
    await handleSelectLrc(file.path);
    musicEngine.simulatePlayback(file.title, file.artist, 60000);
    setAnimation('dance');
    speak(`Simulating playback for ${file.title}! 🐾💃`);
  };

  // Canvas audio visualizer animation loop
  useEffect(() => {
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isPlaying = musicState === 'MUSIC_PLAYING';
      const barCount = 24;
      const barWidth = canvas.width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        let height = 4;
        if (isPlaying) {
          // Algorithmic dynamic rhythm simulation
          const wave1 = Math.sin(tick * 0.1 + i * 0.4);
          const wave2 = Math.cos(tick * 0.05 + i * 0.8);
          const raw = (wave1 + wave2 + 2) / 4;
          height = Math.max(6, raw * (canvas.height - 12));
        }

        const x = i * (barWidth + 2);
        const y = canvas.height - height;

        // Gradient bar
        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, '#818CF8');
        grad.addColorStop(1, '#C084FC');

        ctx.fillStyle = isPlaying ? grad : '#334155';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, [3, 3, 0, 0]);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [musicState]);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct =
    mediaStatus.durationMs > 0
      ? Math.min(100, (mediaStatus.positionMs / mediaStatus.durationMs) * 100)
      : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Music size={20} color="#818CF8" />
            <span>Linux MPRIS Music & Lyrics Hub</span>
          </h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
            Native desktop media session detection, synchronized .lrc lyrics, and Lulu dance mode.
          </p>
        </div>

        <button
          onClick={() => musicEngine.refreshOnce()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--color-border, #334155)',
            borderRadius: '8px',
            color: '#E2E8F0',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} />
          <span>Refresh MPRIS</span>
        </button>
      </div>

      {/* Live MPRIS Player Card */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor:
                  mediaStatus.status === 'playing'
                    ? '#10B981'
                    : mediaStatus.status === 'paused'
                    ? '#FBBF24'
                    : '#64748B',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>
              {mediaStatus.playerName
                ? `MPRIS: ${mediaStatus.playerName.toUpperCase()}`
                : 'No Active Media Player'}
            </span>
          </div>

          <span
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              backgroundColor:
                mediaStatus.status === 'playing'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
              color:
                mediaStatus.status === 'playing'
                  ? '#10B981'
                  : mediaStatus.status === 'paused'
                  ? '#FBBF24'
                  : '#94A3B8',
            }}
          >
            {mediaStatus.status}
          </span>
        </div>

        {/* Track Metadata */}
        <div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: '#F8FAFC' }}>
            {mediaStatus.title || 'No Media Currently Detected'}
          </div>
          <div style={{ fontSize: '13px', color: '#818CF8', marginTop: '2px' }}>
            {mediaStatus.artist ? `by ${mediaStatus.artist}` : 'Play music in YouTube, Spotify, or media player'}
          </div>
          {mediaStatus.album && (
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
              Album: {mediaStatus.album}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div>
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                backgroundColor: 'var(--color-primary, #818CF8)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#94A3B8',
              marginTop: '4px',
            }}
          >
            <span>{formatTime(mediaStatus.positionMs)}</span>
            <span>{formatTime(mediaStatus.durationMs)}</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => handleControl('previous')}
            style={ctrlBtnStyle}
            title="Previous track"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={() => handleControl('play-pause')}
            style={{
              ...ctrlBtnStyle,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary, #818CF8)',
              color: '#FFFFFF',
            }}
            title="Play / Pause"
          >
            {mediaStatus.status === 'playing' ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={() => handleControl('next')}
            style={ctrlBtnStyle}
            title="Next track"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>

      {/* Audio Visualizer Canvas */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={15} color="#818CF8" />
            <span>Rhythm & Beat Visualizer</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Lulu Dance Mode</span>
            <input
              type="checkbox"
              checked={settings.musicReactionsEnabled}
              onChange={(e) => updateSettings({ musicReactionsEnabled: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
          </div>
        </div>

        <canvas
          ref={visualizerCanvasRef}
          width={560}
          height={60}
          style={{ width: '100%', height: '60px', borderRadius: '8px', display: 'block' }}
        />
      </div>

      {/* Synchronized Lyrics Hub */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
            <FileText size={16} color="#818CF8" />
            <span>Synchronized .lrc Lyrics</span>
          </div>

          <select
            value={selectedLrcPath}
            onChange={(e) => handleSelectLrc(e.target.value)}
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--color-bg, #0F172A)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '12px',
            }}
          >
            {lyricsList.map((lrc) => (
              <option key={lrc.path} value={lrc.path}>
                {lrc.title} - {lrc.artist}
              </option>
            ))}
          </select>
        </div>

        {/* Current & Next Live Lyrics Display */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#818CF8', minHeight: '22px' }}>
            {currentLyric ? `♪ ${currentLyric}` : '♪ (Instrumental / Waiting for lyrics...)'}
          </div>
          {nextLyric && (
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
              Next: {nextLyric}
            </div>
          )}
        </div>

        {/* Full Lyrics Scroll Area */}
        {activeLrc && (
          <div
            style={{
              maxHeight: '140px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '6px',
              fontSize: '12px',
            }}
          >
            {activeLrc.lines.map((l, idx) => {
              const isActive = l.text === currentLyric;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: isActive ? 'rgba(129, 140, 248, 0.15)' : 'transparent',
                    color: isActive ? '#818CF8' : '#94A3B8',
                    fontWeight: isActive ? 700 : 400,
                  }}
                >
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', opacity: 0.6 }}>
                    {formatTime(l.timeMs)}
                  </span>
                  <span>{l.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Local Demo Simulation Buttons */}
        <div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '8px' }}>
            Offline Demos (No active MPRIS player required):
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {lyricsList.map((lrc) => (
              <button
                key={lrc.path}
                onClick={() => handleSimulateDemo(lrc)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--color-border, #334155)',
                  borderRadius: '6px',
                  color: '#E2E8F0',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>▶</span>
                <span>Demo {lrc.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ctrlBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid var(--color-border, #334155)',
  color: '#E2E8F0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
