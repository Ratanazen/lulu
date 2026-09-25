import React from 'react';
import { THEMES } from '../../../themes';
import { useLuluStore } from '../../../stores/useLuluStore';
import { ThemeId } from '../../../types';

export const ThemesTab: React.FC = () => {
  const { settings, setTheme, speak } = useLuluStore();

  const handleSelectTheme = (id: ThemeId) => {
    setTheme(id);
    speak(`Applied ${THEMES[id].name} theme! ✨`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Theme Engine</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Choose from 10 distinct, data-driven color themes engineered for Lulu.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        {(Object.keys(THEMES) as ThemeId[]).map((themeKey) => {
          const theme = THEMES[themeKey];
          const isSelected = settings.theme === themeKey;

          return (
            <div
              key={themeKey}
              onClick={() => handleSelectTheme(themeKey)}
              style={{
                backgroundColor: theme.colors.bgCard,
                border: isSelected
                  ? `2px solid ${theme.colors.primary}`
                  : `1px solid ${theme.colors.border}`,
                borderRadius: '16px',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: isSelected ? `0 0 16px ${theme.colors.glow}` : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '15px', color: theme.colors.text }}>
                  {theme.name}
                </span>
                {isSelected && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: theme.colors.primary,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    ACTIVE
                  </span>
                )}
              </div>

              {/* Color Swatches */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ ...swatchStyle, backgroundColor: theme.colors.bg }} title="Background" />
                <div style={{ ...swatchStyle, backgroundColor: theme.colors.primary }} title="Primary" />
                <div style={{ ...swatchStyle, backgroundColor: theme.colors.accent }} title="Accent" />
                <div style={{ ...swatchStyle, backgroundColor: theme.colors.success }} title="Success" />
                <div style={{ ...swatchStyle, backgroundColor: theme.colors.danger }} title="Danger" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const swatchStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
};
