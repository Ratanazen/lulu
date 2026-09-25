import React, { useEffect, useState } from 'react';
import { useLuluStore } from '../../../stores/useLuluStore';
import { MonitorService } from '../../../services/monitorService';
import { MonitorInfo } from '../../../types';

export const ScreenMapTab: React.FC = () => {
  const {
    monitors,
    setMonitors,
    currentPosition,
    moveTo,
    perchOnTaskbar,
    dockToEdge,
    sendToMonitor,
    settings,
    updateSettings,
    speak,
  } = useLuluStore();

  const [loading, setLoading] = useState(false);

  const refreshMonitors = async () => {
    setLoading(true);
    try {
      const mons = await MonitorService.getMonitors();
      setMonitors(mons);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMonitors();
  }, []);

  // Compute bounding box for map canvas
  const minX = Math.min(...monitors.map((m) => m.x), 0);
  const maxX = Math.max(...monitors.map((m) => m.x + m.width), 1920);
  const minY = Math.min(...monitors.map((m) => m.y), 0);
  const maxY = Math.max(...monitors.map((m) => m.y + m.height), 1080);

  const totalWidth = maxX - minX || 1920;
  const totalHeight = maxY - minY || 1080;

  const mapCanvasWidth = 560;
  const mapScale = mapCanvasWidth / Math.max(totalWidth, 1920);
  const mapCanvasHeight = Math.max(220, Math.round(totalHeight * mapScale) + 20);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert map canvas coords back to native virtual desktop coords
    const nativeX = Math.round(minX + clickX / mapScale);
    const nativeY = Math.round(minY + clickY / mapScale);

    moveTo({ x: nativeX, y: nativeY });
    speak(`Moving to X: ${nativeX}, Y: ${nativeY} ✨`);
  };

  const handleSetHome = (m: MonitorInfo) => {
    const homeX = m.workAreaX + Math.round(m.workAreaWidth / 2) - 120;
    const homeY = m.workAreaY + m.workAreaHeight - 300;
    updateSettings({ homeMonitorId: m.id, homeX, homeY });
    speak(`Home position set to ${m.name}! 🏠`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Multi-Monitor Screen Map</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
            Real-time native display layout with interactive companion dispatch.
          </p>
        </div>
        <button
          onClick={refreshMonitors}
          disabled={loading}
          style={{
            padding: '6px 14px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--color-border, #334155)',
            borderRadius: '8px',
            color: 'var(--color-text, #F8FAFC)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Displays'}
        </button>
      </div>

      {/* Screen Map Canvas Area */}
      <div
        style={{
          backgroundColor: '#090D16',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          onClick={handleMapClick}
          style={{
            position: 'relative',
            width: `${mapCanvasWidth}px`,
            height: `${mapCanvasHeight}px`,
            backgroundColor: '#0F172A',
            border: '1px dashed #334155',
            borderRadius: '10px',
            cursor: 'crosshair',
            overflow: 'hidden',
          }}
          title="Click anywhere to dispatch Lulu there!"
        >
          {/* Render each monitor rectangle */}
          {monitors.map((m) => {
            const rx = (m.x - minX) * mapScale;
            const ry = (m.y - minY) * mapScale;
            const rw = m.width * mapScale;
            const rh = m.height * mapScale;

            return (
              <div
                key={m.id}
                style={{
                  position: 'absolute',
                  left: `${rx}px`,
                  top: `${ry}px`,
                  width: `${rw}px`,
                  height: `${rh}px`,
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  border: m.primary ? '2px solid #818CF8' : '1px solid #475569',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '11px', color: '#F8FAFC' }}>
                  {m.name} {m.primary && '(Primary)'}
                </div>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                  {m.width}x{m.height} ({m.scaleFactor}x)
                </div>
              </div>
            );
          })}

          {/* Render Lulu Marker on Map */}
          <div
            style={{
              position: 'absolute',
              left: `${(currentPosition.x - minX) * mapScale}px`,
              top: `${(currentPosition.y - minY) * mapScale}px`,
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#F59E0B',
              border: '2px solid #FFFFFF',
              boxShadow: '0 0 10px #F59E0B',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              transition: 'all 0.1s linear',
            }}
            title="Lulu is here!"
          />
        </div>
      </div>

      {/* Quick Docking & Spatial Awareness */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px' }}>Spatial Docking & Perching</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Quickly anchor Lulu to taskbars or monitor screen edges
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={perchOnTaskbar} style={quickBtnStyle}>
            🪑 Perch Bottom
          </button>
          <button onClick={() => dockToEdge('left')} style={quickBtnStyle}>
            ⬅️ Left Edge
          </button>
          <button onClick={() => dockToEdge('right')} style={quickBtnStyle}>
            ➡️ Right Edge
          </button>
          <button onClick={() => dockToEdge('top')} style={quickBtnStyle}>
            ⬆️ Top Edge
          </button>
        </div>
      </div>

      {/* Monitor List & Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ margin: 0, fontSize: '14px' }}>Detected Displays ({monitors.length})</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {monitors.map((m) => (
            <div
              key={m.id}
              style={{
                backgroundColor: 'var(--color-bg-card, #1E293B)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>
                  {m.name} {m.primary && '★'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {m.width}x{m.height} @ X:{m.x}, Y:{m.y}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => sendToMonitor(m.id)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'rgba(129, 140, 248, 0.15)',
                    border: '1px solid var(--color-primary, #818CF8)',
                    borderRadius: '6px',
                    color: 'var(--color-primary, #818CF8)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                  title="Send Lulu over to this display"
                >
                  🚀 Dispatch
                </button>
                <button
                  onClick={() => handleSetHome(m)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--color-border, #334155)',
                    borderRadius: '6px',
                    color: 'var(--color-text, #F8FAFC)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Set as Home
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const quickBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid var(--color-border, #334155)',
  borderRadius: '8px',
  color: 'var(--color-text, #F8FAFC)',
  fontSize: '12px',
  cursor: 'pointer',
};
