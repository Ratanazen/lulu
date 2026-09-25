import React from 'react';

interface PluginSpec {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: string[];
  status: 'Planned' | 'Specification';
}

export const PluginsTab: React.FC = () => {
  const pluginSpecs: PluginSpec[] = [
    {
      id: 'plugin-weather',
      name: 'Starlight Weather Companion',
      version: '1.0.0',
      author: 'Lulu Community',
      description: 'Planned extension to provide ambient weather and celestial constellation reactions.',
      permissions: ['UI', 'notifications'],
      status: 'Specification',
    },
    {
      id: 'plugin-pomodoro',
      name: 'Pomodoro Productivity Timer',
      version: '1.1.0',
      author: 'Core Architecture',
      description: 'Planned timer to sync focus intervals with gentle break notifications.',
      permissions: ['UI', 'character', 'notifications'],
      status: 'Specification',
    },
    {
      id: 'plugin-synthwave',
      name: 'Synthwave Theme & Audio Pack',
      version: '0.9.0',
      author: 'Aesthetic Audio',
      description: 'Planned custom theme palette and retro chime synthesizer presets.',
      permissions: ['UI', 'storage'],
      status: 'Specification',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Plugin Ecosystem & Sandbox</h3>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              color: '#FBBF24',
              fontWeight: 600,
              border: '1px solid rgba(234, 179, 8, 0.3)',
            }}
          >
            [POST-MVP ARCHITECTURE PREVIEW]
          </span>
        </div>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Extensible plugin architecture with permission-isolated runtime boundaries. Active sandboxed runtime execution is scheduled for Post-MVP.
        </p>
      </div>

      {/* Architecture Spec Notice */}
      <div
        style={{
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '16px',
          padding: '16px 20px',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          lineHeight: '1.5',
        }}
      >
        <div style={{ fontWeight: 600, color: 'var(--color-primary, #818CF8)', marginBottom: '4px' }}>
          📐 Developer Specification Ready
        </div>
        See <code style={{ color: '#E2E8F0', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>docs/PLUGIN_API.md</code> for the full manifest format and permission boundary definitions. No third-party untrusted code is executed in this build.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {pluginSpecs.map((pl) => (
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
            <div style={{ flex: 1, paddingRight: '16px' }}>
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

            <div
              style={{
                padding: '6px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '8px',
                color: '#94A3B8',
                fontWeight: 600,
                fontSize: '11px',
                whiteSpace: 'nowrap',
              }}
            >
              Spec Preview
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

