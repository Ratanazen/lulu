import React, { useEffect, useRef } from 'react';
import { ParsedLrc, LrcParser } from './lrcParser';
import { Music } from 'lucide-react';

interface LyricsViewerProps {
  parsedLrc: ParsedLrc | null;
  currentTimeSecs: number;
  className?: string;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({
  parsedLrc,
  currentTimeSecs,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const activeIndex = parsedLrc
    ? LrcParser.findActiveLineIndex(parsedLrc.lines, currentTimeSecs)
    : -1;

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!parsedLrc || parsedLrc.lines.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 text-gray-400 text-xs text-center border border-white/5 rounded-xl bg-black/20 ${className}`}>
        <Music size={28} className="text-gray-500 mb-2 opacity-50" />
        <p className="font-medium text-gray-300">Lyrics Unavailable</p>
        <p className="text-[11px] text-gray-500 mt-1">
          Import a local .lrc file to synchronize with your music player.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`h-48 overflow-y-auto pr-1 space-y-2 select-none scrollbar-thin scrollbar-thumb-white/10 ${className}`}
    >
      {parsedLrc.lines.map((line, idx) => {
        const isActive = idx === activeIndex;
        const isPast = idx < activeIndex;

        return (
          <div
            key={`${line.timeSeconds}-${idx}`}
            ref={isActive ? activeLineRef : null}
            className={`transition-all duration-300 py-1 px-2 rounded-lg text-center ${
              isActive
                ? 'bg-amber-500/20 text-amber-300 font-semibold text-sm scale-102 shadow-sm'
                : isPast
                ? 'text-gray-500 text-xs opacity-50'
                : 'text-gray-300 text-xs opacity-75'
            }`}
          >
            {line.text || '♪'}
          </div>
        );
      })}
    </div>
  );
};
