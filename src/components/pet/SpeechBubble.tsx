import React, { useState, useEffect } from 'react';
import { MoodType } from '../../types/pet';
import { Sparkles, Heart, Moon, Compass, Pause, Play, Bell, Music, CloudRain } from 'lucide-react';
import { messageManager, BubbleState } from '../../services/messageManager';

interface SpeechBubbleProps {
  mood: MoodType;
  fallbackText?: string | null;
  className?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({ mood, fallbackText, className }) => {
  const [displayText, setDisplayText] = useState<string | null>(fallbackText || null);
  const [bubbleState, setBubbleState] = useState<BubbleState>('HIDDEN');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const unsub = messageManager.subscribe((text, state, paused) => {
      setDisplayText(text);
      setBubbleState(state);
      setIsPaused(paused);
    });

    return () => unsub();
  }, []);

  // If no message from messageManager but fallbackText is provided, show fallback
  const textToShow = displayText || (bubbleState !== 'HIDDEN' ? displayText : fallbackText);
  const isVisible = bubbleState !== 'HIDDEN' && Boolean(textToShow);

  if (!isVisible || !textToShow) return null;

  const isNotification = textToShow.toLowerCase().includes('telegram') ||
    textToShow.toLowerCase().includes('discord') ||
    textToShow.toLowerCase().includes('notification') ||
    textToShow.toLowerCase().includes('chrome');

  const isMusic = textToShow.includes('🎵') || textToShow.toLowerCase().includes('now playing');

  const moodIcon = isNotification ? (
    <Bell size={12} className="text-amber-400 inline shrink-0 animate-bounce" />
  ) : isMusic ? (
    <Music size={12} className="text-pink-400 inline shrink-0 animate-pulse" />
  ) : {
    happy: <Heart size={12} className="text-rose-400 fill-rose-400 inline shrink-0" />,
    tired: <Moon size={12} className="text-indigo-400 inline shrink-0" />,
    curious: <Compass size={12} className="text-amber-400 inline shrink-0" />,
    playful: <Sparkles size={12} className="text-purple-400 inline shrink-0" />,
    calm: <Sparkles size={12} className="text-blue-400 inline shrink-0" />,
    sad: <CloudRain size={12} className="text-cyan-400 inline shrink-0" />,
  }[mood] || <Sparkles size={12} className="text-blue-400 inline shrink-0" />;

  return (
    <div
      onMouseEnter={() => messageManager.pause()}
      onMouseLeave={() => messageManager.resume()}
      onClick={() => messageManager.togglePause()}
      onDoubleClick={() => messageManager.reopenLatest()}
      className={`absolute ${className || 'top-2'} left-1/2 -translate-x-1/2 z-30 transition-all duration-300 pointer-events-auto cursor-pointer max-w-[240px] ${
        bubbleState === 'FADING'
          ? 'opacity-0 scale-95 -translate-y-2'
          : 'opacity-100 scale-100 translate-y-0'
      }`}
      title="Click to Pause/Resume, Double-click to Reopen, Hover to Hold"
    >
      <div className="relative px-3 py-1.5 rounded-xl bg-[#1e1b4b]/95 border border-indigo-400/40 text-indigo-100 text-xs font-medium shadow-xl backdrop-blur-md flex items-center gap-1.5 select-none leading-relaxed">
        {moodIcon}
        <span className="flex-1 break-words">{textToShow}</span>

        {isPaused && (
          <span className="text-[10px] text-amber-300 ml-1 flex items-center gap-0.5 bg-amber-500/20 px-1 py-0.5 rounded">
            <Pause size={8} /> Paused
          </span>
        )}

        {/* Bubble arrow down pointing to character */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1e1b4b]/95 border-b border-r border-indigo-400/40 rotate-45" />
      </div>
    </div>
  );
};
