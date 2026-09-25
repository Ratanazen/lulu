import React, { useState } from 'react';
import { pluginManager, LuluPlugin } from '../../../plugins/PluginManager';
import { useLuluStore } from '../../../stores/useLuluStore';

export const PluginsTab: React.FC = () => {
  const [plugins, setPlugins] = useState<LuluPlugin[]>(() => pluginManager.getAllPlugins());
  const { speak } = useLuluStore();

  const handleToggle = async (plugin: LuluPlugin) => {
    if (plugin.enabled) {
      await pluginManager.disablePlugin(plugin.id);
      speak(`Disabled ${plugin.name}`);
    } else {
      await pluginManager.enablePlugin(plugin.id);
      speak(`Enabled ${plugin.name}! 🧩`);
    }
    setPlugins(pluginManager.getAllPlugins());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Community Plugin Ecosystem</h3>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              color: '#4ADE80',
              fontWeight: 600,
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            ACTIVE SANDBOX ENGINE
          </span>
        </div>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Modular community plugins with capability-gated permissions and lifecycle isolation.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {plugins.map((pl) => (
          <div
            key={pl.id}
            style={{
              backgroundColor: 'var(--color-bg-card, #1E293B)',
              border: pl.enabled ? '1px solid var(--color-primary, #818CF8)' : '1px solid var(--color-border, #334155)',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: pl.enabled ? '0 0 12px rgba(129, 140, 248, 0.15)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ flex: 1, paddingRight: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>{pl.name}</span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>v{pl.version} by {pl.author}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #94A3B8)', lineHeight: '1.4', marginBottom: '8px' }}>
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
              onClick={() => handleToggle(pl)}
              style={{
                padding: '8px 16px',
                backgroundColor: pl.enabled ? '#10B981' : 'rgba(255, 255, 255, 0.08)',
                border: pl.enabled ? '1px solid #059669' : '1px solid var(--color-border, #334155)',
                borderRadius: '8px',
                color: pl.enabled ? '#fff' : '#94A3B8',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {pl.enabled ? 'Active ✓' : 'Enable'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

