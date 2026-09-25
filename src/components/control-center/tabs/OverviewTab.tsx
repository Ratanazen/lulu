import React from 'react';
import { useLuluStore } from '../../../stores/useLuluStore';

export const OverviewTab: React.FC = () => {
  const {
    character,
    mood,
    needs,
    progression,
    currentPosition,
    feed,
    playGame,
    clean,
    sleep,
    wander,
    goHome,
    setActiveTab,
  } = useLuluStore();

  const getMoodEmoji = () => {
    switch (mood) {
      case 'happy': return '😊';
      case 'curious': return '✨';
      case 'playful': return '🐾';
      case 'excited': return '⭐';
      case 'focused': return '🎯';
      case 'tired': return '🥱';
      case 'sleepy': return '💤';
      case 'loving': return '💖';
      default: return '🌸';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Hero Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: character.palette.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            {getMoodEmoji()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>
              {character.displayName}
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted, #94A3B8)', fontSize: '14px' }}>
              Level {progression.level} Companion • Mood: <span style={{ textTransform: 'capitalize', color: 'var(--color-primary, #818CF8)', fontWeight: 600 }}>{mood}</span>
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted, #94A3B8)' }}>Desktop Coordinates</div>
          <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '16px', color: 'var(--color-text, #F8FAFC)' }}>
            X: {Math.round(currentPosition.x)}, Y: {Math.round(currentPosition.y)}
          </div>
        </div>
      </div>

      {/* Quick Care Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <button onClick={() => feed(25)} style={careBtnStyle}>
          <span style={{ fontSize: '22px' }}>🍓</span>
          <span style={{ fontWeight: 600 }}>Feed Berry</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>+25 Hunger</span>
        </button>
        <button onClick={() => playGame(25)} style={careBtnStyle}>
          <span style={{ fontSize: '22px' }}>🎾</span>
          <span style={{ fontWeight: 600 }}>Play Time</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>+25 Fun</span>
        </button>
        <button onClick={() => clean()} style={careBtnStyle}>
          <span style={{ fontSize: '22px' }}>✨</span>
          <span style={{ fontWeight: 600 }}>Groom</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>100% Clean</span>
        </button>
        <button onClick={() => sleep()} style={careBtnStyle}>
          <span style={{ fontSize: '22px' }}>💤</span>
          <span style={{ fontWeight: 600 }}>Tuck In</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>+40 Energy</span>
        </button>
      </div>

      {/* Needs Progress Bars Grid */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Vital Needs & Wellbeing</h3>
          <button
            onClick={() => setActiveTab('needs')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary, #818CF8)', cursor: 'pointer', fontSize: '13px' }}
          >
            Detailed Breakdown →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <NeedBar label="Energy" value={needs.energy} color="#F59E0B" icon="⚡" />
          <NeedBar label="Happiness" value={needs.happiness} color="#EC4899" icon="💖" />
          <NeedBar label="Fun" value={needs.fun} color="#8B5CF6" icon="🎮" />
          <NeedBar label="Hunger" value={needs.hunger} color="#10B981" icon="🍏" />
          <NeedBar label="Cleanliness" value={needs.cleanliness} color="#06B6D4" icon="🫧" />
          <NeedBar label="Attention" value={needs.attention} color="#F43F5E" icon="👀" />
        </div>
      </div>

      {/* Quick Nav Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <button
          onClick={() => wander()}
          style={actionCardBtnStyle}
        >
          <span style={{ fontSize: '20px' }}>🧭</span>
          <div>
            <div style={{ fontWeight: 600 }}>Wander Desktop</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Walk to a random spot</div>
          </div>
        </button>
        <button
          onClick={() => goHome()}
          style={actionCardBtnStyle}
        >
          <span style={{ fontSize: '20px' }}>🏠</span>
          <div>
            <div style={{ fontWeight: 600 }}>Return Home</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Move to home position</div>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('games')}
          style={actionCardBtnStyle}
        >
          <span style={{ fontSize: '20px' }}>🎯</span>
          <div>
            <div style={{ fontWeight: 600 }}>Mini-Games</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>8 playable games</div>
          </div>
        </button>
      </div>
    </div>
  );
};

const NeedBar: React.FC<{ label: string; value: number; color: string; icon: string }> = ({
  label,
  value,
  color,
  icon,
}) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text, #F8FAFC)' }}>
        <span>{icon}</span> {label}
      </span>
      <span style={{ fontWeight: 600, color: 'var(--color-text-muted, #94A3B8)' }}>{Math.round(value)}%</span>
    </div>
    <div style={{ height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.max(2, Math.min(100, value))}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '4px',
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  </div>
);

const careBtnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  padding: '14px 10px',
  backgroundColor: 'var(--color-bg-card, #1E293B)',
  border: '1px solid var(--color-border, #334155)',
  borderRadius: '12px',
  color: 'var(--color-text, #F8FAFC)',
  cursor: 'pointer',
  transition: 'transform 0.15s ease, background-color 0.15s ease',
};

const actionCardBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  backgroundColor: 'var(--color-bg-card, #1E293B)',
  border: '1px solid var(--color-border, #334155)',
  borderRadius: '12px',
  color: 'var(--color-text, #F8FAFC)',
  cursor: 'pointer',
  textAlign: 'left',
};
