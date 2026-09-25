import React, { useState, useEffect } from 'react';
import { useLuluStore } from '../../stores/useLuluStore';
import { PetCanvas } from './PetCanvas';
import { SpeechBubble } from './SpeechBubble';
import { QuickStatusOverlay } from './QuickStatusOverlay';
import { ContextMenu } from './ContextMenu';
import { CompactChatWindow } from '../chat/CompactChatWindow';
import { QuickActionsMenu } from './QuickActionsMenu';

export const PetView: React.FC = () => {
  const { speechMessage, dismissSpeech, pauseSpeech, resumeSpeech, updateNeeds } = useLuluStore();
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Periodic needs decay & autonomous behavior tick (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      updateNeeds();
    }, 5000);
    return () => clearInterval(interval);
  }, [updateNeeds]);

  // Close context menu on outside click
  useEffect(() => {
    const closeMenu = () => setContextMenuPos(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: '14px',
        position: 'relative',
        overflow: 'visible',
        backgroundColor: 'transparent',
        boxSizing: 'border-box',
      }}
    >
      {/* Speech Bubble + Mascot */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <SpeechBubble
          message={speechMessage}
          onDismiss={dismissSpeech}
          onMouseEnter={pauseSpeech}
          onMouseLeave={resumeSpeech}
        />
        <PetCanvas onContextMenu={handleContextMenu} />
      </div>

      {/* Mini Quick Status */}
      <QuickStatusOverlay />

      {/* Floating Desktop Chat Companion */}
      <CompactChatWindow />

      {/* Quick Actions Dock */}
      <QuickActionsMenu />

      {/* Context Menu */}
      {contextMenuPos && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onClose={() => setContextMenuPos(null)}
        />
      )}
    </div>
  );
};
