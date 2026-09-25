import React from 'react';
import { useLuluStore } from '../../stores/useLuluStore';

export const QuickStatusOverlay: React.FC = () => {
  const { mood, needs, setControlCenterOpen } = useLuluStore();

  const getMoodEmoji = () => {
    switch (mood) {
      case 'happy': return '😊';
      case 'curious': return '✨';
      case 'playful': return '🐾';
      case 'excited': return '⭐';
      case 'focused': return '🎯';
      case 'tired': return '🥱';
      case 'sleepy': return '💤';
      case 'sad': return '🥺';
      case 'loving': return '💖';
      case 'worried': return '💭';
      case 'calm':
      default: return '🌸';
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
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        padding: '3px 8px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        cursor: 'pointer',
        fontSize: '11px',
        color: '#E2E8F0',
        transition: 'all 0.2s ease',
      }}
      onClick={(e) => {
        e.stopPropagation();
        setControlCenterOpen(true);
      }}
      title="Click to open Lulu Control Center"
    >
      <span>{getMoodEmoji()}</span>
      <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{mood}</span>

      {/* Mini energy dot */}
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: needs.energy > 50 ? '#34D399' : needs.energy > 20 ? '#FBBF24' : '#EF4444',
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
        }}
        title={`Happiness: ${needs.happiness}%`}
      />
    </div>
  );
};
