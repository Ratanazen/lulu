import React from 'react';
import { useLuluStore } from '../../../stores/useLuluStore';

export const NotificationsTab: React.FC = () => {
  const { progression, speak } = useLuluStore();

  const achievementsList = Object.values(progression.achievements);
  const unlockedCount = achievementsList.filter((a) => a.unlocked).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Notification & Achievement Center</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Trophies unlocked: {unlockedCount} / {achievementsList.length} • Total XP: {progression.xp}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {achievementsList.map((ach) => (
          <div
            key={ach.id}
            style={{
              backgroundColor: 'var(--color-bg-card, #1E293B)',
              border: ach.unlocked
                ? '1px solid #10B981'
                : '1px solid var(--color-border, #334155)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              opacity: ach.unlocked ? 1 : 0.65,
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: ach.unlocked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0,
              }}
            >
              {ach.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: ach.unlocked ? '#F8FAFC' : '#94A3B8' }}>
                {ach.title} {ach.unlocked && '✓'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                {ach.description}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-primary, #818CF8)', marginTop: '4px' }}>
                Progress: {ach.progress} / {ach.maxProgress}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => speak('Lulu is always here cheering for your achievements! ✨')}
        style={{
          padding: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '10px',
          color: 'var(--color-text, #F8FAFC)',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        💬 Test Notification Bubble
      </button>
    </div>
  );
};
