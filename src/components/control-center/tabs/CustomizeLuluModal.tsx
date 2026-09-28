import React, { useState, useEffect, useRef } from 'react';
import { useLuluStore } from '../../../stores/useLuluStore';
import { Skeletal2DRenderer } from '../../../character/renderers/Skeletal2DRenderer';
import { soundService } from '../../../services/soundService';
import { particleSystem } from '../../../animation/particleSystem';
import { PersonalityArchetype } from '../../../features/personality/types';
import { RotateCcw, ArrowLeft, Check } from 'lucide-react';

interface CustomizeLuluModalProps {
  onBack?: () => void;
  isEmbedded?: boolean;
}

export const CustomizeLuluModal: React.FC<CustomizeLuluModalProps> = ({ onBack, isEmbedded = false }) => {
  const {
    character,
    settings,
    updateSettings,
    updateCharacterCustomization,
    setPersonality,
    personality,
  } = useLuluStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<Skeletal2DRenderer>(new Skeletal2DRenderer());

  // 1. Scale state (0.70 to 1.40)
  const [scale, setScale] = useState<number>(() => {
    return settings.characterScale || character.scale || 1.0;
  });

  // 2. Animation state: 'minimal' | 'normal' | 'full'
  const [animationMode, setAnimationMode] = useState<'minimal' | 'normal' | 'full'>(() => {
    if (settings.reducedMotion || settings.performanceProfile === 'LOW') return 'minimal';
    if (settings.performanceProfile === 'HIGH' || settings.performanceProfile === 'MAX_FPS') return 'full';
    return 'normal';
  });

  // 3. Personality state: 'friendly' | 'calm' | 'playful' | 'focused'
  const currentArchetype = (personality?.id as 'friendly' | 'calm' | 'playful' | 'focused') || 'friendly';
  const [activePersonality, setActivePersonality] = useState<'friendly' | 'calm' | 'playful' | 'focused'>(
    ['friendly', 'calm', 'playful', 'focused'].includes(currentArchetype) ? currentArchetype : 'friendly'
  );

  // 4. Movement state: ['walk', 'idle', 'sleep', 'react']
  const [movements, setMovements] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('lulu_allowed_movements');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      walk: true,
      idle: true,
      sleep: true,
      react: true,
    };
  });

  // 5. Accessories state: Hat, Glasses, Backpack, Headset
  const [accessories, setAccessories] = useState<string[]>(() => {
    return character.accessories || [];
  });

  // 6. Speech state: Show messages, Notifications, Music reactions
  const [speechSettings, setSpeechSettings] = useState({
    showMessages: settings.speechBubblesEnabled ?? true,
    notifications: (settings as any).notificationsEnabled ?? true,
    musicReactions: settings.musicReactionsEnabled ?? true,
  });

  // Keep local states synced with store if character changes
  useEffect(() => {
    setAccessories(character.accessories || []);
    setScale(settings.characterScale || character.scale || 1.0);
  }, [character.id]);

  // Live Canvas Rendering Loop for Preview
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const previewCharacter = {
        ...character,
        accessories,
        scale: 1.0,
      };

      rendererRef.current.render({
        ctx,
        width: canvas.width,
        height: canvas.height,
        animationState: animationMode === 'minimal' ? 'idle' : 'happy',
        animationFrame: frame,
        facing: 'right',
        character: previewCharacter,
        mouthShape: 'smile',
        scale: Math.max(0.75, Math.min(1.35, scale)),
      });

      frame += animationMode === 'minimal' ? 0.02 : animationMode === 'full' ? 0.08 : 0.05;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [character, accessories, scale, animationMode]);

  // Scale handler
  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    updateSettings({ characterScale: newScale });
    updateCharacterCustomization({ scale: newScale });
  };

  // Animation mode handler
  const handleAnimationChange = (mode: 'minimal' | 'normal' | 'full') => {
    setAnimationMode(mode);
    soundService.play('click', 'ui');
    if (mode === 'minimal') {
      updateSettings({
        reducedMotion: true,
        animationFps: 30,
        performanceProfile: 'LOW',
      });
    } else if (mode === 'full') {
      updateSettings({
        reducedMotion: false,
        animationFps: 60,
        performanceProfile: 'HIGH',
      });
    } else {
      updateSettings({
        reducedMotion: false,
        animationFps: 60,
        performanceProfile: 'BALANCED',
      });
    }
  };

  // Personality handler
  const handlePersonalityChange = (arch: 'friendly' | 'calm' | 'playful' | 'focused') => {
    setActivePersonality(arch);
    setPersonality(arch as PersonalityArchetype);
    soundService.play('chirp', 'ui');
  };

  // Movement toggle handler
  const handleToggleMovement = (key: string) => {
    const updated = { ...movements, [key]: !movements[key] };
    setMovements(updated);
    try {
      localStorage.setItem('lulu_allowed_movements', JSON.stringify(updated));
    } catch {}
    soundService.play('click', 'ui');
  };

  // Accessory toggle handler
  const handleToggleAccessory = (accId: string) => {
    const updated = accessories.includes(accId)
      ? accessories.filter((a) => a !== accId)
      : [...accessories, accId];
    setAccessories(updated);
    updateCharacterCustomization({ accessories: updated });
    soundService.play('chirp', 'ui');
    particleSystem.spawnSparkles(window.innerWidth / 2, window.innerHeight / 2, character.palette.primary, 10);
  };

  // Speech settings toggle handler
  const handleToggleSpeech = (key: 'showMessages' | 'notifications' | 'musicReactions') => {
    const updated = { ...speechSettings, [key]: !speechSettings[key] };
    setSpeechSettings(updated);

    if (key === 'showMessages') {
      updateSettings({ speechBubblesEnabled: updated.showMessages });
    } else if (key === 'musicReactions') {
      updateSettings({ musicReactionsEnabled: updated.musicReactions });
    } else if (key === 'notifications') {
      updateSettings({ ...settings, notificationsEnabled: updated.notifications } as any);
    }
    soundService.play('click', 'ui');
  };

  // [Reset] handler
  const handleReset = () => {
    const defaultScale = 1.0;
    const defaultAnim = 'normal';
    const defaultPers = 'friendly';
    const defaultMovements = { walk: true, idle: true, sleep: true, react: true };
    const defaultAcc: string[] = [];
    const defaultSpeech = { showMessages: true, notifications: true, musicReactions: true };

    setScale(defaultScale);
    setAnimationMode(defaultAnim);
    setActivePersonality(defaultPers);
    setMovements(defaultMovements);
    setAccessories(defaultAcc);
    setSpeechSettings(defaultSpeech);

    try {
      localStorage.setItem('lulu_allowed_movements', JSON.stringify(defaultMovements));
    } catch {}

    updateSettings({
      characterScale: defaultScale,
      reducedMotion: false,
      animationFps: 60,
      performanceProfile: 'BALANCED',
      speechBubblesEnabled: true,
      musicReactionsEnabled: true,
    });
    updateCharacterCustomization({
      scale: defaultScale,
      accessories: defaultAcc,
    });
    setPersonality('friendly');

    soundService.play('achievement', 'ui');
    particleSystem.spawnLevelUp(window.innerWidth / 2, window.innerHeight / 2);
  };

  return (
    <div
      style={{
        maxWidth: '460px',
        margin: '0 auto',
        backgroundColor: 'var(--color-bg-card, #1E293B)',
        borderRadius: '20px',
        border: '1px solid var(--color-border, #334155)',
        padding: '24px 28px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
        color: '#F8FAFC',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* 1. Header with back button */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted, #94A3B8)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Back to Pet Hub"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: '#FFFFFF',
              }}
            >
              CUSTOMIZE LULU
            </h2>
          </div>
          <span style={{ fontSize: '11px', color: character.palette.primary, fontWeight: 700 }}>
            {character.name} Mini
          </span>
        </div>
        <div style={{ height: '1px', backgroundColor: 'var(--color-border, #334155)', width: '100%' }} />
      </div>

      {/* Live Preview Canvas */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 0 16px 0',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: `2px solid ${character.palette.primary}66`,
            boxShadow: `0 0 20px ${character.palette.primary}22`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <canvas ref={canvasRef} width={140} height={140} style={{ display: 'block' }} />
          <span
            style={{
              position: 'absolute',
              bottom: '-6px',
              backgroundColor: '#0F172A',
              border: `1px solid ${character.palette.primary}`,
              borderRadius: '12px',
              padding: '1px 8px',
              fontSize: '10px',
              fontWeight: 800,
              color: '#F8FAFC',
            }}
          >
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>

      {/* Section 1: Pet Size & Scale */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>Pet Size</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: character.palette.primary }}>
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* Range Slider Track */}
        <input
          type="range"
          min="0.70"
          max="1.40"
          step="0.05"
          value={scale}
          onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: character.palette.primary,
            cursor: 'pointer',
            margin: '4px 0',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
          <span>Scale: 70%</span>
          <span>───────────</span>
          <span>140%</span>
        </div>
      </div>

      {/* Section 2: Animation */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>
          Animation
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
          {(['minimal', 'normal', 'full'] as const).map((mode) => {
            const isChecked = animationMode === mode;
            const label = mode.charAt(0).toUpperCase() + mode.slice(1);
            return (
              <label
                key={mode}
                onClick={() => handleAnimationChange(mode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: isChecked ? '#FFFFFF' : '#94A3B8',
                  fontWeight: isChecked ? 600 : 400,
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: isChecked ? `2px solid ${character.palette.primary}` : '2px solid #475569',
                    backgroundColor: isChecked ? character.palette.primary : 'transparent',
                    boxSizing: 'border-box',
                  }}
                >
                  {isChecked && (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  )}
                </span>
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 3: Personality */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>
          Personality
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
          {(['friendly', 'calm', 'playful', 'focused'] as const).map((pers) => {
            const isChecked = activePersonality === pers;
            const label = pers.charAt(0).toUpperCase() + pers.slice(1);
            return (
              <label
                key={pers}
                onClick={() => handlePersonalityChange(pers)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: isChecked ? '#FFFFFF' : '#94A3B8',
                  fontWeight: isChecked ? 600 : 400,
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: isChecked ? `2px solid ${character.palette.primary}` : '2px solid #475569',
                    backgroundColor: isChecked ? character.palette.primary : 'transparent',
                    boxSizing: 'border-box',
                  }}
                >
                  {isChecked && (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  )}
                </span>
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 4: Movement */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>
          Movement
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
          {(['walk', 'idle', 'sleep', 'react'] as const).map((key) => {
            const isChecked = !!movements[key];
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            return (
              <label
                key={key}
                onClick={() => handleToggleMovement(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: isChecked ? '#FFFFFF' : '#94A3B8',
                  fontWeight: isChecked ? 600 : 400,
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: isChecked ? `2px solid #34D399` : '2px solid #475569',
                    backgroundColor: isChecked ? '#34D399' : 'transparent',
                    boxSizing: 'border-box',
                  }}
                >
                  {isChecked && (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#0F172A',
                      }}
                    />
                  )}
                </span>
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 5: Accessories */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>
          Accessories
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
          {[
            { id: 'hat', label: 'Hat' },
            { id: 'glasses', label: 'Glasses' },
            { id: 'backpack', label: 'Backpack' },
            { id: 'headset', label: 'Headset' },
          ].map((acc) => {
            const isChecked = accessories.includes(acc.id);
            return (
              <label
                key={acc.id}
                onClick={() => handleToggleAccessory(acc.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: isChecked ? '#FFFFFF' : '#94A3B8',
                  fontWeight: isChecked ? 600 : 400,
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: isChecked ? `2px solid ${character.palette.primary}` : '2px solid #475569',
                    backgroundColor: isChecked ? character.palette.primary : 'transparent',
                    boxSizing: 'border-box',
                  }}
                >
                  {isChecked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </span>
                <span>{acc.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 6: Speech */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px' }}>
          Speech
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
          {[
            { key: 'showMessages' as const, label: 'Show messages' },
            { key: 'notifications' as const, label: 'Notifications' },
            { key: 'musicReactions' as const, label: 'Music reactions' },
          ].map((item) => {
            const isChecked = speechSettings[item.key];
            return (
              <label
                key={item.key}
                onClick={() => handleToggleSpeech(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: isChecked ? '#FFFFFF' : '#94A3B8',
                  fontWeight: isChecked ? 600 : 400,
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: isChecked ? `2px solid #38BDF8` : '2px solid #475569',
                    backgroundColor: isChecked ? '#38BDF8' : 'transparent',
                    boxSizing: 'border-box',
                  }}
                >
                  {isChecked && <Check size={12} color="#0F172A" strokeWidth={3} />}
                </span>
                <span>{item.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 7: [Reset] button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '9px 32px',
            borderRadius: '12px',
            border: '1px solid var(--color-border, #334155)',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: '#F8FAFC',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = '#EF4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'var(--color-border, #334155)';
          }}
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
