import React from 'react';
import { useLuluStore } from '../../stores/useLuluStore';
import { DesktopWindowService } from '../../services/desktopWindow';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose }) => {
  const {
    feed,
    playGame,
    clean,
    sleep,
    wander,
    goHome,
    setControlCenterOpen,
    setActiveTab,
    settings,
    updateSettings,
  } = useLuluStore();

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: Math.min(y, window.innerHeight - 260),
        left: Math.min(x, window.innerWidth - 180),
        zIndex: 9999,
        backgroundColor: 'var(--color-bg-card, #1E293B)',
        border: '1px solid var(--color-border, #334155)',
        borderRadius: '12px',
        padding: '6px',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
        minWidth: '170px',
        fontSize: '12px',
        color: 'var(--color-text, #F8FAFC)',
        userSelect: 'none',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--color-primary, #818CF8)', borderBottom: '1px solid var(--color-border, #334155)' }}>
        Lulu Companion
      </div>

      <div style={{ marginTop: '4px' }}>
        <button
          style={menuItemStyle}
          onClick={() => handleAction(() => feed(25))}
        >
          🍓 Feed Berry
        </button>
        <button
          style={menuItemStyle}
          onClick={() => handleAction(() => playGame(25))}
        >
          🎾 Play Game
        </button>
        <button
          style={menuItemStyle}
          onClick={() => handleAction(() => clean())}
        >
          ✨ Groom & Clean
        </button>
        <button
          style={menuItemStyle}
          onClick={() => handleAction(() => sleep())}
        >
          💤 Tuck In / Rest
        </button>
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--color-border, #334155)', margin: '4px 0' }} />

      <div>
        <button
          style={menuItemStyle}
          onClick={() => handleAction(() => wander())}
        >
          🧭 Wander Desktop
        </button>
        <button
          style={menuItemStyle}
          onClick={() => handleAction(() => goHome())}
        >
          🏠 Go to Home
        </button>
        <button
          style={menuItemStyle}
          onClick={() =>
            handleAction(() => {
              setControlCenterOpen(true);
              setActiveTab('games');
            })
          }
        >
          🎮 Play Mini-Games
        </button>
        <button
          style={menuItemStyle}
          onClick={() =>
            handleAction(() => {
              setControlCenterOpen(true);
              setActiveTab('overview');
            })
          }
        >
          ⚙️ Control Center
        </button>
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--color-border, #334155)', margin: '4px 0' }} />

      <div>
        <button
          style={menuItemStyle}
          onClick={() =>
            handleAction(() => updateSettings({ alwaysOnTop: !settings.alwaysOnTop }))
          }
        >
          📌 Always on Top: {settings.alwaysOnTop ? 'ON' : 'OFF'}
        </button>
        <button
          style={{ ...menuItemStyle, color: 'var(--color-danger, #EF4444)' }}
          onClick={() => handleAction(() => DesktopWindowService.hide())}
        >
          👁️ Hide Lulu (Use Tray)
        </button>
      </div>
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '6px 10px',
  background: 'none',
  border: 'none',
  borderRadius: '6px',
  color: 'inherit',
  fontSize: '12px',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background 0.15s ease',
};
