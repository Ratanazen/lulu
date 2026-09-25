import React, { useState, useEffect } from 'react';
import { useLuluStore } from '../../stores/useLuluStore';
import { PetCanvas } from './PetCanvas';
import { SpeechBubble } from './SpeechBubble';
import { QuickStatusOverlay } from './QuickStatusOverlay';
import { ContextMenu } from './ContextMenu';

export const PetView: React.FC = () => {
  const { speechMessage, dismissSpeech, updateNeeds } = useLuluStore();
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
        justifyContent: 'center',
        position: 'relative',
        overflow: 'visible',
        backgroundColor: 'transparent',
      }}
    >
      {/* Speech Bubble */}
      <div style={{ position: 'relative' }}>
        <SpeechBubble message={speechMessage} onDismiss={dismissSpeech} />
        <PetCanvas onContextMenu={handleContextMenu} />
      </div>

      {/* Mini Quick Status */}
      <QuickStatusOverlay />

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
