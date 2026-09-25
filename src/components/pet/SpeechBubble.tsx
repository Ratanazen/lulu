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
        transform: 'translateX(-50%) translateY(-12px)',
        backgroundColor: 'var(--color-bg-card, #1E293B)',
        color: 'var(--color-text, #F8FAFC)',
        border: '2px solid var(--color-primary, #818CF8)',
        borderRadius: '16px',
        padding: '10px 14px',
        maxWidth: '220px',
        minWidth: '120px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        zIndex: 100,
        fontSize: '13px',
        lineHeight: '1.4',
        pointerEvents: 'auto',
        userSelect: 'none',
        animation: 'bubblePop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1 }}>{message.text}</div>
        {message.dismissible && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted, #94A3B8)',
              cursor: 'pointer',
              padding: '0 2px',
              fontSize: '14px',
              lineHeight: 1,
            }}
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
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid var(--color-primary, #818CF8)',
        }}
      />
    </div>
  );
};
