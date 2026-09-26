import React from 'react';
import { useLuluStore } from '../../stores/useLuluStore';

export const QuickStatusOverlay: React.FC = () => {
  const { mood, needs, setControlCenterOpen } = useLuluStore();

  const renderMoodIcon = () => {
    switch (mood) {
      case 'focused':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" fill="#60A5FA" />
          </svg>
        );
      case 'excited':
      case 'happy':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="1">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      case 'loving':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#FB7185" stroke="#FB7185" strokeWidth="1">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        );
      case 'sleepy':
      case 'tired':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        );
      case 'curious':
      case 'playful':
      default:
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '2px',
        background: 'var(--lulu-card-bg, rgba(15, 23, 42, 0.75))',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '3px 10px',
        borderRadius: '12px',
        border: '1px solid var(--lulu-border, rgba(255, 255, 255, 0.15))',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
        cursor: 'pointer',
        fontSize: '11px',
        color: '#F8FAFC',
        transition: 'all 0.2s ease',
      }}
      onClick={(e) => {
        e.stopPropagation();
        setControlCenterOpen(true);
      }}
      title="Click to open Lulu Control Center"
    >
      <span style={{ display: 'flex', alignItems: 'center' }}>{renderMoodIcon()}</span>
      <span style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '11px' }}>{mood}</span>

      {/* Mini energy dot */}
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: needs.energy > 50 ? '#34D399' : needs.energy > 20 ? '#FBBF24' : '#EF4444',
          boxShadow: needs.energy > 50 ? '0 0 6px #34D399' : 'none',
        }}
        title={`Energy: ${needs.energy}%`}
      />

      {/* Mini happiness dot */}
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: needs.happiness > 50 ? '#818CF8' : '#F472B6',
          boxShadow: needs.happiness > 50 ? '0 0 6px #818CF8' : 'none',
        }}
        title={`Happiness: ${needs.happiness}%`}
      />
    </div>
  );
};
