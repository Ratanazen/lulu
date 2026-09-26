import React from 'react';
import { usePerformanceStore, PerformanceMode } from './performanceStore';
import { Zap, Battery, Cpu, Sparkles, Sliders, Shield } from 'lucide-react';

export const PerformanceModeSelector: React.FC = () => {
  const { mode, tier, power, setMode, config } = usePerformanceStore();

  const modes: {
    id: PerformanceMode;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    fps: number;
    description: string;
  }[] = [
    {
      id: 'AUTO',
      label: 'Auto',
      sublabel: `Tier: ${tier}`,
      icon: <Sparkles size={18} className="text-amber-400" />,
      fps: config.performance.fps,
      description: 'Auto-selects optimal preset based on CPU, RAM, GPU, and battery status.',
    },
    {
      id: 'POWER_SAVER',
      label: 'Power Saver',
      sublabel: '18 FPS • Minimal',
      icon: <Battery size={18} className="text-emerald-400" />,
      fps: 18,
      description: 'For very old laptops & battery mode. Disables shadows, glow, and canvas shaders.',
    },
    {
      id: 'LOW',
      label: 'Low',
      sublabel: '24 FPS • Simple',
      icon: <Shield size={18} className="text-blue-400" />,
      fps: 24,
      description: 'Smooth 24 FPS cap with simplified animation for 4–8GB RAM and older dual-core CPUs.',
    },
    {
      id: 'BALANCED',
      label: 'Balanced',
      sublabel: '30 FPS • Normal',
      icon: <Cpu size={18} className="text-indigo-400" />,
      fps: 30,
      description: 'Recommended for standard systems. Balanced responsiveness, glow effects, and power.',
    },
    {
      id: 'HIGH',
      label: 'High',
      sublabel: '60 FPS • Full',
      icon: <Zap size={18} className="text-purple-400" />,
      fps: 60,
      description: 'Full 60 FPS motions, particles, glowing chakra aura, and rapid MPRIS sync.',
    },
    {
      id: 'CUSTOM',
      label: 'Custom',
      sublabel: 'Fine-tuned',
      icon: <Sliders size={18} className="text-pink-400" />,
      fps: config.performance.fps,
      description: 'Custom fine-grained control over frame rate, shaders, timers, and polling.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Power status bar if battery mode active */}
      {power.hasBattery && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: power.isPowerSavingActive ? 'rgba(234, 179, 8, 0.12)' : 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${power.isPowerSavingActive ? 'rgba(234, 179, 8, 0.35)' : 'var(--color-border, #334155)'}`,
            borderRadius: '12px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Battery size={16} color={power.isPowerSavingActive ? '#EAB308' : '#94A3B8'} />
            <span>
              Power Source: <strong>{power.acOnline ? 'AC Adapter (Plugged in)' : 'Battery Power'}</strong>
              {power.batteryPercentage !== null && ` (${power.batteryPercentage}%)`}
            </span>
          </div>
          {power.isPowerSavingActive && (
            <span style={{ color: '#EAB308', fontWeight: 600, fontSize: '11px' }}>
              ⚡ Battery Eco-Throttle Active
            </span>
          )}
        </div>
      )}

      {/* Grid of Preset Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {modes.map((m) => {
          const isSelected = mode === m.id;
          return (
            <div
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--color-bg-card, #1E293B)',
                border: isSelected
                  ? '2px solid var(--color-primary, #818CF8)'
                  : '1px solid var(--color-border, #334155)',
                borderRadius: '14px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {m.icon}
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#FFFFFF' }}>{m.label}</span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    backgroundColor: isSelected ? 'var(--color-primary, #818CF8)' : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#FFFFFF' : 'var(--color-text-muted, #94A3B8)',
                  }}
                >
                  {m.sublabel}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #94A3B8)', lineHeight: '1.4' }}>
                {m.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
