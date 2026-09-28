import React, { useState } from 'react';
import { useLuluStore } from '../../stores/useLuluStore';
import { DesktopWindowService } from '../../services/desktopWindow';
import { soundService } from '../../services/soundService';
import { PERSONALITY_ARCHETYPES } from '../../features/personality/personalityEngine';
import { PersonalityArchetype } from '../../features/personality/types';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

type MenuCategory = 'all' | 'ai' | 'care' | 'personality' | 'tools' | 'system' | 'shortcuts';

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundService.enabled);

  const {
    feed,
    sleep,
    wander,
    clean,
    interact,
    patPet,
    playWithPet,
    setControlCenterOpen,
    setActiveTab,
    setChatOpen,
    setQuickActionsOpen,
    clearChat,
    sendChatMessage,
    settings,
    updateSettings,
    setPersonality,
    personality,
    isWidgetMode,
    toggleWidgetMode,
  } = useLuluStore();

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const toggleSound = () => {
    soundService.enabled = !soundService.enabled;
    setSoundEnabled(soundService.enabled);
    if (soundService.enabled) {
      soundService.play('chirp', 'ui');
    }
  };

  const recenterPet = async () => {
    await DesktopWindowService.setPosition(100, 100);
  };

  // Safe window bounding calculation (ensures menu fits window cleanly)
  const menuWidth = 248;
  const menuHeight = 308;
  const posX = Math.max(6, Math.min(x, window.innerWidth - menuWidth - 6));
  const posY = Math.max(6, Math.min(y, window.innerHeight - menuHeight - 6));

  const categories: { id: MenuCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '⭐' },
    { id: 'ai', label: 'AI', icon: '💬' },
    { id: 'care', label: 'Care', icon: '🍓' },
    { id: 'personality', label: 'Mood', icon: '🧠' },
    { id: 'tools', label: 'Tools', icon: '🛠️' },
    { id: 'system', label: 'System', icon: '⚙️' },
    { id: 'shortcuts', label: 'Keys', icon: '⌨️' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: posY,
        left: posX,
        width: `${menuWidth}px`,
        maxHeight: `${Math.min(menuHeight, window.innerHeight - 12)}px`,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 122, 0, 0.45)',
        borderRadius: '16px',
        padding: '6px 8px',
        boxShadow: '0 20px 48px rgba(0, 0, 0, 0.8), 0 0 16px rgba(255, 122, 0, 0.15)',
        fontSize: '11px',
        color: 'var(--color-text, #F8FAFC)',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with Title and Close Esc */}
      <div
        style={{
          padding: '4px 6px 8px',
          fontWeight: 700,
          color: 'var(--color-primary, #FF7A00)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>Lulu Actions</span>
          <span style={{ fontSize: '9px', color: '#94A3B8' }}>v0.1.0</span>
        </div>
        <button
          onClick={onClose}
          title="Close (Esc)"
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '1px 4px',
            fontSize: '10px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <span>✕</span>
          <kbd style={kbdStyle}>Esc</kbd>
        </button>
      </div>

      {/* Category Filter Tabs Bar */}
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          padding: '6px 2px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '3px 8px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: activeCategory === cat.id ? 'var(--color-primary, #FF7A00)' : 'rgba(255,255,255,0.06)',
              color: activeCategory === cat.id ? '#FFFFFF' : '#94A3B8',
              fontSize: '10px',
              fontWeight: activeCategory === cat.id ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: activeCategory === cat.id ? '0 2px 6px rgba(255, 122, 0, 0.35)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Scrollable Action List */}
      <div
        className="no-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
        }}
      >
        {/* SHORTCUTS CHEAT SHEET */}
        {activeCategory === 'shortcuts' && (
          <div style={{ padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#818CF8', marginBottom: '2px' }}>
              ⌨️ Desktop Shortcuts
            </div>
            {[
              { key: 'Ctrl+Shift+Space', desc: 'Open / Close Chat' },
              { key: 'Ctrl+Shift+L', desc: 'Quick Actions Dock' },
              { key: 'Ctrl+Shift+C', desc: 'Control Center' },
              { key: 'F', desc: 'Feed Berry (+25)' },
              { key: 'P', desc: 'Pet / Affection' },
              { key: 'W', desc: 'Wander Desktop' },
              { key: 'S', desc: 'Sleep / Rest' },
              { key: 'T', desc: 'Toggle Always on Top' },
              { key: 'M', desc: 'Toggle Audio / Mute' },
              { key: 'H', desc: 'Hide Lulu to Tray' },
              { key: 'Ctrl+Q', desc: 'Quit Application' },
              { key: 'Esc', desc: 'Close Overlay / Menu' },
            ].map((sc) => (
              <div
                key={sc.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '3px 4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '4px',
                }}
              >
                <span style={{ color: '#E2E8F0', fontSize: '10px' }}>{sc.desc}</span>
                <kbd style={kbdStyle}>{sc.key}</kbd>
              </div>
            ))}
          </div>
        )}

        {/* AI & CHAT */}
        {(activeCategory === 'all' || activeCategory === 'ai') && (
          <>
            {activeCategory === 'all' && <div style={categoryHeaderStyle}>💬 AI & Chat</div>}
            <button
              style={{ ...menuItemStyle, color: '#818CF8', fontWeight: 600 }}
              onClick={() => handleAction(() => setChatOpen(true))}
            >
              <span>💬 Chat with Lulu</span>
              <kbd style={kbdStyle}>Ctrl+⇧+Space</kbd>
            </button>
            <button
              style={menuItemStyle}
              onClick={() => handleAction(() => setQuickActionsOpen(true))}
            >
              <span>⚡ Quick Actions</span>
              <kbd style={kbdStyle}>Ctrl+⇧+L</kbd>
            </button>
            <button
              style={menuItemStyle}
              onClick={() =>
                handleAction(() => {
                  setControlCenterOpen(true);
                  setActiveTab('voice');
                })
              }
            >
              <span>🎙️ Voice Settings</span>
            </button>
            <button
              style={menuItemStyle}
              onClick={() => handleAction(() => clearChat())}
            >
              <span>🧹 Clear Chat History</span>
            </button>
          </>
        )}

        {/* CARE & VITALITY */}
        {(activeCategory === 'all' || activeCategory === 'care') && (
          <>
            {activeCategory === 'all' && <div style={categoryHeaderStyle}>🐾 Pet Care & Hub</div>}
            <button
              style={{ ...menuItemStyle, color: 'var(--color-primary, #FF7A00)', fontWeight: 600 }}
              onClick={() =>
                handleAction(() => {
                  setControlCenterOpen(true);
                  setActiveTab('pet_hub');
                })
              }
            >
              <span>🐾 Pet Hub & Customize</span>
              <kbd style={kbdStyle}>Hub</kbd>
            </button>
            <button
              style={menuItemStyle}
              onClick={() => handleAction(() => feed(25))}
            >
              <span>🍓 Feed Berry</span>
              <kbd style={kbdStyle}>F</kbd>
            </button>
            <button
              style={menuItemStyle}
              onClick={() => handleAction(() => interact())}
            >
              <span>💕 Pet & Hug Lulu</span>
            </button>
            <button
              style={menuItemStyle}
              onClick={() => handleAction(() => playWithPet(25))}
            >
              <span>🎾 Play & Affection</span>
              <kbd style={kbdStyle}>P</kbd>
            </button>
            <button
              style={menuItemStyle}
              onClick={() => handleAction(() => wander())}
            >
              <span>🧭 Wander Desktop</span>
              <kbd style={kbdStyle}>W</kbd>
            </button>
            <button
              style={menuItemStyle}
              onClick={() => handleAction(() => sleep())}
            >
              <span>💤 Tuck In / Rest</span>
              <kbd style={kbdStyle}>S</kbd>
            </button>
            <button
              style={menuItemStyle}
              onClick={() => handleAction(() => clean())}
            >
              <span>🧼 Clean & Bath</span>
            </button>
          </>
        )}

        {/* PERSONALITY & MOOD */}
        {(activeCategory === 'all' || activeCategory === 'personality') && (
          <>
            {activeCategory === 'all' && <div style={categoryHeaderStyle}>🧠 Personality</div>}
            {(Object.keys(PERSONALITY_ARCHETYPES) as PersonalityArchetype[]).map((archKey) => {
              const arch = PERSONALITY_ARCHETYPES[archKey];
              const isSelected = personality.id === archKey;
              return (
                <button
                  key={archKey}
                  style={{
                    ...menuItemStyle,
                    color: isSelected ? 'var(--color-primary, #818CF8)' : 'inherit',
                    fontWeight: isSelected ? 700 : 400,
                  }}
                  onClick={() =>
                    handleAction(() => {
                      setPersonality(archKey);
                    })
                  }
                >
                  <span>{arch.icon} {arch.name}</span>
                  {isSelected && <span style={{ fontSize: '9px', color: '#818CF8' }}>● Active</span>}
                </button>
              );
            })}
          </>
        )}

        {/* DESKTOP TOOLS */}
        {(activeCategory === 'all' || activeCategory === 'tools') && (
          <>
            {activeCategory === 'all' && <div style={categoryHeaderStyle}>🛠️ Desktop Tools</div>}
            <button
              style={menuItemStyle}
              onClick={() =>
                handleAction(() => {
                  setChatOpen(true);
                  sendChatMessage('/calc 125 * 8 + 40');
                })
              }
            >
              <span>🧮 Quick Calculator</span>
            </button>
            <button
              style={menuItemStyle}
              onClick={() =>
                handleAction(() => {
                  setChatOpen(true);
                  sendChatMessage('/timer 25 Focus Session');
                })
              }
            >
              <span>⏱️ Pomodoro 25m Timer</span>
            </button>
            <button
              style={menuItemStyle}
              onClick={() =>
                handleAction(() => {
                  setChatOpen(true);
                  sendChatMessage('/note Buy groceries and review pull requests');
                })
              }
            >
              <span>📝 Add Scratch Note</span>
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
              <span>💾 Memory Storage</span>
            </button>
            <button
              style={menuItemStyle}
              onClick={() =>
                handleAction(() => {
                  setControlCenterOpen(true);
                  setActiveTab('diagnostics');
                })
              }
            >
              <span>🩺 Lulu Doctor Check</span>
            </button>
          </>
        )}

        {/* SYSTEM & WINDOW */}
        {(activeCategory === 'all' || activeCategory === 'system') && (
          <>
            {activeCategory === 'all' && <div style={categoryHeaderStyle}>⚙️ System & Window</div>}
            <button
              style={menuItemStyle}
              onClick={() =>
                handleAction(() => updateSettings({ alwaysOnTop: !settings.alwaysOnTop }))
              }
            >
              <span>📌 Always on Top: {settings.alwaysOnTop ? 'ON' : 'OFF'}</span>
              <kbd style={kbdStyle}>T</kbd>
            </button>
            <button
              style={menuItemStyle}
              onClick={() => handleAction(() => toggleSound())}
            >
              <span>{soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF'}</span>
              <kbd style={kbdStyle}>M</kbd>
            </button>
            <button
              style={menuItemStyle}
              onClick={() => handleAction(() => toggleWidgetMode())}
            >
              <span>{isWidgetMode ? '🐾 Pet Mascot Mode' : '📱 Compact Widget Mode'}</span>
              <kbd style={kbdStyle}>W</kbd>
            </button>
            <button
              style={menuItemStyle}
              onClick={() => handleAction(() => recenterPet())}
            >
              <span>📍 Recenter on Screen</span>
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
              <span>⚙️ Control Center</span>
              <kbd style={kbdStyle}>Ctrl+⇧+C</kbd>
            </button>
            <button
              style={{ ...menuItemStyle, color: '#FBBF24' }}
              onClick={() => handleAction(() => DesktopWindowService.hide())}
            >
              <span>👁️ Hide Lulu (Tray)</span>
              <kbd style={kbdStyle}>H</kbd>
            </button>
            <button
              style={{ ...menuItemStyle, color: 'var(--color-danger, #EF4444)' }}
              onClick={() => handleAction(() => DesktopWindowService.exit())}
            >
              <span>🚪 Quit Lulu</span>
              <kbd style={kbdStyle}>Ctrl+Q</kbd>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '5px 8px',
  background: 'none',
  border: 'none',
  borderRadius: '6px',
  color: 'inherit',
  fontSize: '11px',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'all 0.12s ease',
};

const categoryHeaderStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'var(--color-primary, #FF7A00)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: '6px 8px 3px',
  marginTop: '4px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
};

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 4px',
  fontSize: '9px',
  fontFamily: 'monospace',
  color: '#94A3B8',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '3px',
  marginLeft: 'auto',
  flexShrink: 0,
};
