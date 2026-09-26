import React, { useState, useEffect } from 'react';
import { usePerformanceStore } from './performanceStore';
import { PerformanceModeSelector } from './PerformanceModeSelector';
import { PerformanceSliders } from './PerformanceSliders';
import { PerformanceMonitor } from './PerformanceMonitor';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export const PerformanceSettings: React.FC = () => {
  const { init, resetConfig, config } = usePerformanceStore();
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const handleReset = async () => {
    await resetConfig();
    setShowConfirmReset(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#FFFFFF' }}>Performance & Hardware Optimization</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Hardware detection, frame rate pacing, and low-spec computer optimizations (0% to 100%).
        </p>
      </div>

      {/* Mode Selector */}
      <PerformanceModeSelector />

      {/* Sliders and Custom Toggles */}
      <PerformanceSliders />

      {/* Developer Performance Monitor */}
      {config.developer.performance_overlay && <PerformanceMonitor />}

      {/* Reset Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <RotateCcw size={18} color="#EF4444" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#F87171' }}>Reset Performance Configuration</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Restore default AUTO mode and rebuild ~/.config/lulu/config.toml
            </div>
          </div>
        </div>

        {showConfirmReset ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600 }}>Reset to defaults?</span>
            <button
              onClick={handleReset}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => setShowConfirmReset(false)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmReset(true)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              color: '#F87171',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset Performance
          </button>
        )}
      </div>
    </div>
  );
};
