import React from 'react';
import { useLuluStore } from '../../../stores/useLuluStore';
import { BehaviorMode } from '../../../types';

export const BehaviorTab: React.FC = () => {
  const { settings, updateSettings, character, speak } = useLuluStore();

  const modes: { id: BehaviorMode; label: string; desc: string }[] = [
    { id: 'NORMAL', label: 'Balanced Normal', desc: 'Natural balanced blend of idle resting and occasional exploring.' },
    { id: 'PLAYFUL', label: 'Playful & Active', desc: 'Frequent exploration, invitations to play mini-games, cheerful reactions.' },
    { id: 'CALM', label: 'Calm & Gentle', desc: 'Slow, relaxed wanderings, peaceful resting, lower movement speed.' },
    { id: 'FOCUSED', label: 'Deep Focus Companion', desc: 'Quiet, minimal movement, stays by your side as a study/work partner.' },
    { id: 'QUIET', label: 'Muted Quiet', desc: 'No spontaneous speech bubbles, static or resting posture.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Behavior & Personality Engine</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Configure companion autonomy, behavior modes, and dialogue frequencies.
        </p>
      </div>

      {/* Behavior Mode Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {modes.map((m) => {
          const isSelected = settings.behaviorMode === m.id;
          return (
            <div
              key={m.id}
              onClick={() => {
                updateSettings({ behaviorMode: m.id });
                speak(`Switched behavior mode to ${m.label}!`);
              }}
              style={{
                backgroundColor: 'var(--color-bg-card, #1E293B)',
                border: isSelected
                  ? '2px solid var(--color-primary, #818CF8)'
                  : '1px solid var(--color-border, #334155)',
                borderRadius: '14px',
                padding: '16px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{m.label}</span>
                {isSelected && <span style={{ color: 'var(--color-primary, #818CF8)', fontSize: '12px' }}>● Active</span>}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                {m.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Personality Trait Sliders (Read-only or customizable) */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 16px 0', fontSize: '15px' }}>
          Active Personality Matrix ({character.displayName})
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <TraitSlider label="Curiosity" value={character.personality.curiosity} icon="🔍" />
          <TraitSlider label="Friendliness" value={character.personality.friendliness} icon="💖" />
          <TraitSlider label="Playfulness" value={character.personality.playfulness} icon="🐾" />
          <TraitSlider label="Calmness" value={character.personality.calmness} icon="🌿" />
          <TraitSlider label="Focus" value={character.personality.focus} icon="🎯" />
          <TraitSlider label="Energy" value={character.personality.energy} icon="⚡" />
        </div>
      </div>

      {/* Dialogue Settings */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Speech Bubble Frequency</h4>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(['low', 'normal', 'high'] as const).map((freq) => (
            <button
              key={freq}
              onClick={() => updateSettings({ speechFrequency: freq })}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: settings.speechFrequency === freq ? 'var(--color-primary, #818CF8)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--color-border, #334155)',
                color: '#FFFFFF',
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer',
              }}
            >
              {freq} Frequency
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const TraitSlider: React.FC<{ label: string; value: number; icon: string }> = ({
  label,
  value,
  icon,
}) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
      <span>{icon} {label}</span>
      <span style={{ fontWeight: 600 }}>{value}%</span>
    </div>
    <div style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', backgroundColor: 'var(--color-primary, #818CF8)', borderRadius: '3px' }} />
    </div>
  </div>
);
