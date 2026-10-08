import React, { useEffect, useState } from 'react';
import { audioReactiveEngine, AudioReactiveState } from '../../features/audio/AudioReactiveEngine';

interface AudioVisualizerProps {
  variant?: 'mini' | 'bars' | 'wave';
  accentColor?: string;
  height?: number;
  className?: string;
  showBeatIndicator?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  variant = 'mini',
  accentColor = '#10b981',
  height,
  className = '',
  showBeatIndicator = false,
}) => {
  const [state, setState] = useState<AudioReactiveState>(() => audioReactiveEngine.getState());

  useEffect(() => {
    return audioReactiveEngine.subscribe((nextState) => {
      setState(nextState);
    });
  }, []);

  // MINI EQUALIZER PILL (4 or 5 compact bars for Companion Lyrics HUD)
  if (variant === 'mini') {
    const bars = state.bands8.slice(0, 5);
    const minHeightPx = 3;
    const maxHeightPx = height || 14;

    return (
      <div
        className={`flex items-end gap-[2px] px-1 py-0.5 rounded ${className}`}
        style={{ height: `${maxHeightPx + 4}px` }}
        title={state.isPlaying ? `Beat Pulse: ${(state.beatPulse * 100).toFixed(0)}%` : 'Audio Visualizer'}
      >
        {bars.map((val, idx) => {
          const barHeight = Math.max(minHeightPx, Math.round(val * maxHeightPx));
          const opacity = state.isPlaying ? Math.max(0.4, val * 0.9 + 0.1) : 0.25;

          return (
            <div
              key={idx}
              className="w-[2.5px] rounded-full transition-all duration-75"
              style={{
                height: `${barHeight}px`,
                backgroundColor: accentColor,
                opacity,
                boxShadow: state.isPlaying && val > 0.6 ? `0 0 6px ${accentColor}` : 'none',
              }}
            />
          );
        })}
      </div>
    );
  }

  // CONTINUOUS CHAKRA SOUNDWAVE (Sinusoidal pulsating SVG line)
  if (variant === 'wave') {
    const waveHeight = height || 48;
    const waveWidth = 260;
    const points: string[] = [];
    const bands = state.bands16;

    for (let i = 0; i < bands.length; i++) {
      const x = (i / (bands.length - 1)) * waveWidth;
      const amp = bands[i] * (waveHeight * 0.42);
      const y = waveHeight / 2 + (i % 2 === 0 ? -amp : amp) * (state.isPlaying ? 1 : 0.1);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    const polylineStr = points.join(' ');

    return (
      <div className={`relative flex flex-col items-center justify-center ${className}`}>
        <svg
          width={waveWidth}
          height={waveHeight}
          viewBox={`0 0 ${waveWidth} ${waveHeight}`}
          className="overflow-visible"
        >
          {/* Subtle glow filter */}
          <defs>
            <filter id="chakra-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Central Baseline */}
          <line
            x1="0"
            y1={waveHeight / 2}
            x2={waveWidth}
            y2={waveHeight / 2}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="2,2"
          />

          {/* Glowing waveform */}
          <polyline
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#chakra-glow)"
            points={polylineStr}
          />
        </svg>

        {showBeatIndicator && (
          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
            <span>Bass: {(state.bassLevel * 100).toFixed(0)}%</span>
            <span>•</span>
            <span>Energy: {(state.audioEnergy * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>
    );
  }

  // FULL 16-BAND EQUALIZER SPECTRUM (For Control Center Studio)
  const fullHeight = height || 72;
  const bands = state.bands16;

  return (
    <div className={`flex flex-col gap-1.5 p-2 rounded-xl bg-black/40 border border-white/5 ${className}`}>
      {/* Top Header / Beat Pulse indicator */}
      <div className="flex items-center justify-between text-[10px] px-1">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full transition-transform duration-75"
            style={{
              backgroundColor: accentColor,
              transform: `scale(${1 + state.beatPulse * 0.8})`,
              boxShadow: state.beatPulse > 0.4 ? `0 0 8px ${accentColor}` : 'none',
            }}
          />
          <span className="font-bold text-gray-300">
            {state.isPlaying ? 'Equalizer Spectrum • 16 Bands' : 'Equalizer Spectrum (Idle)'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-gray-400 font-mono text-[9px]">
          <span>
            BASS <b className="text-white">{(state.bassLevel * 100).toFixed(0)}%</b>
          </span>
          <span>
            MID <b className="text-white">{(state.midLevel * 100).toFixed(0)}%</b>
          </span>
          <span>
            TREBLE <b className="text-white">{(state.trebleLevel * 100).toFixed(0)}%</b>
          </span>
        </div>
      </div>

      {/* 16 Frequency Bars */}
      <div
        className="flex items-end justify-between gap-[3px] px-1 pt-1"
        style={{ height: `${fullHeight}px` }}
      >
        {bands.map((val, idx) => {
          const barHeight = Math.max(4, Math.round(val * (fullHeight - 8)));
          const isBass = idx < 4;
          const isMid = idx >= 4 && idx < 11;
          const barColor = isBass ? accentColor : isMid ? '#38bdf8' : '#a855f7';

          return (
            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative group">
              {/* Peak cap dot */}
              <div
                className="w-full h-[2px] rounded-full mb-[2px] transition-all duration-100"
                style={{
                  backgroundColor: val > 0.8 ? '#f43f5e' : barColor,
                  opacity: state.isPlaying ? 0.9 : 0.2,
                }}
              />

              {/* Main Frequency Bar */}
              <div
                className="w-full rounded-t-sm transition-all duration-75"
                style={{
                  height: `${barHeight}px`,
                  backgroundColor: barColor,
                  opacity: state.isPlaying ? Math.max(0.35, val * 0.8 + 0.2) : 0.15,
                  boxShadow: state.isPlaying && val > 0.7 ? `0 0 8px ${barColor}` : 'none',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Frequency Labels */}
      <div className="flex justify-between text-[8px] text-gray-500 font-mono px-1">
        <span>60Hz</span>
        <span>250Hz</span>
        <span>1kHz</span>
        <span>4kHz</span>
        <span>16kHz</span>
      </div>
    </div>
  );
};
