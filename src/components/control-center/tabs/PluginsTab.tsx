import React, { useState } from 'react';

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: string[];
  enabled: boolean;
}

export const PluginsTab: React.FC = () => {
  const [plugins, setPlugins] = useState<PluginManifest[]>([
    {
      id: 'plugin-weather',
      name: 'Starlight Weather Companion',
      version: '1.0.0',
      author: 'Lulu Community',
      description: 'Provides ambient cloud & constellation weather reactions for Lulu.',
      permissions: ['UI', 'notifications'],
      enabled: true,
    },
    {
      id: 'plugin-pomodoro',
      name: 'Pomodoro Productivity Timer',
      version: '1.1.0',
      author: 'Core Team',
      description: 'Synchronizes 25-minute focus intervals and 5-minute playful break stretches.',
      permissions: ['UI', 'character', 'notifications'],
      enabled: true,
    },
    {
      id: 'plugin-synthwave',
      name: 'Synthwave Theme & Sounds Pack',
      version: '0.9.0',
      author: 'Aesthetic Audio',
      description: 'Adds 80s neon color palettes and retro chime audio synthesizer presets.',
      permissions: ['UI', 'storage'],
      enabled: false,
    },
  ]);

  const togglePlugin = (id: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Plugin Ecosystem & Sandbox</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Extensible plugin architecture with permission-isolated runtime boundaries.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {plugins.map((pl) => (
          <div
            key={pl.id}
            style={{
              backgroundColor: 'var(--color-bg-card, #1E293B)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{pl.name}</span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>v{pl.version} by {pl.author}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.4', marginBottom: '8px' }}>
                {pl.description}
              </div>

              {/* Permissions list */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {pl.permissions.map((perm) => (
                  <span
                    key={perm}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: 'var(--color-primary, #818CF8)',
                      fontWeight: 600,
                    }}
                  >
                    perm: {perm}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => togglePlugin(pl.id)}
              style={{
                padding: '6px 16px',
                backgroundColor: pl.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: pl.enabled ? '1px solid #10B981' : '1px solid var(--color-border, #334155)',
                borderRadius: '8px',
                color: pl.enabled ? '#34D399' : 'var(--color-text-muted)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {pl.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
