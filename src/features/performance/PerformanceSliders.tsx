import React from 'react';
import { usePerformanceStore } from './performanceStore';

export const PerformanceSliders: React.FC = () => {
  const {
    config,
    updatePerformanceSection,
    updatePetSection,
    updateSystemSection,
    updateMusicSection,
    updateDeveloperSection,
  } = usePerformanceStore();

  const perf = config.performance;
  const pet = config.pet;
  const sys = config.system;
  const mus = config.music;
  const dev = config.developer;

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card, #1E293B)',
        border: '1px solid var(--color-border, #334155)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '15px', color: '#FFFFFF' }}>Custom Knobs & Hardware Throttling</h4>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted, #94A3B8)' }}>
          Changes apply live to ~/.config/lulu/config.toml
        </span>
      </div>

      {/* Frame Rate (FPS) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span>Target Frame Rate</span>
          <span style={{ fontWeight: 600, color: 'var(--color-primary, #818CF8)' }}>{perf.fps} FPS</span>
        </div>
        <input
          type="range"
          min="15"
          max="60"
          step="1"
          value={perf.fps}
          onChange={(e) => updatePerformanceSection({ fps: parseInt(e.target.value, 10) })}
          style={{ width: '100%', accentColor: 'var(--color-primary, #818CF8)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748B' }}>
          <span>15 FPS (Battery/Old PC)</span>
          <span>30 FPS (Balanced)</span>
          <span>60 FPS (Full)</span>
        </div>
      </div>

      {/* Visual Effects & Shaders Grid */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#E2E8F0' }}>
          Visual Effects & Shader Compositing
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            {
              label: 'Shadows',
              desc: 'Drop shadows',
              checked: perf.shadows,
              onChange: (c: boolean) => updatePerformanceSection({ shadows: c }),
            },
            {
              label: 'Chakra Glow',
              desc: 'Radial glow',
              checked: perf.glow,
              onChange: (c: boolean) => updatePerformanceSection({ glow: c }),
            },
            {
              label: 'Blur Filter',
              desc: 'CSS filter: blur()',
              checked: perf.blur,
              onChange: (c: boolean) => updatePerformanceSection({ blur: c }),
            },
            {
              label: 'Particles',
              desc: 'Hearts & sparkles',
              checked: perf.particles,
              onChange: (c: boolean) => updatePerformanceSection({ particles: c }),
            },
            {
              label: 'Background FX',
              desc: 'Scene effects',
              checked: perf.background_effects,
              onChange: (c: boolean) => updatePerformanceSection({ background_effects: c }),
            },
            {
              label: 'Battery Saver',
              desc: 'Auto-step down',
              checked: perf.power_saving,
              onChange: (c: boolean) => updatePerformanceSection({ power_saving: c }),
            },
          ].map((item, idx) => (
            <label
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => item.onChange(e.target.checked)}
                style={{ marginTop: '2px', accentColor: 'var(--color-primary, #818CF8)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#F1F5F9' }}>{item.label}</span>
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>{item.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Pet Movement & Walking Tick */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>Walking Tick Frequency</span>
            <span style={{ fontWeight: 600, color: 'var(--color-primary, #818CF8)' }}>{pet.movement_tick_ms} ms</span>
          </div>
          <input
            type="range"
            min="20"
            max="200"
            step="10"
            value={pet.movement_tick_ms}
            onChange={(e) => updatePetSection({ movement_tick_ms: parseInt(e.target.value, 10) })}
            style={{ width: '100%', accentColor: 'var(--color-primary, #818CF8)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '10px', color: '#64748B' }}>
            Higher tick interval (100–150ms) eliminates CPU wakeups on 2-core CPUs
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span>Telemetry Poll Interval</span>
            <span style={{ fontWeight: 600, color: 'var(--color-primary, #818CF8)' }}>{sys.monitoring_interval} ms</span>
          </div>
          <input
            type="range"
            min="1000"
            max="15000"
            step="1000"
            value={sys.monitoring_interval}
            onChange={(e) => updateSystemSection({ monitoring_interval: parseInt(e.target.value, 10) })}
            style={{ width: '100%', accentColor: 'var(--color-primary, #818CF8)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '10px', color: '#64748B' }}>
            Interval between system hardware & thermals polling
          </span>
        </div>
      </div>

      {/* MPRIS & Dev Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={mus.mpris}
              onChange={(e) => updateMusicSection({ mpris: e.target.checked })}
              style={{ accentColor: 'var(--color-primary, #818CF8)' }}
            />
            <span>MPRIS Music Sync</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={dev.performance_overlay}
              onChange={(e) => updateDeveloperSection({ performance_overlay: e.target.checked })}
              style={{ accentColor: 'var(--color-primary, #818CF8)' }}
            />
            <span>Show Performance Monitor</span>
          </label>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--color-primary, #818CF8)' }}>
          MPRIS Poll: {mus.position_poll_interval}ms
        </div>
      </div>
    </div>
  );
};
