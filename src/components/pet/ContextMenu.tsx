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
    sleep,
    wander,
    setControlCenterOpen,
    setActiveTab,
    setChatOpen,
    setQuickActionsOpen,
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
        top: Math.min(y, window.innerHeight - 340),
        left: Math.min(x, window.innerWidth - 190),
        zIndex: 9999,
        backgroundColor: 'var(--color-bg-card, #1E293B)',
        border: '1px solid var(--color-border, #334155)',
        borderRadius: '14px',
        padding: '6px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5)',
        minWidth: '180px',
        fontSize: '12px',
        color: 'var(--color-text, #F8FAFC)',
        userSelect: 'none',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ padding: '6px 8px', fontWeight: 700, color: 'var(--color-primary, #818CF8)', borderBottom: '1px solid var(--color-border, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Lulu AI Pet</span>
        <span style={{ fontSize: '10px', color: '#94A3B8' }}>v0.3.0</span>
      </div>

      <div style={{ marginTop: '4px' }}>
        <button
          style={{ ...menuItemStyle, color: '#818CF8', fontWeight: 600 }}
          onClick={() => handleAction(() => setChatOpen(true))}
        >
          💬 Chat with Lulu
        </button>
        <button
          style={menuItemStyle}
          onClick={() => handleAction(() => setQuickActionsOpen(true))}
        >
          ⚡ Quick Actions
        </button>
      </div>

      <div style={{ height: '1px', backgroundColor: 'var(--color-border, #334155)', margin: '4px 0' }} />

      <div>
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
          onClick={() => handleAction(() => wander())}
        >
          🧭 Wander Desktop
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
              setActiveTab('behavior');
            })
          }
        >
          🧠 Personality
        </button>
        <button
          style={menuItemStyle}
          onClick={() =>
            handleAction(() => {
              setControlCenterOpen(true);
              setActiveTab('memory');
            })
          }
        >
          💾 Memory Viewer
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
          ⚙️ Settings
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
