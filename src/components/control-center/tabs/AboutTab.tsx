import React from 'react';

export const AboutTab: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img
          src="/icons/lulu-icon.svg"
          alt="Lulu Mascot"
          style={{ width: '64px', height: '64px', filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.4))' }}
        />
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Lulu Desktop Companion</h2>
          <div style={{ fontSize: '13px', color: 'var(--color-primary, #818CF8)', fontWeight: 600 }}>
            Version 0.1.0 • Offline-First Native Platform
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
          fontSize: '13px',
          lineHeight: '1.6',
          color: 'var(--color-text, #F8FAFC)',
        }}
      >
        <p style={{ margin: '0 0 12px 0' }}>
          <strong>Lulu</strong> is a modern, offline-first, interactive desktop companion engineered from the ground up with Tauri 2, Rust, React, TypeScript, and SQLite.
        </p>
        <p style={{ margin: 0 }}>
          Unlike conventional overlays, Lulu lives in a true native OS transparent frameless window, moves using real OS coordinates, supports complex multi-monitor workspaces, and executes game and behavior logic locally with zero cloud telemetry.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div style={infoBoxStyle}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>🛡️ Security First</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Strict IPC validation and sandboxed plugin limits.
          </div>
        </div>
        <div style={infoBoxStyle}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>⚡ Performance</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Decoupled movement physics and frame pacing safeguards.
          </div>
        </div>
        <div style={infoBoxStyle}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>💾 Local SQLite</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Automated schema migrations and disaster recovery.
          </div>
        </div>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '10px' }}>
        Licensed under the MIT License • Built with pride for companion developers everywhere.
      </div>
    </div>
  );
};

const infoBoxStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-card, #1E293B)',
  border: '1px solid var(--color-border, #334155)',
  borderRadius: '12px',
  padding: '14px',
};
