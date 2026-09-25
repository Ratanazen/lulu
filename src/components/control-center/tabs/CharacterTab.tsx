import React, { useState, useEffect, useRef } from 'react';
import { useLuluStore } from '../../../stores/useLuluStore';
import { AnimationState, CharacterProfile, CharacterRendererType } from '../../../types';
import { StorageService } from '../../../services/storageService';
import { ANIME_CHARACTERS } from '../../../character/animePresets';
import { characterManager } from '../../../character/CharacterManager';
import { CharacterPackValidator } from '../../../character/CharacterPackValidator';

export const CharacterTab: React.FC = () => {
  const {
    character,
    characters,
    setCharacter,
    settings,
    updateSettings,
    preferences,
    progression,
    spendStars,
    updateCharacterCustomization,
    setAnimation,
    speak,
  } = useLuluStore();

  const [unlockedAccessories, setUnlockedAccessories] = useState<string[]>([
    'halo',
    'star_glasses',
  ]);

  const [currentRenderer, setCurrentRenderer] = useState<CharacterRendererType>(
    characterManager.getCurrentRendererType()
  );

  const [packValidationResult, setPackValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    parsed?: any;
  } | null>(null);

  const [manifestJsonInput, setManifestJsonInput] = useState<string>(
    JSON.stringify(
      {
        id: 'custom_warrior',
        name: 'Custom Warrior',
        version: '1.0.0',
        author: 'Community Creator',
        renderer: 'skeletal_2d',
        defaultAnimation: 'idle',
        sprites: { idle: 'sprites/idle.png' },
      },
      null,
      2
    )
  );

  const stageCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stageAction, setStageAction] = useState<AnimationState>('idle');
  const [stagePlaying, setStagePlaying] = useState<boolean>(true);
  const [stageFrame, setStageFrame] = useState<number>(0);

  useEffect(() => {
    let animId: number;
    const renderStage = () => {
      const canvas = stageCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const { renderer } = characterManager.getEffectiveRenderer(character, currentRenderer);
          renderer.render({
            ctx,
            width: canvas.width,
            height: canvas.height,
            animationState: stageAction,
            animationFrame: stageFrame,
            facing: 'right',
            character,
            mouthShape: 'smile',
            scale: 1.5,
          });
        }
      }
      if (stagePlaying) {
        setStageFrame((prev) => (prev + 0.3) % 60);
      }
      animId = requestAnimationFrame(renderStage);
    };
    animId = requestAnimationFrame(renderStage);
    return () => cancelAnimationFrame(animId);
  }, [character, currentRenderer, stageAction, stagePlaying, stageFrame]);

  useEffect(() => {
    StorageService.get<string[]>('unlocked_accessories', ['halo', 'star_glasses']).then((saved) => {
      if (saved) setUnlockedAccessories(saved);
    });
  }, []);

  const animationStates: AnimationState[] = [
    'idle',
    'walk',
    'run',
    'sit',
    'sleep',
    'curious',
    'happy',
    'excited',
    'celebrate',
    'wave',
    'jump',
    'dance',
    'yawn',
    'read',
    'nod',
    'dizzy',
    'meditate',
    'pout',
  ];

  const auras = [
    { name: 'None', value: undefined, color: '#64748B' },
    { name: 'Celestial White', value: '#E0E7FF', color: '#E0E7FF' },
    { name: 'Starlight Gold', value: '#FDE68A', color: '#FDE68A' },
    { name: 'Rose Cosmic', value: '#F472B6', color: '#F472B6' },
    { name: 'Emerald Zen', value: '#34D399', color: '#34D399' },
    { name: 'Radiant Indigo', value: '#818CF8', color: '#818CF8' },
  ];

  const shopAccessories = [
    { id: 'halo', name: 'Celestial Halo', cost: 0, icon: '✨' },
    { id: 'star_glasses', name: 'Star Glasses', cost: 0, icon: '⭐' },
    { id: 'ribbon', name: 'Pastel Ribbon', cost: 10, icon: '🎀' },
    { id: 'crown', name: 'Starlight Crown', cost: 15, icon: '👑' },
    { id: 'wizard_hat', name: 'Cosmic Wizard Hat', cost: 20, icon: '🧙' },
  ];

  const toggleAccessory = (accId: string) => {
    const current = character.accessories || [];
    const exists = current.includes(accId);
    const updated = exists ? current.filter((a) => a !== accId) : [...current, accId];
    updateCharacterCustomization({ accessories: updated });
    speak(exists ? `Took off ${accId} ✨` : `Equipped ${accId}! ✨`);
  };

  const handleUnlockAccessory = (accId: string, cost: number) => {
    if (spendStars(cost)) {
      const updated = [...unlockedAccessories, accId];
      setUnlockedAccessories(updated);
      StorageService.set('unlocked_accessories', updated);
      toggleAccessory(accId);
      speak(`Unlocked ${accId}! Looks splendid! 🌟`);
    } else {
      speak("Not enough stars yet! Play games or complete achievements! ⭐");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Character Studio & Evolution</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Choose your companion, customize celestial auras, equip accessories, and inspect learned memory.
        </p>
      </div>

      {/* Character Selector Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {characters.map((c) => {
          const isSelected = c.id === character.id;
          return (
            <div
              key={c.id}
              onClick={() => {
                setCharacter(c.id);
                speak(`Switched to ${c.displayName}! ✨`);
              }}
              style={{
                backgroundColor: 'var(--color-bg-card, #1E293B)',
                border: isSelected
                  ? '2px solid var(--color-primary, #818CF8)'
                  : '1px solid var(--color-border, #334155)',
                borderRadius: '16px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: c.palette.primary,
                    border: `2px solid ${c.palette.shadow}`,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{c.displayName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Scale: {c.scale}x
                  </div>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                {c.description}
              </p>

              {/* Trait Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '12px' }}>
                <span style={tagStyle}>Curiosity: {c.personality.curiosity}%</span>
                <span style={tagStyle}>Playful: {c.personality.playfulness}%</span>
                <span style={tagStyle}>Calm: {c.personality.calmness}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Original Anime Presets */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', color: '#F8FAFC' }}>Original Anime Presets</h4>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
              Handcrafted original anime characters with distinct visual themes, sound profiles, and personas.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {ANIME_CHARACTERS.map((preset: CharacterProfile) => (
            <div
              key={preset.id}
              onClick={() => {
                const matched = characters.find((c) => c.id === preset.id);
                if (matched) {
                  setCharacter(matched.id);
                }
                speak(`Summoned anime companion ${preset.displayName}! ✨`);
              }}
              style={{
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid #334155',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: preset.palette.primary,
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>{preset.displayName}</span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', lineHeight: '1.3' }}>
                {preset.description}
              </p>
              <div style={{ fontSize: '10px', color: '#38BDF8', marginTop: 'auto' }}>
                Tone: {preset.personality.tone}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Renderer Engine Configuration */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#F8FAFC' }}>Active Rendering Engine</h4>
        <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#94A3B8' }}>
          Select how characters are drawn on your desktop. Lulu seamlessly supports 2D pixel, 2D vector skeletal, and 3D VRM engines.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            {
              type: 'pixel' as CharacterRendererType,
              name: 'Procedural 2D Pixel',
              desc: 'Crisp retro pixel rendering with dynamic visemes and accessories.',
              tag: 'Default • Ultra-Low CPU',
            },
            {
              type: 'skeletal_2d' as CharacterRendererType,
              name: 'Vector 2D Skeletal',
              desc: 'Dynamic bone hierarchy with smooth limb rotations and facial expressions.',
              tag: 'Smooth 60 FPS Vectors',
            },
            {
              type: 'vrm_3d' as CharacterRendererType,
              name: 'WebGL / 3D VRM',
              desc: 'Hardware-accelerated 3D avatar engine with capability detection.',
              tag: '3D • GPU Accelerated',
            },
            {
              type: 'spritesheet' as CharacterRendererType,
              name: 'Universal Sprite Sheet',
              desc: 'Pre-rendered horizontal/vertical strips with frame pacing.',
              tag: 'Custom Sheets • 2D',
            },
          ].map((r) => {
            const isSelected = currentRenderer === r.type;
            return (
              <button
                key={r.type}
                type="button"
                onClick={() => {
                  characterManager.setRenderer(r.type);
                  setCurrentRenderer(r.type);
                  speak(`Renderer switched to ${r.name}! 🎨`);
                }}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  border: `1.5px solid ${isSelected ? '#818CF8' : '#334155'}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#818CF8' : '#F8FAFC' }}>
                  {r.name}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{r.desc}</div>
                <div style={{ fontSize: '10px', color: '#38BDF8', marginTop: 'auto' }}>{r.tag}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Character Pack Validator & Importer */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#F8FAFC' }}>Character Pack Validator</h4>
        <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#94A3B8' }}>
          Strict security and schema validation for user-created character packs (blocks executables, enforces 50MB limit).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea
            rows={5}
            value={manifestJsonInput}
            onChange={(e) => setManifestJsonInput(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              color: '#F8FAFC',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          />
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                try {
                  const parsed = JSON.parse(manifestJsonInput);
                  const result = CharacterPackValidator.validateManifest(parsed);
                  setPackValidationResult(result);
                } catch (err: any) {
                  setPackValidationResult({
                    valid: false,
                    errors: [`JSON Syntax Error: ${err.message}`],
                  });
                }
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Validate Manifest
            </button>
            {packValidationResult && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: packValidationResult.valid ? '#10B981' : '#EF4444',
                }}
              >
                {packValidationResult.valid ? '✓ Manifest schema is valid!' : '✗ Validation failed'}
              </span>
            )}
          </div>
          {packValidationResult && packValidationResult.errors.length > 0 && (
            <div style={{ fontSize: '11px', color: '#EF4444' }}>
              {packValidationResult.errors.map((e: string, i: number) => (
                <div key={i}>• {e}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Aura & Accessories Customization */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 14px 0', fontSize: '15px' }}>Aura & Cosmetic Styling</h4>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
            Celestial Aura Glow
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {auras.map((aura) => {
              const isSelected = character.aura === aura.value;
              return (
                <button
                  key={aura.name}
                  onClick={() => {
                    updateCharacterCustomization({ aura: aura.value });
                    speak(`Aura updated: ${aura.name}! ✨`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: isSelected
                      ? '1px solid var(--color-primary, #818CF8)'
                      : '1px solid var(--color-border, #334155)',
                    color: 'var(--color-text, #F8FAFC)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: aura.color,
                      boxShadow: `0 0 6px ${aura.color}`,
                    }}
                  />
                  {aura.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Cosmetics & Star Shop
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#FBBF24',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                padding: '2px 8px',
                borderRadius: '8px',
              }}
            >
              ⭐ {progression.stars} Stars Available
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {shopAccessories.map((item) => {
              const isUnlocked = unlockedAccessories.includes(item.id) || item.cost === 0;
              const isEquipped = (character.accessories || []).includes(item.id);

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: isEquipped
                      ? '1px solid var(--color-primary, #818CF8)'
                      : '1px solid var(--color-border, #334155)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                        {isUnlocked ? 'Unlocked' : `${item.cost} Stars`}
                      </div>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isEquipped}
                        onChange={() => toggleAccessory(item.id)}
                      />
                    </label>
                  ) : (
                    <button
                      onClick={() => handleUnlockAccessory(item.id, item.cost)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#F59E0B',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#000',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Unlock
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Companion Memory & Learned Preferences */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 14px 0', fontSize: '15px' }}>Companion Memory & Learned Habits</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <div style={statBoxStyle}>
            <div style={statNumberStyle}>{preferences.totalPats}</div>
            <div style={statLabelStyle}>Total Pats</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statNumberStyle}>{preferences.totalInteractions}</div>
            <div style={statLabelStyle}>Interactions</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statNumberStyle}>{preferences.totalGamesPlayed}</div>
            <div style={statLabelStyle}>Games Played</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ ...statNumberStyle, textTransform: 'capitalize' }}>
              {preferences.preferredActiveHours}
            </div>
            <div style={statLabelStyle}>Active Rhythm</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statNumberStyle}>{preferences.wakeCount}</div>
            <div style={statLabelStyle}>Sessions</div>
          </div>
        </div>
      </div>

      {/* Scale & Display Settings */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 16px 0', fontSize: '15px' }}>Display & Scale Settings</h4>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span>Character Scale Multiplier</span>
            <span style={{ fontWeight: 600 }}>{settings.characterScale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.8"
            step="0.05"
            value={settings.characterScale}
            onChange={(e) => updateSettings({ characterScale: parseFloat(e.target.value) })}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={settings.speechBubblesEnabled}
              onChange={(e) => updateSettings({ speechBubblesEnabled: e.target.checked })}
            />
            Enable Speech Bubbles
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
            />
            Reduced Motion Mode
          </label>
        </div>
      </div>

      {/* Interactive Live Preview Stage */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎬 Character Live Preview Stage</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  color: '#818CF8',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                }}
              >
                {character.displayName} • {character.renderer || 'pixel'}
              </span>
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-text-muted, #94A3B8)' }}>
              Scrub animations frame-by-frame, test motion pacing, and inspect sprite bounding bounds in real time.
            </p>
          </div>

          <button
            onClick={() => setAnimation(stageAction)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid var(--color-primary, #6366F1)',
              color: 'var(--color-primary, #818CF8)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ⚡ Sync Action to Desktop
          </button>
        </div>

        {/* Live Stage Canvas Viewport */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px) 0 0 / 16px 16px, #0B0F19',
            border: '1px solid var(--color-border, #334155)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            minHeight: '260px',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          <canvas
            ref={stageCanvasRef}
            width={320}
            height={240}
            style={{
              display: 'block',
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))',
            }}
          />

          {/* HUD Overlay Info */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              gap: '6px',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                backgroundColor: 'rgba(0,0,0,0.65)',
                color: '#38BDF8',
                fontSize: '11px',
                fontFamily: 'monospace',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              Action: {stageAction}
            </span>
            <span
              style={{
                backgroundColor: 'rgba(0,0,0,0.65)',
                color: '#10B981',
                fontSize: '11px',
                fontFamily: 'monospace',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              Frame: {Math.floor(stageFrame)}/60
            </span>
          </div>

          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                backgroundColor: 'rgba(0,0,0,0.65)',
                color: '#A855F7',
                fontSize: '11px',
                fontFamily: 'monospace',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              Scale: 1.5x
            </span>
          </div>
        </div>

        {/* Transport & Frame Scrubber Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: '10px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <button
            onClick={() => setStagePlaying((prev) => !prev)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: stagePlaying ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${stagePlaying ? '#EF4444' : '#10B981'}`,
              color: stagePlaying ? '#F87171' : '#34D399',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              minWidth: '85px',
            }}
          >
            {stagePlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          <button
            onClick={() => {
              setStageFrame(0);
              setStagePlaying(true);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--color-border, #334155)',
              color: 'var(--color-text, #F8FAFC)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ⏮ Reset
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted, #94A3B8)', minWidth: '40px' }}>
              Scrub:
            </span>
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={Math.floor(stageFrame)}
              onChange={(e) => {
                setStagePlaying(false);
                setStageFrame(Number(e.target.value));
              }}
              style={{
                flex: 1,
                accentColor: 'var(--color-primary, #6366F1)',
                cursor: 'pointer',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--color-text, #F8FAFC)',
                minWidth: '50px',
                textAlign: 'right',
              }}
            >
              {Math.floor(stageFrame)} / 60
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #94A3B8)', display: 'block', marginBottom: '8px' }}>
            Select Animation Action to Test:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {animationStates.map((st) => {
              const isActive = stageAction === st;
              return (
                <button
                  key={st}
                  onClick={() => {
                    setStageAction(st);
                    setAnimation(st);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'var(--color-primary, #6366F1)' : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${isActive ? 'var(--color-primary, #6366F1)' : 'var(--color-border, #334155)'}`,
                    color: isActive ? '#FFFFFF' : 'var(--color-text, #F8FAFC)',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const statBoxStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  borderRadius: '12px',
  padding: '12px',
  textAlign: 'center',
  border: '1px solid var(--color-border, #334155)',
};

const statNumberStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: 'var(--color-primary, #818CF8)',
  marginBottom: '4px',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--color-text-muted, #94A3B8)',
};

const tagStyle: React.CSSProperties = {
  fontSize: '10px',
  padding: '2px 6px',
  borderRadius: '4px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  color: 'var(--color-text-muted, #94A3B8)',
};
