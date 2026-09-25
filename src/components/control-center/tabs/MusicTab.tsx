import React, { useState } from 'react';
import { useLuluStore } from '../../../stores/useLuluStore';

export const MusicTab: React.FC = () => {
  const { setAnimation, speak, settings, updateSettings } = useLuluStore();
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  const toggleMusicDemo = () => {
    if (!isPlayingDemo) {
      setIsPlayingDemo(true);
      setAnimation('dance');
      speak('Lulu is listening and dancing to the groove! 🎵🎶');
    } else {
      setIsPlayingDemo(false);
      setAnimation('idle');
      speak('Music paused.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Music Reactions</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Companion acoustic awareness. When enabled, Lulu dances and bounces to music.
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>Enable Music Reactions</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Allows Lulu to enter dance mode upon audio playback events.
          </div>
        </div>
        <input
          type="checkbox"
          checked={settings.musicReactionsEnabled}
          onChange={(e) => updateSettings({ musicReactionsEnabled: e.target.checked })}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
      </div>

      {/* Music Mode Simulator */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', animation: isPlayingDemo ? 'bounce 0.8s infinite' : 'none' }}>
          {isPlayingDemo ? '🎵 🐾 🎶' : '🎧'}
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>
            {isPlayingDemo ? 'Starlight Rhythm Active' : 'Music Inactive'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {isPlayingDemo ? 'Lulu is dancing with you!' : 'Simulate audio playback to test dancing animations'}
          </div>
        </div>

        <button
          onClick={toggleMusicDemo}
          style={{
            padding: '10px 24px',
            backgroundColor: isPlayingDemo ? '#EF4444' : 'var(--color-primary, #818CF8)',
            border: 'none',
            borderRadius: '10px',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {isPlayingDemo ? '⏹ Stop Dancing' : '▶ Simulate Playback (Dance Mode)'}
        </button>
      </div>
    </div>
  );
};
