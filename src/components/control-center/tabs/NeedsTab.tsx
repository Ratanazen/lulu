import React from 'react';
import { useLuluStore } from '../../../stores/useLuluStore';

export const NeedsTab: React.FC = () => {
  const { needs, mood, feed, playGame, clean, sleep, interact } = useLuluStore();

  const needDetails = [
    { key: 'energy', label: 'Energy', val: needs.energy, icon: '⚡', desc: 'Restores when sleeping. Drains slowly as Lulu moves.', action: () => sleep(), actionLabel: 'Rest' },
    { key: 'happiness', label: 'Happiness', val: needs.happiness, icon: '💖', desc: 'Maintained by regular affection, games, and treats.', action: () => interact(), actionLabel: 'Pet' },
    { key: 'fun', label: 'Fun', val: needs.fun, icon: '🎾', desc: 'Increases when playing mini-games or chasing toys.', action: () => playGame(25), actionLabel: 'Play' },
    { key: 'hunger', label: 'Hunger & Nutrition', val: needs.hunger, icon: '🍓', desc: 'Keeps Lulu energized with sweet starlight berries.', action: () => feed(25), actionLabel: 'Feed' },
    { key: 'cleanliness', label: 'Cleanliness', val: needs.cleanliness, icon: '🫧', desc: 'A clean companion is a cheerful companion.', action: () => clean(), actionLabel: 'Brush' },
    { key: 'attention', label: 'Attention', val: needs.attention, icon: '👀', desc: 'Increases when you click and talk with Lulu.', action: () => interact(), actionLabel: 'Interact' },
    { key: 'social', label: 'Social Bond', val: needs.social, icon: '🐾', desc: 'Long-term bond formed by daily desktop companionship.', action: () => interact(), actionLabel: 'Bond' },
    { key: 'health', label: 'Health', val: needs.health, icon: '🌿', desc: 'Overall vitality sustained by keeping all needs above 25%.', action: () => sleep(), actionLabel: 'Heal' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Needs & Vitality Management</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Current Mood: <span style={{ textTransform: 'capitalize', color: 'var(--color-primary, #818CF8)', fontWeight: 600 }}>{mood}</span>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {needDetails.map((item) => (
          <div
            key={item.key}
            style={{
              backgroundColor: 'var(--color-bg-card, #1E293B)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '16px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>
                {item.icon} {item.label}
              </span>
              <span style={{ fontWeight: 700, fontSize: '13px', color: item.val > 50 ? '#34D399' : '#EF4444' }}>
                {Math.round(item.val)}%
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
              <div
                style={{
                  width: `${Math.max(2, Math.min(100, item.val))}%`,
                  height: '100%',
                  backgroundColor: item.val > 50 ? 'var(--color-primary, #818CF8)' : '#F59E0B',
                  borderRadius: '4px',
                }}
              />
            </div>

            <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              {item.desc}
            </p>

            <button
              onClick={item.action}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '8px',
                color: 'var(--color-text, #F8FAFC)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {item.actionLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
