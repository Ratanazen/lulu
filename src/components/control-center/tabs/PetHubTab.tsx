import React, { useState, useEffect, useRef } from 'react';
import { useLuluStore } from '../../../stores/useLuluStore';
import { Skeletal2DRenderer } from '../../../character/renderers/Skeletal2DRenderer';
import { soundService } from '../../../services/soundService';
import { particleSystem } from '../../../animation/particleSystem';
import { MessageSquare, Mic, Star, Palette, Check, Plus } from 'lucide-react';
import { CustomizeLuluModal } from './CustomizeLuluModal';

interface PetCardMeta {
  id: string;
  name: string;
  badge?: string;
  role: string;
  color: string;
  icon: string;
  desc: string;
}

const OFFICIAL_PETS: PetCardMeta[] = [
  {
    id: 'lulu',
    name: 'Lulu',
    badge: 'Pet',
    role: 'Companion',
    color: '#818CF8',
    icon: '✨',
    desc: 'Celestial star companion that watches over your daily tasks.',
  },
  {
    id: 'neko',
    name: 'Neko',
    badge: 'Pet',
    role: 'Curious',
    color: '#F43F5E',
    icon: '🐱',
    desc: 'Curious agile cat spirit that loves chasing cursors and window trails.',
  },
  {
    id: 'robo',
    name: 'Robo',
    badge: 'Pet',
    role: 'Tech',
    color: '#06B6D4',
    icon: '🤖',
    desc: 'High-tech AI droid equipped with system telemetry and dev tools.',
  },
  {
    id: 'mochi',
    name: 'Mochi',
    role: 'Friendly',
    color: '#EC4899',
    icon: '🌸',
    desc: 'Soft marshmallow fluff friend that brings warmth and comfort.',
  },
  {
    id: 'pixel',
    name: 'Pixel',
    role: 'Coding',
    color: '#10B981',
    icon: '💻',
    desc: 'Retro 8-bit coding buddy that pairs on code and terminal sessions.',
  },
  {
    id: 'sprout',
    name: 'Sprout',
    role: 'Nature',
    color: '#84CC16',
    icon: '🌱',
    desc: 'Peaceful botanical seedling that encourages breaks and hydration.',
  },
];

