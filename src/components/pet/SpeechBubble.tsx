import React from 'react';
import { SpeechMessage } from '../../types';

interface SpeechBubbleProps {
  message: SpeechMessage | null;
  onDismiss: () => void;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%) translateY(-10px)',
        backgroundColor: 'var(--color-bg-card, #1E293B)',
        color: 'var(--color-text, #F8FAFC)',
        border: '2px solid var(--color-primary, #818CF8)',
        borderRadius: '14px',
        padding: '8px 12px',
        maxWidth: '236px',
        minWidth: '100px',
        maxHeight: '110px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        zIndex: 100,
        pointerEvents: 'auto',
        userSelect: 'none',
        animation: 'bubblePop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
        <div
          className="speech-bubble-scroll"
          style={{
            flex: 1,
            maxHeight: '92px',
            overflowY: 'auto',
            fontSize: '12px',
            lineHeight: '1.4',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            whiteSpace: 'pre-wrap',
            paddingRight: message.dismissible ? '2px' : '0',
          }}
        >
          {message.text}
        </div>
        {message.dismissible && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted, #94A3B8)',
              cursor: 'pointer',
              padding: '0 2px',
              fontSize: '13px',
              lineHeight: 1,
              flexShrink: 0,
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
