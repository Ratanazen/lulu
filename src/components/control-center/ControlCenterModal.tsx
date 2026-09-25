import React from 'react';
import { useLuluStore } from '../../stores/useLuluStore';
import { OverviewTab } from './tabs/OverviewTab';
import { CharacterTab } from './tabs/CharacterTab';
import { BehaviorTab } from './tabs/BehaviorTab';
import { NeedsTab } from './tabs/NeedsTab';
import { GamesTab } from './tabs/GamesTab';
import { MusicTab } from './tabs/MusicTab';
import { ThemesTab } from './tabs/ThemesTab';
import { ScreenMapTab } from './tabs/ScreenMapTab';
import { NotificationsTab } from './tabs/NotificationsTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import { SystemTab } from './tabs/SystemTab';
import { DeveloperTab } from './tabs/DeveloperTab';
import { DiagnosticsTab } from './tabs/DiagnosticsTab';
import { PrivacyStorageTab } from './tabs/PrivacyStorageTab';
import { PluginsTab } from './tabs/PluginsTab';
import { AboutTab } from './tabs/AboutTab';
import { AIChatTab } from './tabs/AIChatTab';
import { MemoryTab } from './tabs/MemoryTab';
import { VoiceTab } from './tabs/VoiceTab';

export const ControlCenterModal: React.FC = () => {
  const { controlCenterOpen, setControlCenterOpen, activeTab, setActiveTab } = useLuluStore();

  if (!controlCenterOpen) return null;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'ai_chat', label: 'AI & Models', icon: '🤖' },
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
              padding: '14px 20px',
              borderBottom: '1px solid var(--color-border, #334155)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => setControlCenterOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted, #94A3B8)',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
              }}
              title="Close (Esc)"
            >
              ✕
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
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </div>
  );
};
