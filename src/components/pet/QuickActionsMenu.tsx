import React from 'react';
import { 
  MessageSquare, 
  Lightbulb, 
  Code2, 
  Timer, 
  Calculator, 
  Gamepad2, 
  Brain, 
  Settings, 
  X,
  Sparkles
} from 'lucide-react';
import { useLuluStore } from '../../stores/useLuluStore';

export const QuickActionsMenu: React.FC = () => {
  const {
    quickActionsOpen,
    setQuickActionsOpen,
    setChatOpen,
    sendChatMessage,
    setControlCenterOpen,
    setActiveTab,
  } = useLuluStore();

  if (!quickActionsOpen) return null;

  const actions = [
    {
      icon: <MessageSquare size={16} color="#818CF8" />,
      label: 'Open Chat',
      shortcut: 'Ctrl+⇧+Space',
      desc: 'Talk with Lulu',
      onClick: () => {
        setChatOpen(true);
        setQuickActionsOpen(false);
      },
    },
    {
      icon: <Lightbulb size={16} color="#FBBF24" />,
      label: 'Explain Concept',
      shortcut: 'Ask AI',
      desc: 'Ask Lulu to explain simply',
      onClick: () => {
        setChatOpen(true);
        setQuickActionsOpen(false);
        sendChatMessage('Explain how neural networks learn in 3 simple bullet points.');
      },
    },
    {
      icon: <Code2 size={16} color="#34D399" />,
      label: 'Fix Code',
      shortcut: 'Dev Pair',
      desc: 'Senior dev pair assistance',
      onClick: () => {
        setChatOpen(true);
        setQuickActionsOpen(false);
        sendChatMessage('Help me review and optimize this code snippet:');
      },
    },
    {
      icon: <Timer size={16} color="#F472B6" />,
      label: '25m Pomodoro',
      shortcut: '/timer 25',
      desc: 'Start focused work sprint',
      onClick: () => {
        setChatOpen(true);
        setQuickActionsOpen(false);
        sendChatMessage('/timer 25 Deep Work Focus');
      },
    },
    {
      icon: <Calculator size={16} color="#60A5FA" />,
      label: 'Quick Calc',
      shortcut: '/calc',
      desc: 'Math & arithmetic tool',
      onClick: () => {
        setChatOpen(true);
        setQuickActionsOpen(false);
        sendChatMessage('/calc 128 * 16 + 256');
      },
    },
    {
      icon: <Gamepad2 size={16} color="#A78BFA" />,
      label: 'Mini-Games',
      shortcut: 'P',
      desc: 'Play offline games',
      onClick: () => {
        setQuickActionsOpen(false);
        setControlCenterOpen(true);
        setActiveTab('games');
      },
    },
    {
      icon: <Brain size={16} color="#FB7185" />,
      label: 'Personalities',
      shortcut: 'Mood',
      desc: 'Switch companion archetype',
      onClick: () => {
        setQuickActionsOpen(false);
        setControlCenterOpen(true);
        setActiveTab('behavior');
      },
    },
    {
      icon: <Settings size={16} color="#94A3B8" />,
      label: 'Settings',
      shortcut: 'Ctrl+⇧+C',
      desc: 'AI, themes, storage',
      onClick: () => {
        setQuickActionsOpen(false);
        setControlCenterOpen(true);
        setActiveTab('overview');
      },
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '320px',
        maxWidth: 'calc(100vw - 16px)',
        maxHeight: 'calc(100vh - 16px)',
        backgroundColor: 'var(--color-bg-card, #1E293B)',
        border: '1px solid var(--color-border, #334155)',
        borderRadius: '18px',
        padding: '14px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
        zIndex: 9999,
        color: 'var(--color-text, #F8FAFC)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--color-border, #334155)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px', color: '#818CF8' }}>
          <Sparkles size={16} />
          <span>Quick Actions</span>
          <kbd style={kbdStyle}>Ctrl+⇧+L</kbd>
        </div>
        <button
          type="button"
          onClick={() => setQuickActionsOpen(false)}
          title="Close (Esc)"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted, #94A3B8)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <X size={15} />
          <kbd style={kbdStyle}>Esc</kbd>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {actions.map((act) => (
          <button
            key={act.label}
            type="button"
            onClick={act.onClick}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '3px',
              padding: '8px 10px',
              backgroundColor: 'var(--color-bg, #0F172A)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '12px',
              color: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              position: 'relative',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#818CF8')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--color-border, #334155)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {act.icon}
                <span style={{ fontSize: '11px', fontWeight: 700 }}>{act.label}</span>
              </div>
              {act.shortcut && <kbd style={kbdStyle}>{act.shortcut}</kbd>}
            </div>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted, #94A3B8)' }}>
              {act.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 4px',
  fontSize: '8px',
  fontFamily: 'monospace',
  color: '#94A3B8',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '3px',
};
