import React from 'react';
import { SpeechMessage } from '../../types';

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
  const [isExiting, setIsExiting] = React.useState(false);
  const [displayedMessage, setDisplayedMessage] = React.useState<SpeechMessage | null>(message);

  React.useEffect(() => {
    if (message) {
      setDisplayedMessage(message);
      setIsExiting(false);
    } else if (displayedMessage && !isExiting) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setDisplayedMessage(null);
        setIsExiting(false);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
      setIsExiting(false);
    }, 200);
  };

  if (!displayedMessage) return null;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        bottom: 'calc(100% - 22px)',
        left: 0,
        right: 0,
        margin: '0 auto',
        backgroundColor: 'var(--color-bg-card, #1E293B)',
        color: 'var(--color-text, #F8FAFC)',
        border: '2px solid var(--color-primary, #818CF8)',
        borderRadius: '14px',
        padding: '8px 12px',
        width: 'fit-content',
        maxWidth: '236px',
        minWidth: '80px',
        maxHeight: '120px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        zIndex: 100,
        pointerEvents: 'auto',
        userSelect: 'none',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(0.88) translateY(6px)' : 'scale(1) translateY(0)',
        transition: 'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: !isExiting ? 'bubblePop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
        <div
          className="speech-bubble-scroll"
          style={{
            flex: 1,
            maxHeight: '100px',
            overflowY: 'auto',
            fontSize: '12.5px',
            lineHeight: '1.4',
            wordBreak: 'normal',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            textAlign: 'center',
            paddingRight: displayedMessage.dismissible ? '2px' : '0',
          }}
        >
          {displayedMessage.text}
        </div>
        {displayedMessage.dismissible && (
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted, #94A3B8)',
              cursor: 'pointer',
              padding: '0 2px',
              fontSize: '13px',
              lineHeight: 1,
              flexShrink: 0,
              alignSelf: 'flex-start',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted, #94A3B8)')}
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>

      {/* Triangle pointer */}
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
          borderTop: '7px solid var(--color-primary, #818CF8)',
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
          borderTop: '5px solid var(--color-bg-card, #1E293B)',
        }}
      />
    </div>
  );
};
