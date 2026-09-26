import React, { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { PetView } from './components/pet/PetView';
import { ControlCenterModal } from './components/control-center/ControlCenterModal';
import { OnboardingModal } from './components/control-center/OnboardingModal';
import { useLuluStore } from './stores/useLuluStore';
import { DesktopWindowService } from './services/desktopWindow';
import { soundService } from './services/soundService';

export const App: React.FC = () => {
  const {
    initialize,
    controlCenterOpen,
    setControlCenterOpen,
    chatOpen,
    setChatOpen,
    quickActionsOpen,
    setQuickActionsOpen,
    feed,
    playGame,
    wander,
    sleep,
    settings,
    updateSettings,
    isHydrated,
    onboardingCompleted,
  } = useLuluStore();

  // Dynamic window resizing so modals and chat have ample room and never clip
  useEffect(() => {
    if (!isHydrated) return;

    if (!onboardingCompleted) {
      DesktopWindowService.setSize(540, 660);
    } else if (controlCenterOpen) {
      DesktopWindowService.setSize(960, 680);
    } else if (chatOpen) {
      DesktopWindowService.setSize(460, 600);
    } else if (quickActionsOpen) {
      DesktopWindowService.setSize(360, 440);
    } else {
      DesktopWindowService.setSize(260, 320);
    }
  }, [isHydrated, onboardingCompleted, controlCenterOpen, chatOpen, quickActionsOpen]);

  useEffect(() => {
    initialize();

    // Listen to native tray events
    let unlistenChat: (() => void) | undefined;
    let unlistenSettings: (() => void) | undefined;

    listen('open-chat', () => {
      setChatOpen(true);
    })
      .then((fn) => {
        unlistenChat = fn;
      })
      .catch(() => {});

    listen('open-settings', () => {
      setControlCenterOpen(true);
    })
      .then((fn) => {
        unlistenSettings = fn;
      })
      .catch(() => {});

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Quit application via Ctrl+Q / Cmd+Q
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        DesktopWindowService.exit();
        return;
      }

      // Toggle Control Center via Ctrl+Shift+C / Cmd+Shift+C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setControlCenterOpen(!controlCenterOpen);
        return;
      }

      // Toggle Chat via Ctrl+Shift+Space / Cmd+Shift+Space
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        setChatOpen(!chatOpen);
        return;
      }

      // Toggle Quick Actions via Ctrl+Shift+L / Cmd+Shift+L
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setQuickActionsOpen(!quickActionsOpen);
        return;
      }

      // Close open modals on Escape
      if (e.key === 'Escape') {
        if (chatOpen) setChatOpen(false);
        if (quickActionsOpen) setQuickActionsOpen(false);
        if (controlCenterOpen) setControlCenterOpen(false);
        return;
      }

      // Single-key shortcuts (when not typing in an input/textarea)
      if (!isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'f') {
          e.preventDefault();
          feed(25);
        } else if (k === 'p') {
          e.preventDefault();
          playGame(25);
        } else if (k === 'w') {
          e.preventDefault();
          wander();
        } else if (k === 's') {
          e.preventDefault();
          sleep();
        } else if (k === 't') {
          e.preventDefault();
          updateSettings({ alwaysOnTop: !settings.alwaysOnTop });
        } else if (k === 'm') {
          e.preventDefault();
          soundService.enabled = !soundService.enabled;
          if (soundService.enabled) soundService.play('chirp', 'ui');
        } else if (k === 'h') {
          e.preventDefault();
          DesktopWindowService.hide();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unlistenChat?.();
      unlistenSettings?.();
    };
  }, [
    initialize,
    controlCenterOpen,
    setControlCenterOpen,
    chatOpen,
    setChatOpen,
    quickActionsOpen,
    setQuickActionsOpen,
    feed,
    playGame,
    wander,
    sleep,
    settings,
    updateSettings,
  ]);

  return (
    <>
      <PetView />
      <ControlCenterModal />
      <OnboardingModal />
    </>
  );
};

export default App;
