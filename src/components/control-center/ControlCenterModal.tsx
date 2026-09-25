import React from 'react';
import { useLuluStore } from '../../stores/useLuluStore';
const OverviewTab = React.lazy(() => import('./tabs/OverviewTab').then((m) => ({ default: m.OverviewTab })));
const CharacterTab = React.lazy(() => import('./tabs/CharacterTab').then((m) => ({ default: m.CharacterTab })));
const BehaviorTab = React.lazy(() => import('./tabs/BehaviorTab').then((m) => ({ default: m.BehaviorTab })));
const NeedsTab = React.lazy(() => import('./tabs/NeedsTab').then((m) => ({ default: m.NeedsTab })));
const GamesTab = React.lazy(() => import('./tabs/GamesTab').then((m) => ({ default: m.GamesTab })));
const MusicTab = React.lazy(() => import('./tabs/MusicTab').then((m) => ({ default: m.MusicTab })));
const ThemesTab = React.lazy(() => import('./tabs/ThemesTab').then((m) => ({ default: m.ThemesTab })));
const ScreenMapTab = React.lazy(() => import('./tabs/ScreenMapTab').then((m) => ({ default: m.ScreenMapTab })));
const NotificationsTab = React.lazy(() => import('./tabs/NotificationsTab').then((m) => ({ default: m.NotificationsTab })));
const PerformanceTab = React.lazy(() => import('./tabs/PerformanceTab').then((m) => ({ default: m.PerformanceTab })));
const SystemTab = React.lazy(() => import('./tabs/SystemTab').then((m) => ({ default: m.SystemTab })));
const DeveloperTab = React.lazy(() => import('./tabs/DeveloperTab').then((m) => ({ default: m.DeveloperTab })));
const DiagnosticsTab = React.lazy(() => import('./tabs/DiagnosticsTab').then((m) => ({ default: m.DiagnosticsTab })));
const PrivacyStorageTab = React.lazy(() => import('./tabs/PrivacyStorageTab').then((m) => ({ default: m.PrivacyStorageTab })));
const PluginsTab = React.lazy(() => import('./tabs/PluginsTab').then((m) => ({ default: m.PluginsTab })));
const AboutTab = React.lazy(() => import('./tabs/AboutTab').then((m) => ({ default: m.AboutTab })));
const AIChatTab = React.lazy(() => import('./tabs/AIChatTab').then((m) => ({ default: m.AIChatTab })));
const MemoryTab = React.lazy(() => import('./tabs/MemoryTab').then((m) => ({ default: m.MemoryTab })));
const VoiceTab = React.lazy(() => import('./tabs/VoiceTab').then((m) => ({ default: m.VoiceTab })));
const AgentsTab = React.lazy(() => import('./tabs/AgentsTab').then((m) => ({ default: m.AgentsTab })));

const TabFallback: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '12px', color: '#94A3B8' }}>
    <div style={{ width: '28px', height: '28px', border: '3px solid rgba(129, 140, 248, 0.2)', borderTopColor: '#818CF8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <span style={{ fontSize: '13px' }}>Loading Tab...</span>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

export const ControlCenterModal: React.FC = () => {
  const { controlCenterOpen, setControlCenterOpen, activeTab, setActiveTab } = useLuluStore();

  if (!controlCenterOpen) return null;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'ai_chat', label: 'AI & Models', icon: '🤖' },
    { id: 'agents', label: 'AI Agents & Teams', icon: '👥' },
    { id: 'memory', label: 'Memory Storage', icon: '💾' },
    { id: 'voice', label: 'Voice & Speech', icon: '🎙️' },
    { id: 'character', label: 'Character Studio', icon: '🎨' },
    { id: 'behavior', label: 'Behavior & Personality', icon: '🧠' },
    { id: 'needs', label: 'Needs & Vitality', icon: '💖' },
    { id: 'games', label: 'Mini-Games', icon: '🎮' },
    { id: 'music', label: 'Music Reactions', icon: '🎵' },
    { id: 'themes', label: 'Theme Engine', icon: '🌈' },
    { id: 'screen_map', label: 'Screen Map', icon: '🗺️' },
    { id: 'notifications', label: 'Achievements', icon: '🏆' },
    { id: 'performance', label: 'Performance & FPS', icon: '⚡' },
    { id: 'system', label: 'System Monitor', icon: '🖥️' },
    { id: 'developer', label: 'Developer Tools', icon: '🛠️' },
    { id: 'diagnostics', label: 'Lulu Doctor', icon: '🩺' },
    { id: 'privacy', label: 'Privacy & Storage', icon: '🔒' },
    { id: 'plugins', label: 'Plugins', icon: '🧩' },
    { id: 'about', label: 'About Lulu', icon: '✨' },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'ai_chat': return <AIChatTab />;
      case 'agents': return <AgentsTab />;
      case 'memory': return <MemoryTab />;
      case 'voice': return <VoiceTab />;
      case 'character': return <CharacterTab />;
      case 'behavior': return <BehaviorTab />;
      case 'needs': return <NeedsTab />;
      case 'games': return <GamesTab />;
      case 'music': return <MusicTab />;
      case 'themes': return <ThemesTab />;
      case 'screen_map': return <ScreenMapTab />;
      case 'notifications': return <NotificationsTab />;
      case 'performance': return <PerformanceTab />;
      case 'system': return <SystemTab />;
      case 'developer': return <DeveloperTab />;
      case 'diagnostics': return <DiagnosticsTab />;
      case 'privacy': return <PrivacyStorageTab />;
      case 'plugins': return <PluginsTab />;
      case 'about': return <AboutTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={() => setControlCenterOpen(false)}
    >
      <div
        style={{
          width: '940px',
          maxWidth: '95vw',
          height: '640px',
          maxHeight: '90vh',
          backgroundColor: 'var(--color-bg, #0F172A)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '20px',
          display: 'flex',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Sidebar */}
        <div
          style={{
            width: '230px',
            backgroundColor: 'var(--color-bg-card, #1E293B)',
            borderRight: '1px solid var(--color-border, #334155)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/icons/lulu-icon.svg" alt="Lulu" style={{ width: '28px', height: '28px' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text, #F8FAFC)' }}>
                Lulu Control
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-primary, #818CF8)' }}>v0.1.0 Ready</div>
            </div>
          </div>

          {/* Nav Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px 8px' }}>
            {navItems.map((item) => {
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    marginBottom: '3px',
                    border: 'none',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? 'var(--color-primary, #818CF8)' : 'transparent',
                    color: isSelected ? '#FFFFFF' : 'var(--color-text-muted, #94A3B8)',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '15px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Pane */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Top close button bar */}
          <div
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--color-border, #334155)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>Desktop Shortcut:</span>
              <kbd
                style={{
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  color: '#818CF8',
                  backgroundColor: 'rgba(129, 140, 248, 0.12)',
                  border: '1px solid rgba(129, 140, 248, 0.25)',
                  borderRadius: '4px',
                }}
              >
                Ctrl+Shift+C
              </kbd>
            </div>
            <button
              onClick={() => setControlCenterOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted, #94A3B8)',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Close (Esc)"
            >
              <span>✕</span>
              <kbd
                style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  color: '#94A3B8',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  padding: '2px 5px',
                  borderRadius: '3px',
                }}
              >
                Esc
              </kbd>
            </button>
          </div>

          {/* Active Tab Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            <React.Suspense fallback={<TabFallback />}>
              {renderActiveTab()}
            </React.Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};
