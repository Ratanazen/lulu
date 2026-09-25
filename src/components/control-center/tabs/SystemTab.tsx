import React, { useEffect, useState } from 'react';
import { SystemMetrics } from '../../../types';
import { CapabilityService, RuntimeCapability } from '../../../services/capabilityService';

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
  const [capabilities, setCapabilities] = useState<RuntimeCapability[]>([]);
  const [capLoading, setCapLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchCapabilities = async () => {
    setCapLoading(true);
    try {
      const caps = await CapabilityService.getCapabilities();
      setCapabilities(caps);
    } finally {
      setCapLoading(false);
    }
  };

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
    fetchCapabilities();
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

      {/* Machine-Readable Capability Matrix */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#F8FAFC' }}>
              Machine-Readable Capability Matrix ({capabilities.length})
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #94A3B8)' }}>
              Authoritative runtime capabilities evaluated live by Rust CapabilityManager.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '12px',
              }}
            >
              <option value="all">All Categories</option>
              <option value="pet">Pet Window</option>
              <option value="notifications">Notifications</option>
              <option value="music">Music</option>
              <option value="lyrics">Lyrics</option>
              <option value="ai">AI</option>
              <option value="voice">Voice</option>
              <option value="tools">Tools</option>
              <option value="context">Context</option>
              <option value="storage">Storage</option>
              <option value="system">System</option>
            </select>
            <button
              onClick={fetchCapabilities}
              disabled={capLoading}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid #818CF8',
                borderRadius: '8px',
                color: '#818CF8',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {capLoading ? 'Refreshing...' : '🔄 Refresh Matrix'}
            </button>
          </div>
        </div>

        {/* Capability Table */}
        <div style={{ overflowX: 'auto', maxHeight: '340px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid #334155',
                  textAlign: 'left',
                  color: '#94A3B8',
                  position: 'sticky',
                  top: 0,
                  backgroundColor: 'var(--color-bg-card, #1E293B)',
                  zIndex: 2,
                }}
              >
                <th style={{ padding: '8px 10px' }}>Capability</th>
                <th style={{ padding: '8px 10px' }}>Category</th>
                <th style={{ padding: '8px 10px' }}>Runtime Status</th>
                <th style={{ padding: '8px 10px' }}>Privacy</th>
                <th style={{ padding: '8px 10px' }}>Fallback</th>
                <th style={{ padding: '8px 10px' }}>Details / Reason</th>
              </tr>
            </thead>
            <tbody>
              {capabilities
                .filter((c) =>
                  categoryFilter === 'all'
                    ? true
                    : c.category.toLowerCase() === categoryFilter.toLowerCase()
                )
                .map((cap) => (
                  <tr key={cap.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#F8FAFC' }}>
                      <div>{cap.name}</div>
                      <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>
                        {cap.id}
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#94A3B8' }}>{cap.category}</td>
                    <td style={{ padding: '8px 10px' }}>{renderStatusBadge(cap.status)}</td>
                    <td style={{ padding: '8px 10px' }}>{renderPrivacyBadge(cap.privacy)}</td>
                    <td
                      style={{
                        padding: '8px 10px',
                        color: '#CBD5E1',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                      }}
                    >
                      {cap.fallback || 'none'}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#94A3B8', fontSize: '11px' }}>
                      {cap.reason || 'Operational'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const renderStatusBadge = (status: string) => {
  switch (status) {
    case 'supported':
      return (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: 'rgba(52, 211, 153, 0.15)',
            color: '#34D399',
            border: '1px solid rgba(52, 211, 153, 0.3)',
          }}
        >
          ✓ Supported
        </span>
      );
    case 'partial':
      return (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: 'rgba(251, 191, 36, 0.15)',
            color: '#FBBF24',
            border: '1px solid rgba(251, 191, 36, 0.3)',
          }}
        >
          ~ Partial
        </span>
      );
    case 'requires_dependency':
      return (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: 'rgba(96, 165, 250, 0.15)',
            color: '#60A5FA',
            border: '1px solid rgba(96, 165, 250, 0.3)',
          }}
        >
          📦 Requires Dependency
        </span>
      );
    case 'requires_permission':
      return (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: 'rgba(192, 132, 252, 0.15)',
            color: '#C084FC',
            border: '1px solid rgba(192, 132, 252, 0.3)',
          }}
        >
          🔒 Permission Required
        </span>
      );
    case 'disabled':
      return (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: 'rgba(148, 163, 184, 0.15)',
            color: '#94A3B8',
            border: '1px solid rgba(148, 163, 184, 0.3)',
          }}
        >
          ○ Disabled
        </span>
      );
    default:
      return (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: 'rgba(248, 113, 113, 0.15)',
            color: '#F87171',
            border: '1px solid rgba(248, 113, 113, 0.3)',
          }}
        >
          ✕ Unsupported
        </span>
      );
  }
};

const renderPrivacyBadge = (privacy: string) => {
  switch (privacy) {
    case 'local_only':
      return <span style={{ fontSize: '11px', color: '#34D399' }}>🔒 Local Only</span>;
    case 'user_controlled':
      return <span style={{ fontSize: '11px', color: '#38BDF8' }}>👤 User Controlled</span>;
    case 'requires_permission':
      return <span style={{ fontSize: '11px', color: '#FBBF24' }}>🛡️ Explicit Permission</span>;
    default:
      return <span style={{ fontSize: '11px', color: '#F87171' }}>🌐 Network Required</span>;
  }
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
