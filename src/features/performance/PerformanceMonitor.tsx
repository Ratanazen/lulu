import React, { useEffect } from 'react';
import { usePerformanceStore } from './performanceStore';
import { Activity, RefreshCw } from 'lucide-react';

export const PerformanceMonitor: React.FC = () => {
  const { runtime, config, refreshRuntime } = usePerformanceStore();

  useEffect(() => {
    const timer = setInterval(() => {
      refreshRuntime();
    }, 2000);
    return () => clearInterval(timer);
  }, [refreshRuntime]);

  const tempColor = !runtime.cpuTempCelsius
    ? '#38BDF8'
    : runtime.cpuTempCelsius >= 74
    ? '#EF4444'
    : runtime.cpuTempCelsius >= 68
    ? '#F59E0B'
    : '#10B981';

  const rows = [
    {
      label: 'CPU Temperature',
      val: runtime.cpuTempCelsius
        ? `${runtime.cpuTempCelsius.toFixed(1)}°C (${runtime.thermalState})`
        : 'Sensors active',
      color: tempColor,
    },
    {
      label: 'Thermal Governor',
      val: runtime.thermalState === 'HOT'
        ? 'EMERGENCY COOLING'
        : runtime.thermalState === 'WARM'
        ? 'THROTTLE ACTIVE'
        : 'OPTIMAL / COOL',
      color: tempColor,
    },
    { label: 'Render Frame Rate', val: `${runtime.currentFps} FPS (Target: ${config.performance.fps})` },
    { label: 'Process RSS Memory', val: `${runtime.memoryRssMb} MB` },
    { label: 'Performance Mode', val: runtime.mode },
    { label: 'Hardware Tier', val: runtime.tier },
    { label: 'Renderer State', val: runtime.rendererState },
    { label: 'Animation Quality', val: runtime.animationQuality },
    { label: 'D-Bus Notifications', val: runtime.dbusState },
    { label: 'MPRIS Music State', val: runtime.mprisState },
    { label: 'Lyrics Synchronizer', val: runtime.lyricsState },
    { label: 'SQLite Writes', val: `${runtime.databaseWritesCount} batched writes` },
    { label: 'Battery Saver', val: runtime.isPowerSaving ? 'ACTIVE' : 'STANDBY' },
    { label: 'Adaptive Throttle', val: runtime.isAdaptiveDowngraded ? 'ACTIVE' : 'OFF' },
  ];

  return (
    <div
      style={{
        backgroundColor: '#0F172A',
        border: '1px solid #334155',
        borderRadius: '16px',
        padding: '18px',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="#818CF8" />
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#F8FAFC' }}>Lulu Performance Telemetry</span>
        </div>
        <button
          onClick={() => refreshRuntime()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#818CF8',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '6px',
              fontSize: '11px',
            }}
          >
            <span style={{ color: '#94A3B8' }}>{r.label}:</span>
            <span style={{ fontWeight: 600, color: (r as any).color || '#38BDF8' }}>{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
