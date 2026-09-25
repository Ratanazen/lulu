import React, { useState } from 'react';
import { THEMES } from '../../../themes';
import { useLuluStore } from '../../../stores/useLuluStore';
import { ThemeId } from '../../../types';

export const ThemesTab: React.FC = () => {
  const { settings, setTheme, speak } = useLuluStore();
  const [customBg, setCustomBg] = useState('#0B0F19');
  const [customCard, setCustomCard] = useState('#161F30');
  const [customPrimary, setCustomPrimary] = useState('#818CF8');
  const [customBorder, setCustomBorder] = useState('#2A3852');
  const [customText, setCustomText] = useState('#F8FAFC');

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

      {/* Custom Theme Studio */}
      <div
        style={{
          marginTop: '12px',
          padding: '20px',
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          borderRadius: '16px',
          border: '1px solid var(--color-border, #334155)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600 }}>Custom Theme Studio</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
              Design and apply your personalized custom color palette in real-time.
            </p>
          </div>
          <button
            onClick={() => {
              const root = document.documentElement;
              root.style.setProperty('--color-bg', customBg);
              root.style.setProperty('--color-bg-card', customCard);
              root.style.setProperty('--color-primary', customPrimary);
              root.style.setProperty('--color-border', customBorder);
              root.style.setProperty('--color-text', customText);
              speak('Applied your custom color palette! 🎨');
            }}
            style={{
              backgroundColor: customPrimary,
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            Apply Custom Palette
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <div style={customInputGroupStyle}>
            <label style={labelStyle}>Background</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={customBg}
                onChange={(e) => setCustomBg(e.target.value)}
                style={colorPickerStyle}
              />
              <span style={codeStyle}>{customBg}</span>
            </div>
          </div>

          <div style={customInputGroupStyle}>
            <label style={labelStyle}>Card Surface</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={customCard}
                onChange={(e) => setCustomCard(e.target.value)}
                style={colorPickerStyle}
              />
              <span style={codeStyle}>{customCard}</span>
            </div>
          </div>

          <div style={customInputGroupStyle}>
            <label style={labelStyle}>Primary Accent</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={customPrimary}
                onChange={(e) => setCustomPrimary(e.target.value)}
                style={colorPickerStyle}
              />
              <span style={codeStyle}>{customPrimary}</span>
            </div>
          </div>

          <div style={customInputGroupStyle}>
            <label style={labelStyle}>Border</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={customBorder}
                onChange={(e) => setCustomBorder(e.target.value)}
                style={colorPickerStyle}
              />
              <span style={codeStyle}>{customBorder}</span>
            </div>
          </div>

          <div style={customInputGroupStyle}>
            <label style={labelStyle}>Text Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                style={colorPickerStyle}
              />
              <span style={codeStyle}>{customText}</span>
            </div>
          </div>
        </div>
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

const customInputGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 500,
  color: '#94A3B8',
};

const codeStyle: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'monospace',
  color: '#CBD5E1',
};

const colorPickerStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  backgroundColor: 'transparent',
};
