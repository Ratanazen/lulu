import React, { useState } from 'react';
import { useLuluStore } from '../../stores/useLuluStore';

export const OnboardingModal: React.FC = () => {
  const { onboardingCompleted, completeOnboarding, setCharacter, characters, speak, isHydrated } = useLuluStore();
  const [step, setStep] = useState(0);

  if (!isHydrated || onboardingCompleted) return null;

  const steps = [
    {
      title: 'Welcome to Lulu ✨',
      subtitle: 'Your new offline-first, native desktop companion.',
      content: (
        <div style={{ textAlign: 'center', lineHeight: '1.6', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          <p>
            Lulu is designed to live gently on your desktop, react to your interactions, wander across monitors, and keep you company while you work or play.
          </p>
          <p style={{ marginTop: '8px', color: '#34D399', fontWeight: 600 }}>
            🔒 100% Offline-First: No account required, zero tracking.
          </p>
        </div>
      ),
    },
    {
      title: 'Choose Your Mascot',
      subtitle: 'Pick your companion or stick with official Lulu.',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {characters.map((c) => (
            <div
              key={c.id}
              onClick={() => setCharacter(c.id)}
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: c.palette.primary,
                  margin: '0 auto 8px auto',
                }}
              />
              <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.displayName}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Account & AI Login',
      subtitle: 'What account would you like to use with Lulu?',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid #34D399',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔒 Offline Guest (Default)</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              No account required! Lulu runs 100% offline, local virtual pet, zero telemetry, completely free.
            </p>
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid #818CF8',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#818CF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🚀 Antigravity (AGY) Google OAuth</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Uses your pre-authenticated Google session in ~/.gemini/antigravity-cli. Powers Gemini 3.8 & Claude models without typing API keys!
            </p>
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#F8FAFC' }}>
              <span>🔑 Custom API Keys & Local Ollama</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Configure OpenAI, Anthropic, Gemini API keys, or local Ollama anytime in the AI Chat tab.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Ready for Starlight Days!',
      subtitle: 'You can drag Lulu anytime, or right-click for quick actions.',
      content: (
        <div style={{ textAlign: 'center', lineHeight: '1.6', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          <p>
            Right-click Lulu to feed, play, groom, or open the full <strong>Control Center</strong>.
          </p>
          <p>Enjoy your new companion!</p>
        </div>
      ),
    },
  ];

  const current = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding();
      speak('Happy to meet you! Let us have a great time! ✨');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 20000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          backgroundColor: 'var(--color-bg, #0F172A)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          boxSizing: 'border-box',
        }}
      >
        <img src="/icons/lulu-icon.svg" alt="Lulu" style={{ width: '48px', height: '48px' }} />

        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 700 }}>
            {current.title}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {current.subtitle}
          </p>
        </div>

        <div style={{ width: '100%', margin: '10px 0' }}>{current.content}</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '8px' }}>
          <button
            onClick={() => {
              completeOnboarding();
              speak('Skipped onboarding! Lulu is ready to play. ✨');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Skip
          </button>

          <button
            onClick={handleNext}
            style={{
              padding: '8px 20px',
              backgroundColor: 'var(--color-primary, #818CF8)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {step === steps.length - 1 ? 'Get Started' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};