export const PetHubTab: React.FC = () => {
  const {
    character,
    setCharacter,
    setChatOpen,
    setActiveTab,
    mood,
    speak,
  } = useLuluStore();

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lulu_favorite_pets');
      return saved ? JSON.parse(saved) : ['lulu'];
    } catch {
      return ['lulu'];
    }
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<Skeletal2DRenderer>(new Skeletal2DRenderer());

  const isFavorite = favorites.includes(character.id);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      try {
        localStorage.setItem('lulu_favorite_pets', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    soundService.play('click', 'ui');
  };

  const handleSelectPet = (petId: string) => {
    setCharacter(petId);
    soundService.play('chirp', 'ui');
    particleSystem.spawnSparkles(window.innerWidth / 2, window.innerHeight / 2, '#818CF8', 16);
  };

  const handleVoiceGreeting = () => {
    const text = character.first_message || `Hello! I am ${character.name}, your desktop companion.`;
    speak(text, 'chat', 2);
    soundService.play('chirp', 'ui');
  };

  // Live Canvas Render Loop for Previewing the Active Pet
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      rendererRef.current.render({
        ctx,
        width: canvas.width,
        height: canvas.height,
        animationState: 'idle',
        animationFrame: frame,
        facing: 'right',
        character,
        mouthShape: 'smile',
        scale: 1.15,
      });

      frame += 0.05;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [character]);

  if (isCustomizing) {
    return (
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <CustomizeLuluModal onBack={() => setIsCustomizing(false)} isEmbedded />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '820px', margin: '0 auto' }}>
      {/* 1. Header Banner */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '0.05em', color: '#F8FAFC' }}>
            LULU PET HUB
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--color-primary, #818CF8)', fontWeight: 600 }}>
            🐾 Active Companion Hub
          </span>
        </div>
        <div style={{ height: '1px', backgroundColor: 'var(--color-border, #334155)', width: '100%' }} />
      </div>

      {/* 2. Lulu Mini Hero Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '20px',
          padding: '24px 28px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle radial ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            height: '280px',
            background: `radial-gradient(circle, ${character.palette.primary}33 0%, rgba(0, 0, 0, 0) 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Title & Subtitle */}
        <h3 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 800, color: '#FFFFFF' }}>
          {character.name} Mini
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--color-text-muted, #94A3B8)' }}>
          A tiny companion that stays with you.
        </p>

        {/* Live Character Canvas Preview */}
        <div
          style={{
            position: 'relative',
            width: '160px',
            height: '160px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            border: `2px solid ${character.palette.primary}55`,
            boxShadow: `0 0 24px ${character.palette.primary}33`,
            marginBottom: '18px',
          }}
        >
          <canvas ref={canvasRef} width={160} height={160} style={{ display: 'block' }} />
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              backgroundColor: '#0F172A',
              border: `1px solid ${character.palette.primary}`,
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Mood:</span>
            <span style={{ color: character.palette.primary, textTransform: 'capitalize' }}>{mood}</span>
          </div>
        </div>

        {/* Action Buttons: [Chat] [Voice] [Favorite] */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', width: '100%', maxWidth: '380px' }}>
          <button
            onClick={() => setChatOpen(true)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--color-border, #334155)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#F8FAFC',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
          >
            <MessageSquare size={16} color="var(--color-primary, #818CF8)" />
            <span>Chat</span>
          </button>

          <button
            onClick={handleVoiceGreeting}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--color-border, #334155)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#F8FAFC',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
          >
            <Mic size={16} color="#34D399" />
            <span>Voice</span>
          </button>

          <button
            onClick={() => toggleFavorite(character.id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '12px',
              border: isFavorite ? '1px solid #F59E0B' : '1px solid var(--color-border, #334155)',
              backgroundColor: isFavorite ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              color: isFavorite ? '#FDE68A' : '#F8FAFC',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isFavorite ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.12)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isFavorite ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.06)')}
          >
            <Star size={16} color={isFavorite ? '#F59E0B' : '#94A3B8'} fill={isFavorite ? '#F59E0B' : 'none'} />
            <span>Favorite</span>
          </button>
        </div>

        {/* Secondary Button: [Customize] */}
        <button
          onClick={() => {
            setIsCustomizing(true);
            soundService.play('click', 'ui');
          }}
          style={{
            width: '100%',
            maxWidth: '380px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '11px 16px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--color-primary, #818CF8) 0%, #6366F1 100%)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Palette size={16} />
          <span>Customize</span>
        </button>
      </div>

      {/* 3. Choose / Create Pet Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, letterSpacing: '0.04em', color: '#F8FAFC' }}>
            CREATE / CHOOSE PET
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted, #94A3B8)' }}>
            Click to switch companion
          </span>
        </div>
        <div style={{ height: '1px', backgroundColor: 'var(--color-border, #334155)', width: '100%', marginBottom: '16px' }} />

        {/* 3x2 Pet Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px',
          }}
        >
          {OFFICIAL_PETS.map((pet) => {
            const isCurrent = character.id === pet.id;
            const fav = favorites.includes(pet.id);

            return (
              <div
                key={pet.id}
                onClick={() => handleSelectPet(pet.id)}
                style={{
                  backgroundColor: 'var(--color-bg-card, #1E293B)',
                  border: isCurrent
                    ? `2px solid ${pet.color}`
                    : '1px solid var(--color-border, #334155)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '140px',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: isCurrent ? `0 0 18px ${pet.color}33` : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) e.currentTarget.style.borderColor = pet.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) e.currentTarget.style.borderColor = 'var(--color-border, #334155)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Top Row: Pet Name & Tag */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '18px' }}>{pet.icon}</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC' }}>{pet.name}</span>
                    </div>

                    <button
                      onClick={(e) => toggleFavorite(pet.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '2px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={fav ? 'Favorited' : 'Add to Favorites'}
                    >
                      <Star size={14} color={fav ? '#F59E0B' : '#64748B'} fill={fav ? '#F59E0B' : 'none'} />
                    </button>
                  </div>

                  {pet.badge && (
                    <div style={{ marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: `${pet.color}22`,
                          color: pet.color,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: `1px solid ${pet.color}44`,
                        }}
                      >
                        {pet.badge}
                      </span>
                    </div>
                  )}

                  <p
                    style={{
                      margin: '6px 0 0 0',
                      fontSize: '11px',
                      color: 'var(--color-text-muted, #94A3B8)',
                      lineHeight: '1.4',
                    }}
                  >
                    {pet.desc}
                  </p>
                </div>

                {/* Bottom Row: Role & Active Indicator */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '12px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: pet.color }}>
                    {pet.role}
                  </span>

                  {isCurrent ? (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#34D399',
                        backgroundColor: 'rgba(52, 211, 153, 0.15)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      <Check size={12} /> Active
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#64748B' }}>Choose</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Custom Pet Row */}
        <div style={{ marginTop: '14px' }}>
          <div
            onClick={() => setActiveTab('character')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              borderRadius: '14px',
              border: '2px dashed var(--color-border, #334155)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              color: 'var(--color-text-muted, #94A3B8)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary, #818CF8)';
              e.currentTarget.style.color = '#F8FAFC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border, #334155)';
              e.currentTarget.style.color = 'var(--color-text-muted, #94A3B8)';
            }}
          >
            <Plus size={16} color="var(--color-primary, #818CF8)" />
            <span>+ Create Custom Pet in Character Studio</span>
          </div>
        </div>
      </div>
    </div>
  );
};
