import React, { useState, useEffect, useRef } from 'react';
import { SpeechMessage, SpeechBubbleState } from '../../types';
import { useLuluStore } from '../../stores/useLuluStore';
import { splitGraphemes } from '../../utils/readingTime';

interface SpeechBubbleProps {
  message: SpeechMessage | null;
  onDismiss: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  onDismiss,
  onMouseEnter,
  onMouseLeave,
}) => {
  const { speechSystem } = useLuluStore();
  const [bubbleState, setBubbleState] = useState<SpeechBubbleState>(speechSystem.getState());
  const [activeMessage, setActiveMessage] = useState<SpeechMessage | null>(message);

  // Typewriter state
  const [displayedGraphemeCount, setDisplayedGraphemeCount] = useState<number>(0);
  const typewriterTimerRef = useRef<any>(null);

  // Synchronize with speechSystem lifecycle state
  useEffect(() => {
    const unsub = speechSystem.subscribe((state, msg) => {
      setBubbleState(state);
      setActiveMessage(msg);
    });
    return () => unsub();
  }, [speechSystem]);

  // Keep activeMessage synced if prop changes
  useEffect(() => {
    if (message && message.id !== activeMessage?.id) {
      setActiveMessage(message);
    }
  }, [message, activeMessage]);

  // Determine current page text
  const currentPageIdx = activeMessage?.currentPage ?? 0;
  const totalPages = activeMessage?.pages?.length ?? 1;
  const currentText =
    activeMessage?.pages && activeMessage.pages.length > 0
      ? activeMessage.pages[currentPageIdx]
      : activeMessage?.text ?? '';

  const graphemes = React.useMemo(() => splitGraphemes(currentText), [currentText]);

  // Typewriter animation loop
  useEffect(() => {
    if (!activeMessage || graphemes.length === 0) {
      setDisplayedGraphemeCount(0);
      return;
    }

    // Reset typewriter for new text / page
    setDisplayedGraphemeCount(0);
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }

    let currentIdx = 0;
    // 35ms per grapheme cluster (smooth, legible, safe for Khmer & Emoji)
    const intervalMs = 35;

    typewriterTimerRef.current = setInterval(() => {
      currentIdx++;
      if (currentIdx >= graphemes.length) {
        setDisplayedGraphemeCount(graphemes.length);
        if (typewriterTimerRef.current) {
          clearInterval(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }
        // Notify speech system that typing is 100% finished so the read countdown starts
        speechSystem.onTypewriterFinished();
      } else {
        setDisplayedGraphemeCount(currentIdx);
      }
    }, intervalMs);

    return () => {
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
    };
  }, [currentText, graphemes, activeMessage?.id, currentPageIdx, speechSystem]);

  // Click handler: Skip typewriter if still typing, or toggle pause if reading
  const handleBubbleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If still typing, immediately complete typewriter
    if (displayedGraphemeCount < graphemes.length) {
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      setDisplayedGraphemeCount(graphemes.length);
      speechSystem.onTypewriterFinished();
      return;
    }

    // Otherwise toggle pause/resume
    speechSystem.togglePause();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    speechSystem.dismiss();
    onDismiss();
  };

  const handleNextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    speechSystem.nextPage();
  };

  const handleMouseEnter = () => {
    speechSystem.pause();
    onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    speechSystem.resume();
    onMouseLeave?.();
  };

  const isVisible =
    activeMessage !== null &&
    bubbleState !== 'HIDDEN' &&
    graphemes.length > 0;

  const isFadingOut = bubbleState === 'FADING';
  const isPaused = bubbleState === 'PAUSED';

  if (!isVisible) return null;

  const renderedText = graphemes.slice(0, displayedGraphemeCount).join('');
  const isTyping = displayedGraphemeCount < graphemes.length;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleBubbleClick}
      style={{
        position: 'absolute',
        bottom: 'calc(100% - 24px)',
        left: 0,
        right: 0,
        margin: '0 auto',
        backgroundColor: 'var(--color-bg-card, #18181B)',
        color: 'var(--color-text, #F8FAFC)',
        border: '2px solid var(--lulu-primary, var(--color-primary, #E11D48))',
        borderRadius: '14px',
        padding: '8px 12px',
        width: 'fit-content',
        maxWidth: '242px',
        minWidth: '95px',
        minHeight: '44px',
        maxHeight: '135px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.55), 0 0 14px rgba(225, 29, 72, 0.25)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 100,
        pointerEvents: 'auto',
        userSelect: 'none',
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? 'scale(0.92) translateY(6px)' : 'scale(1) translateY(0)',
        transition: 'opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1), transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: !isFadingOut ? 'bubblePop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        cursor: 'pointer',
      }}
      title={isTyping ? 'Click to show all text' : isPaused ? 'Paused (click to resume)' : 'Click to pause'}
    >
      {/* Top Header / Meta Controls */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', width: '100%' }}>
        {/* Status / Page Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isPaused && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '9.5px',
                fontWeight: 600,
                color: '#FBBF24',
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                padding: '1px 5px',
                borderRadius: '4px',
                lineHeight: 1.2,
              }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              PAUSED
            </span>
          )}

          {totalPages > 1 && (
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 500,
                color: '#94A3B8',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '1px 5px',
                borderRadius: '4px',
                lineHeight: 1.2,
              }}
            >
              {currentPageIdx + 1}/{totalPages}
            </span>
          )}
        </div>

        {/* Action Controls: Next Page & Close Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          {totalPages > 1 && currentPageIdx + 1 < totalPages && (
            <button
              onClick={handleNextPage}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#F8FAFC',
                cursor: 'pointer',
                borderRadius: '4px',
                padding: '1px 5px',
                fontSize: '10px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                transition: 'background 0.15s ease',
              }}
              title="Next Page"
            >
              <span>Next</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}

          {activeMessage.dismissible && (
            <button
              onClick={handleDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted, #94A3B8)',
                cursor: 'pointer',
                padding: '2px',
                fontSize: '13px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#F8FAFC';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-muted, #94A3B8)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Dismiss"
              title="Dismiss message"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main Message Content */}
      <div
        className="speech-bubble-scroll"
        style={{
          marginTop: '4px',
          maxHeight: '105px',
          overflowY: 'auto',
          fontSize: '12px',
          lineHeight: '1.45',
          wordBreak: 'normal',
          wordWrap: 'break-word',
          overflowWrap: 'anywhere',
          whiteSpace: 'normal',
          textAlign: 'center',
          color: 'var(--color-text, #F8FAFC)',
        }}
      >
        {renderedText}
        {isTyping && (
          <span
            style={{
              display: 'inline-block',
              width: '4px',
              height: '11px',
              marginLeft: '2px',
              backgroundColor: 'var(--lulu-primary, var(--color-primary, #E11D48))',
              verticalAlign: 'middle',
              animation: 'blink 0.7s infinite',
            }}
          />
        )}
      </div>

      {/* Bottom Pointer / Triangle */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: '7px solid var(--lulu-primary, var(--color-primary, #E11D48))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-2px)',
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '5px solid var(--color-bg-card, #18181B)',
        }}
      />
    </div>
  );
};
