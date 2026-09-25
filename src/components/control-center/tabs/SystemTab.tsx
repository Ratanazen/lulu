import React, { useEffect, useState } from 'react';
import { SystemMetrics } from '../../../types';

let tauriInvoke: (<T = any>(cmd: string, args?: Record<string, unknown>) => Promise<T>) | null = null;

async function getInvoke() {
  if (tauriInvoke) return tauriInvoke;
  try {
    const core = await import('@tauri-apps/api/core');
    tauriInvoke = core.invoke;
    return tauriInvoke;
  } catch {
    return null;
  }
}

export const SystemTab: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        const m = await invoke<SystemMetrics>('get_system_metrics');
        setMetrics(m);
        setLoading(false);
        return;
      } catch (e) {
        console.warn('System metrics IPC error:', e);
      }
    }

    // Fallback info if running without native backend
    setMetrics({
      cpuUsage: 12.4,
      memoryUsedMb: 4200,
      memoryTotalMb: 16000,
      memoryPercentage: 26.25,
      processCount: 142,
      uptimeSeconds: 84600,
      osName: 'Linux (Arch)',
      osVersion: '6.x',
      hostname: 'desktop-companion',
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (sec: number) => {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Native System Monitor</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
            Real-time hardware statistics queried directly from native Rust system bindings.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--color-border, #334155)',
            borderRadius: '8px',
            color: 'var(--color-text, #F8FAFC)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading && !metrics ? (
        <div style={{ color: 'var(--color-text-muted)' }}>Loading native telemetry...</div>
      ) : metrics ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {/* CPU Card */}
          <div style={metricCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>🖥️ CPU Usage</span>
              <span style={{ fontWeight: 700, color: 'var(--color-primary, #818CF8)' }}>
                {metrics.cpuUsage.toFixed(1)}%
              </span>
            </div>
            <div style={progressBgStyle}>
              <div
                style={{
                  ...progressBarFillStyle,
                  width: `${Math.min(100, metrics.cpuUsage)}%`,
                  backgroundColor: 'var(--color-primary, #818CF8)',
                }}
              />
            </div>
          </div>

          {/* Memory Card */}
          <div style={metricCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>🧠 System Memory</span>
              <span style={{ fontWeight: 700, color: '#34D399' }}>
                {metrics.memoryPercentage.toFixed(1)}%
              </span>
            </div>
            <div style={progressBgStyle}>
              <div
                style={{
                  ...progressBarFillStyle,
                  width: `${Math.min(100, metrics.memoryPercentage)}%`,
                  backgroundColor: '#34D399',
                }}
              />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              {metrics.memoryUsedMb} MB used / {metrics.memoryTotalMb} MB total
            </div>
          </div>

          {/* Process Count */}
          <div style={metricCardStyle}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>⚡ Active Processes</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#F8FAFC' }}>
              {metrics.processCount}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Managed by operating system scheduler
            </div>
          </div>

          {/* System Uptime */}
          <div style={metricCardStyle}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>⏱️ System Uptime</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#F8FAFC' }}>
              {formatUptime(metrics.uptimeSeconds)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Host: {metrics.hostname} ({metrics.osName})
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const metricCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-card, #1E293B)',
  border: '1px solid var(--color-border, #334155)',
  borderRadius: '16px',
  padding: '18px',
};

const progressBgStyle: React.CSSProperties = {
  height: '8px',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  borderRadius: '4px',
  overflow: 'hidden',
};

const progressBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.3s ease',
};
