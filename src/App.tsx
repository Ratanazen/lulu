import React, { useEffect } from 'react';
import { PetView } from './components/pet/PetView';
import { ControlCenterModal } from './components/control-center/ControlCenterModal';
import { OnboardingModal } from './components/control-center/OnboardingModal';
import { useLuluStore } from './stores/useLuluStore';

export const App: React.FC = () => {
  const {
    initialize,
    controlCenterOpen,
    setControlCenterOpen,
    chatOpen,
    setChatOpen,
    quickActionsOpen,
    setQuickActionsOpen,
  } = useLuluStore();

  useEffect(() => {
    initialize();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Control Center via Ctrl+Shift+C / Cmd+Shift+C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setControlCenterOpen(!controlCenterOpen);
      }

      // Toggle Chat via Ctrl+Shift+Space / Cmd+Shift+Space
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        setChatOpen(!chatOpen);
      }

      // Toggle Quick Actions via Ctrl+Shift+L / Cmd+Shift+L
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setQuickActionsOpen(!quickActionsOpen);
      }

      // Close open modals on Escape
      if (e.key === 'Escape') {
        if (chatOpen) setChatOpen(false);
        if (quickActionsOpen) setQuickActionsOpen(false);
        if (controlCenterOpen) setControlCenterOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    initialize,
    controlCenterOpen,
    setControlCenterOpen,
    chatOpen,
    setChatOpen,
    quickActionsOpen,
    setQuickActionsOpen,
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
