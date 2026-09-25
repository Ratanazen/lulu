import React, { useState, useEffect } from 'react';
import { useLuluStore } from '../../../stores/useLuluStore';
import { PerformanceProfile } from '../../../types';
import { resourceGovernor } from '../../../services/resourceGovernor';

export const PerformanceTab: React.FC = () => {
  const { settings, updateSettings, speak } = useLuluStore();
  const [govState, setGovState] = useState(resourceGovernor.getState());

  useEffect(() => {
    const unsub = resourceGovernor.subscribe((state) => {
      setGovState(state);
    });
    return () => unsub();
  }, []);

  const profiles: { id: PerformanceProfile; label: string; desc: string; fps: number }[] = [
    { id: 'AUTO', label: 'Adaptive Auto', desc: 'Dynamically adapts based on system load and power status.', fps: 60 },
    { id: 'LOW', label: 'Battery Saver', desc: 'Minimal CPU usage, 30 FPS cap, throttles when idle.', fps: 30 },
    { id: 'BALANCED', label: 'Balanced (Recommended)', desc: 'Smooth 60 FPS animation with power throttling.', fps: 60 },
    { id: 'HIGH', label: 'High Fidelity', desc: '90-120 FPS high-refresh rate support for fluid motions.', fps: 120 },
    { id: 'MAX_FPS', label: 'Max Refresh', desc: 'Matches monitor display rate with CPU pacing safeguards.', fps: 144 },
  ];

  const handleSelectProfile = (p: typeof profiles[0]) => {
    updateSettings({
      performanceProfile: p.id,
      renderFps: p.fps,
      animationFps: p.fps,
    });
    speak(`Performance mode set to ${p.label}! ⚡`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Performance & Power Management</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Tune animation frame pacing, rendering caps, and energy conservation.
        </p>
      </div>

      {/* Profiles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {profiles.map((p) => {
          const isSelected = settings.performanceProfile === p.id;
          return (
            <div
              key={p.id}
              onClick={() => handleSelectProfile(p)}
              style={{
                backgroundColor: 'var(--color-bg-card, #1E293B)',
                border: isSelected
                  ? '2px solid var(--color-primary, #818CF8)'
                  : '1px solid var(--color-border, #334155)',
                borderRadius: '16px',
                padding: '16px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{p.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--color-primary, #818CF8)', fontWeight: 600 }}>
                  {p.fps} FPS
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                {p.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Target FPS Selection */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Custom Render Target Rate</h4>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[15, 30, 60, 90, 120, 144].map((fps) => (
            <button
              key={fps}
              onClick={() => updateSettings({ renderFps: fps, performanceProfile: 'CUSTOM' })}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: '8px',
                backgroundColor: settings.renderFps === fps ? 'var(--color-primary, #818CF8)' : 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--color-border, #334155)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {fps} FPS
            </button>
          ))}
        </div>
      </div>

      {/* Energy & Inactivity Safeguards */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <h4 style={{ margin: 0, fontSize: '15px' }}>Resource Safeguards</h4>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={settings.powerSavingEnabled}
            onChange={(e) => updateSettings({ powerSavingEnabled: e.target.checked })}
          />
          Adaptive power saving when system is idle or window hidden
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
          />
          Disable cosmetic particle effects and reduced animation transitions
        </label>
      </div>

      {/* Autonomous Resource Governor */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', color: '#F8FAFC' }}>Autonomous Resource Governor</h4>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
              Safety monitor that prevents Lulu from competing with games or heavy compile workloads.
            </p>
          </div>
          <span
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              fontWeight: 600,
              backgroundColor: govState.isThrottled ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: govState.isThrottled ? '#F59E0B' : '#10B981',
              border: `1px solid ${govState.isThrottled ? '#F59E0B' : '#10B981'}`,
            }}
          >
            {govState.isThrottled ? '⚡ THROTTLED (15 FPS CAP)' : `✓ OPTIMAL PACING (${govState.currentEffectiveFps} FPS)`}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Host CPU Usage</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#38BDF8' }}>
              {govState.lastCpuCheck.toFixed(1)}%
            </div>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Host RAM Usage</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#A78BFA' }}>
              {govState.lastMemoryCheck.toFixed(1)}%
            </div>
          </div>
          <div style={{ padding: '10px', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Safety Threshold</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#F8FAFC' }}>
              80.0% CPU
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
