import React, { useState, useEffect } from 'react';
import { useLuluStore } from '../../stores/useLuluStore';
import { MessageSquare, Settings, Music, Cpu, Sparkles, User, RefreshCw } from 'lucide-react';

export const WidgetMode: React.FC = () => {
  const {
    mood,
    needs,
    systemMetrics,
    mediaStatus,
    toggleWidgetMode,
    setChatOpen,
    setControlCenterOpen,
    character,
    currentLyric,
  } = useLuluStore();

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const getMoodEmoji = () => {
    switch (mood) {
      case 'happy': return '😊';
      case 'curious': return '✨';
      case 'playful': return '🐾';
      case 'excited': return '⭐';
      case 'focused': return '🎯';
      case 'sleepy': return '💤';
      case 'loving': return '💖';
      case 'calm':
      default: return '🌸';
    }
  };

  return (
    <div
      style={{
        width: '240px',
        padding: '14px',
        borderRadius: '18px',
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        border: '1.5px solid var(--color-border, #334155)',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        color: '#F8FAFC',
        fontSize: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Header: Clock + Date + Switch back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {timeStr}
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, marginTop: '2px' }}>
            {dateStr}
          </div>
        </div>

        <button
          onClick={toggleWidgetMode}
          title="Return to Pet Mascot Mode"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '8px',
            backgroundColor: 'rgba(129, 140, 248, 0.15)',
            border: '1px solid #818CF8',
            color: '#818CF8',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span>🐾 Mascot</span>
        </button>
      </div>

      {/* Mascot Info Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          borderRadius: '10px',
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <span style={{ fontSize: '18px' }}>{getMoodEmoji()}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{character?.displayName || 'Lulu'}</span>
            <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 400 }}>({mood})</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
            <span style={{ fontSize: '10px', color: '#34D399' }}>⚡ {Math.round(needs.energy)}%</span>
            <span style={{ fontSize: '10px', color: '#F472B6' }}>💖 {Math.round(needs.happiness)}%</span>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      {systemMetrics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            fontSize: '10px',
          }}
        >
          <div
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: '#94A3B8' }}>CPU</span>
            <span style={{ fontWeight: 700, color: '#38BDF8' }}>{Math.round(systemMetrics.cpuUsage || 0)}%</span>
          </div>
          <div
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: '#94A3B8' }}>RAM</span>
            <span style={{ fontWeight: 700, color: '#A78BFA' }}>
              {Math.round(systemMetrics.memoryPercentage || 0)}%
            </span>
          </div>
        </div>
      )}

      {/* Music / Lyric Ticker */}
      {mediaStatus?.title && (
        <div
          style={{
            padding: '5px 8px',
            borderRadius: '8px',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#C7D2FE',
            overflow: 'hidden',
          }}
        >
          <Music size={13} style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentLyric ? `♪ ${currentLyric}` : `${mediaStatus.title} - ${mediaStatus.artist || 'Unknown'}`}
          </span>
        </div>
      )}

      {/* Quick Launch Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '2px' }}>
        <button
          onClick={() => setChatOpen(true)}
          style={{
            padding: '6px 8px',
            borderRadius: '8px',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(129, 140, 248, 0.4)',
            color: '#E0E7FF',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <MessageSquare size={12} />
          <span>AI Chat</span>
        </button>

        <button
          onClick={() => setControlCenterOpen(true)}
          style={{
            padding: '6px 8px',
            borderRadius: '8px',
            backgroundColor: 'rgba(51, 65, 85, 0.5)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#E2E8F0',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <Settings size={12} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
