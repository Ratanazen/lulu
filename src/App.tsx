import React, { useEffect } from 'react';
import { PetView } from './components/pet/PetView';
import { ControlCenterModal } from './components/control-center/ControlCenterModal';
import { OnboardingModal } from './components/control-center/OnboardingModal';
import { useLuluStore } from './stores/useLuluStore';

export const App: React.FC = () => {
  const { initialize, controlCenterOpen, setControlCenterOpen } = useLuluStore();

  useEffect(() => {
    initialize();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Control Center via Ctrl+Shift+C or Cmd+Shift+C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setControlCenterOpen(!controlCenterOpen);
      }
      // Close Control Center on Escape
      if (e.key === 'Escape' && controlCenterOpen) {
        setControlCenterOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [initialize, controlCenterOpen, setControlCenterOpen]);

  return (
    <>
      <PetView />
      <ControlCenterModal />
      <OnboardingModal />
    </>
  );
};

export default App;
