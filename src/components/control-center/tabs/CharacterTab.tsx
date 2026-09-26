import React, { useState, useEffect, useRef } from 'react';
import { useLuluStore } from '../../../stores/useLuluStore';
import {
  AnimationState,
  CharacterProfile,
  CharacterRendererType,
  CharacterVisibility,
} from '../../../types';
import { StorageService } from '../../../services/storageService';
import { characterManager } from '../../../character/CharacterManager';
import { CharacterPackValidator } from '../../../character/CharacterPackValidator';

type StudioSubTab = 'basic' | 'appearance' | 'personality' | 'transform' | 'collider' | 'camera' | 'voice' | 'export';

export const CharacterTab: React.FC = () => {
  const {
    character,
    characters,
    setCharacter,
    settings,
    updateSettings,
    spendStars,
    updateCharacterCustomization,
    setAnimation,
    speak,
  } = useLuluStore();

  // Navigation Sub-Tab: Gallery, Studio, Live Preview Stage
  const [activeMainTab, setActiveMainTab] = useState<'gallery' | 'studio' | 'preview'>('gallery');

  // Gallery State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rendererFilter, setRendererFilter] = useState('all');
  const [loadByIdInput, setLoadByIdInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Studio State
  const [editingCharId, setEditingCharId] = useState<string>(character.id);
  const [studioSubTab, setStudioSubTab] = useState<StudioSubTab>('basic');
  const [studioDraft, setStudioDraft] = useState<CharacterProfile>({ ...character });

  // Accessories & Palette
  const [unlockedAccessories, setUnlockedAccessories] = useState<string[]>([
    'halo',
    'star_glasses',
  ]);

  const [currentRenderer, setCurrentRenderer] = useState<CharacterRendererType>(
    characterManager.getCurrentRendererType()
  );

  // Character Pack Validator State
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

  // Live Stage Canvas Viewport State
  const stageCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stageAction, setStageAction] = useState<AnimationState>('idle');
  const [stagePlaying, setStagePlaying] = useState<boolean>(true);
  const [stageFrame, setStageFrame] = useState<number>(0);

  // Load custom accessories
  useEffect(() => {
    StorageService.get<string[]>('unlocked_accessories', ['halo', 'star_glasses']).then((saved) => {
      if (saved) setUnlockedAccessories(saved);
    });
  }, []);

  // Sync draft when editing character changes
  useEffect(() => {
    const target = characterManager.getRoster().find((c) => c.id === editingCharId) || character;
    setStudioDraft({ ...target });
  }, [editingCharId, character]);

  // Stage animation loop
  useEffect(() => {
    let animId: number;
    const renderStage = () => {
      const canvas = stageCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const targetChar = activeMainTab === 'studio' ? studioDraft : character;
          const { renderer } = characterManager.getEffectiveRenderer(targetChar, currentRenderer);
          renderer.render({
            ctx,
            width: canvas.width,
            height: canvas.height,
            animationState: stageAction,
            animationFrame: stageFrame,
            facing: 'right',
            character: targetChar,
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
  }, [character, studioDraft, activeMainTab, currentRenderer, stageAction, stagePlaying, stageFrame]);

  // Gallery filtered characters
  const roster = characterManager.getRoster();
  const filteredCharacters = characterManager.searchCharacters({
    query: searchQuery,
    category: categoryFilter,
    renderer: rendererFilter,
  });

  const handleCopyId = (char: CharacterProfile) => {
    const idToCopy = char.character_id || char.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy);
      setCopiedId(idToCopy);
      setTimeout(() => setCopiedId(null), 2000);
      speak(`Copied ID ${idToCopy}! 📋`);
    }
  };

  const handleLoadById = () => {
    if (!loadByIdInput.trim()) return;
    const found = characterManager.getCharacterByLuluId(loadByIdInput);
    if (found) {
      setCharacter(found.id);
      speak(`Activated ${found.displayName} (${found.character_id || found.id})! ✨`);
      setLoadByIdInput('');
    } else {
      speak(`Character ID "${loadByIdInput}" not found in local registry.`);
    }
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = characterManager.toggleFavorite(id);
    speak(isFav ? 'Added to favorites! ⭐' : 'Removed from favorites.');
  };

  const handleExportPack = (char: CharacterProfile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const json = characterManager.exportCharacterPack(char);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${char.character_id || char.id}-pack.json`;
    a.click();
    URL.revokeObjectURL(url);
    speak(`Exported ${char.displayName} package! 📦`);
  };

  const handleBulkExport = () => {
    if (selectedIds.length === 0) return;
    const json = characterManager.bulkExport(selectedIds);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lulu-character-bundle-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    speak(`Exported ${selectedIds.length} characters! 📦`);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const count = characterManager.bulkDelete(selectedIds);
    setSelectedIds([]);
    speak(`Deleted ${count} custom characters.`);
  };

  const handleSaveStudioDraft = () => {
    characterManager.addCharacter(studioDraft);
    if (character.id === studioDraft.id) {
      updateCharacterCustomization(studioDraft);
    }
    speak(`Saved changes to ${studioDraft.displayName}! ✨`);
  };

  const handleCreateNewCompanion = () => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newChar: CharacterProfile = {
      id: `custom_${Date.now()}`,
      character_id: `LULU-${randomHex}`,
      name: 'New Companion',
      displayName: 'My Companion',
      description: 'An original desktop companion created in Lulu Character Studio.',
      category: 'user',
      renderer: 'pixel',
      scale: 1.0,
      defaultPosition: { x: 300, y: 300 },
      palette: {
        primary: '#6366F1',
        secondary: '#A5B4FC',
        accent: '#F59E0B',
        shadow: '#1E1B4B',
        glow: '#C7D2FE',
      },
      personality: {
        curiosity: 80,
        friendliness: 85,
        playfulness: 75,
        calmness: 70,
        focus: 75,
        energy: 80,
        social: 75,
        speakingStyle: 'warm, helpful',
        tone: 'cheerful',
      },
      scenario: 'Lives on your desktop to accompany your workflow.',
      first_message: 'Hello! I am ready to be your companion.',
      traits: ['friendly', 'helpful'],
      tags: ['custom'],
      visibility: 'private',
      unlocked: true,
      author: 'You',
      version: '1.0.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    characterManager.addCharacter(newChar);
    setEditingCharId(newChar.id);
    setStudioDraft(newChar);
    speak(`Created new companion ${newChar.character_id}! 🎨`);
  };

  const handleUnlockAccessory = (accId: string, cost: number) => {
    if (spendStars(cost)) {
      const updated = [...unlockedAccessories, accId];
      setUnlockedAccessories(updated);
      StorageService.set('unlocked_accessories', updated);
      const current = studioDraft.accessories || [];
      const withAcc = [...current, accId];
      setStudioDraft({ ...studioDraft, accessories: withAcc });
      updateCharacterCustomization({ accessories: withAcc });
      speak(`Unlocked ${accId}! Looks splendid! 🌟`);
    } else {
      speak('Not enough stars yet! Play games or complete achievements! ⭐');
    }
  };

  const auras = [
    { name: 'None', value: undefined, color: '#64748B' },
    { name: 'Celestial White', value: '#E0E7FF', color: '#E0E7FF' },
    { name: 'Starlight Gold', value: '#FDE68A', color: '#FDE68A' },
    { name: 'Cosmic Indigo', value: '#818CF8', color: '#818CF8' },
    { name: 'Cyber Cyan', value: 'rgba(6, 182, 212, 0.4)', color: '#06B6D4' },
    { name: 'Rose Quartz', value: '#F472B6', color: '#F472B6' },
  ];

  const ACCESSORIES = [
    { id: 'halo', name: 'Celestial Halo', cost: 0, icon: '😇' },
    { id: 'star_glasses', name: 'Star Glasses', cost: 0, icon: '⭐' },
    { id: 'cat_ears', name: 'Cat Ears', cost: 5, icon: '🐱' },
    { id: 'bow', name: 'Ribbon Bow', cost: 10, icon: '🎀' },
    { id: 'crown', name: 'Starlight Crown', cost: 15, icon: '👑' },
    { id: 'wizard_hat', name: 'Cosmic Wizard Hat', cost: 20, icon: '🧙' },
  ];

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Sub-Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
            Companion Platform & Character Studio
          </h3>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
            Original character roster, full studio editing suite, LULU-XXXX ID registry, and live stage testing.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveMainTab('gallery')}
            style={navTabBtnStyle(activeMainTab === 'gallery')}
          >
            🖼️ Character Gallery
          </button>
          <button
            onClick={() => setActiveMainTab('studio')}
            style={navTabBtnStyle(activeMainTab === 'studio')}
          >
            🛠️ Character Studio
          </button>
          <button
            onClick={() => setActiveMainTab('preview')}
            style={navTabBtnStyle(activeMainTab === 'preview')}
          >
            🎬 Live Preview Stage
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. CHARACTER GALLERY VIEW                                */}
      {/* ======================================================== */}
      {activeMainTab === 'gallery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Control Bar: Search, Category Filters, Load by ID */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-card, #1E293B)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Search input */}
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Search by Name, LULU-XXXX ID, Author, or Tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={textInputStyle}
                />
              </div>

              {/* Renderer Filter */}
              <select
                value={rendererFilter}
                onChange={(e) => setRendererFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Renderers</option>
                <option value="pixel">2D Pixel</option>
                <option value="skeletal_2d">2D Skeletal Vector</option>
                <option value="three_vrm">3D VRM</option>
                <option value="spritesheet">Universal Sprite Sheet</option>
              </select>

              {/* Load by ID Quick Input */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="LULU-XXXX"
                  value={loadByIdInput}
                  onChange={(e) => setLoadByIdInput(e.target.value.toUpperCase())}
                  style={{ ...textInputStyle, width: '130px', fontFamily: 'monospace' }}
                />
                <button onClick={handleLoadById} style={primaryActionBtnStyle}>
                  Load
                </button>
              </div>

              <button onClick={handleCreateNewCompanion} style={secondaryActionBtnStyle}>
                ✨ New Companion
              </button>
            </div>

            {/* Category Pills & Bulk Admin Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'all', label: 'All Characters' },
                  { id: 'favorites', label: '⭐ Favorites' },
                  { id: 'original', label: '🌟 Original Roster' },
                  { id: 'installed', label: '📥 Installed' },
                  { id: 'my_characters', label: '👤 My Characters' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: categoryFilter === cat.id ? 'var(--color-primary, #6366F1)' : 'rgba(255, 255, 255, 0.06)',
                      color: categoryFilter === cat.id ? '#FFFFFF' : 'var(--color-text-muted, #94A3B8)',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Bulk Admin Actions */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {selectedIds.length > 0 && (
                  <>
                    <span style={{ fontSize: '11px', color: '#818CF8' }}>
                      {selectedIds.length} Selected
                    </span>
                    <button onClick={handleBulkExport} style={miniBtnStyle}>
                      Export Selected
                    </button>
                    <button onClick={handleBulkDelete} style={{ ...miniBtnStyle, color: '#EF4444' }}>
                      Delete Selected
                    </button>
                    <button onClick={() => setSelectedIds([])} style={miniBtnStyle}>
                      Clear
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedIds(roster.map((c) => c.id))}
                  style={miniBtnStyle}
                >
                  Select All
                </button>
              </div>
            </div>
          </div>

          {/* Character Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {filteredCharacters.map((c) => {
              const isSelected = c.id === character.id;
              const isChecked = selectedIds.includes(c.id);

              return (
                <div
                  key={c.id}
                  style={{
                    backgroundColor: 'var(--color-bg-card, #1E293B)',
                    border: isSelected
                      ? '2px solid var(--color-primary, #818CF8)'
                      : '1px solid var(--color-border, #334155)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedIds((prev) =>
                            prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          );
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: c.palette.primary,
                          border: `2px solid ${c.palette.glow || c.palette.shadow}`,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {c.avatarUrl ? (
                          <img
                            src={c.avatarUrl}
                            alt={c.displayName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : null}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#F8FAFC' }}>
                          {c.displayName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            onClick={() => handleCopyId(c)}
                            title="Click to copy ID"
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '10px',
                              backgroundColor: 'rgba(99, 102, 241, 0.15)',
                              color: '#818CF8',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            {copiedId === (c.character_id || c.id) ? '✓ Copied' : (c.character_id || 'LULU-0001')}
                          </span>
                          <span style={{ fontSize: '10px', color: '#94A3B8' }}>
                            by {c.author || 'Lulu Core'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFavorite(c.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: c.is_favorite ? '#FBBF24' : '#64748B',
                      }}
                    >
                      {c.is_favorite ? '★' : '☆'}
                    </button>
                  </div>

                  {/* Description */}
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted, #94A3B8)', lineHeight: '1.4', minHeight: '32px' }}>
                    {c.description}
                  </p>

                  {/* Traits & Tags Pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={tagPillStyle}>{c.renderer || 'pixel'}</span>
                    <span style={tagPillStyle}>{c.visibility || 'public'}</span>
                    {c.traits?.slice(0, 2).map((t) => (
                      <span key={t} style={tagPillStyle}>{t}</span>
                    ))}
                  </div>

                  {/* Card Actions Footer */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button
                      onClick={() => {
                        setCharacter(c.id);
                        speak(`Switched companion to ${c.displayName}! ✨`);
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'var(--color-primary, #6366F1)',
                        border: `1px solid ${isSelected ? '#10B981' : 'transparent'}`,
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isSelected ? '✓ Active Pet' : '⚡ Activate'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCharId(c.id);
                        setActiveMainTab('studio');
                      }}
                      style={cardActionBtnStyle}
                      title="Edit in Studio"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={(e) => handleExportPack(c, e)}
                      style={cardActionBtnStyle}
                      title="Export Character Pack"
                    >
                      📦
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CHARACTER STUDIO VIEW                                 */}
      {/* ======================================================== */}
      {activeMainTab === 'studio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Studio Header Bar */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-card, #1E293B)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-muted, #94A3B8)' }}>Editing Companion:</span>
              <select
                value={editingCharId}
                onChange={(e) => setEditingCharId(e.target.value)}
                style={selectStyle}
              >
                {roster.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName} ({c.character_id || 'LULU-0001'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSaveStudioDraft} style={primaryActionBtnStyle}>
                💾 Save Companion
              </button>
              <button
                onClick={() => {
                  setCharacter(studioDraft.id);
                  speak(`Applied ${studioDraft.displayName} to desktop! ✨`);
                }}
                style={secondaryActionBtnStyle}
              >
                ⚡ Apply to Desktop
              </button>
            </div>
          </div>

          {/* Studio Sub-Navigation Tabs */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--color-border, #334155)', paddingBottom: '10px' }}>
            {[
              { id: 'basic' as StudioSubTab, label: '📋 Basic Info' },
              { id: 'appearance' as StudioSubTab, label: '🎨 Appearance' },
              { id: 'personality' as StudioSubTab, label: '🧠 Personality' },
              { id: 'transform' as StudioSubTab, label: '📐 Transform' },
              { id: 'collider' as StudioSubTab, label: '📦 Collider' },
              { id: 'camera' as StudioSubTab, label: '📷 Camera' },
              { id: 'voice' as StudioSubTab, label: '🎙️ Voice' },
              { id: 'export' as StudioSubTab, label: '📦 Publish & Export' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStudioSubTab(st.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: studioSubTab === st.id ? 'var(--color-primary, #6366F1)' : 'rgba(255, 255, 255, 0.05)',
                  color: studioSubTab === st.id ? '#FFFFFF' : 'var(--color-text-muted, #94A3B8)',
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Studio Tab Content Panel */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-card, #1E293B)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            {/* SUB-TAB: BASIC INFO */}
            {studioSubTab === 'basic' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Companion Display Name</label>
                  <input
                    type="text"
                    value={studioDraft.displayName}
                    onChange={(e) => setStudioDraft({ ...studioDraft, displayName: e.target.value })}
                    style={textInputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Character ID (LULU-XXXX)</label>
                  <input
                    type="text"
                    value={studioDraft.character_id || 'LULU-0001'}
                    onChange={(e) => setStudioDraft({ ...studioDraft, character_id: e.target.value.toUpperCase() })}
                    style={{ ...textInputStyle, fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Description & Persona Lore</label>
                  <textarea
                    rows={3}
                    value={studioDraft.description}
                    onChange={(e) => setStudioDraft({ ...studioDraft, description: e.target.value })}
                    style={{ ...textInputStyle, resize: 'vertical' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Author</label>
                  <input
                    type="text"
                    value={studioDraft.author || ''}
                    onChange={(e) => setStudioDraft({ ...studioDraft, author: e.target.value })}
                    style={textInputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Visibility</label>
                  <select
                    value={studioDraft.visibility || 'private'}
                    onChange={(e) => setStudioDraft({ ...studioDraft, visibility: e.target.value as CharacterVisibility })}
                    style={selectStyle}
                  >
                    <option value="private">Private (Local Only)</option>
                    <option value="local_only">Local Multi-User</option>
                    <option value="shared">Shared</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
            )}

            {/* SUB-TAB: APPEARANCE & COLORS */}
            {studioSubTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '15px' }}>Color Palette Palette Tuning</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                  {(['primary', 'secondary', 'accent', 'shadow', 'glow'] as const).map((colorKey) => (
                    <div key={colorKey}>
                      <label style={labelStyle}>{colorKey.toUpperCase()}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="color"
                          value={studioDraft.palette[colorKey] || '#FFFFFF'}
                          onChange={(e) =>
                            setStudioDraft({
                              ...studioDraft,
                              palette: { ...studioDraft.palette, [colorKey]: e.target.value },
                            })
                          }
                          style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={studioDraft.palette[colorKey]}
                          onChange={(e) =>
                            setStudioDraft({
                              ...studioDraft,
                              palette: { ...studioDraft.palette, [colorKey]: e.target.value },
                            })
                          }
                          style={{ ...textInputStyle, fontSize: '11px', fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Aura Tuning */}
                <div>
                  <label style={labelStyle}>Celestial Aura</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {auras.map((a) => (
                      <button
                        key={a.name}
                        onClick={() => setStudioDraft({ ...studioDraft, aura: a.value })}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: studioDraft.aura === a.value ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${studioDraft.aura === a.value ? '#818CF8' : '#334155'}`,
                          color: '#F8FAFC',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accessories Closet */}
                <div>
                  <label style={labelStyle}>Equipped Accessories</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {ACCESSORIES.map((acc) => {
                      const isEquipped = studioDraft.accessories?.includes(acc.id);
                      const isUnlocked = unlockedAccessories.includes(acc.id);

                      return (
                        <button
                          key={acc.id}
                          onClick={() => {
                            if (!isUnlocked) {
                              handleUnlockAccessory(acc.id, acc.cost);
                              return;
                            }
                            const current = studioDraft.accessories || [];
                            const updated = isEquipped
                              ? current.filter((a) => a !== acc.id)
                              : [...current, acc.id];
                            setStudioDraft({ ...studioDraft, accessories: updated });
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: isEquipped ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${isEquipped ? '#10B981' : '#334155'}`,
                            color: '#F8FAFC',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {acc.icon} {acc.name} {isEquipped ? '✓' : ''} {!isUnlocked ? `(${acc.cost}⭐)` : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: PERSONALITY EDITOR */}
            {studioSubTab === 'personality' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Scenario & Context</label>
                    <textarea
                      rows={2}
                      value={studioDraft.scenario || ''}
                      onChange={(e) => setStudioDraft({ ...studioDraft, scenario: e.target.value })}
                      placeholder="e.g. Lives on your desktop to pair-program and assist."
                      style={textInputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>First Message / Greeting</label>
                    <textarea
                      rows={2}
                      value={studioDraft.first_message || ''}
                      onChange={(e) => setStudioDraft({ ...studioDraft, first_message: e.target.value })}
                      placeholder="e.g. 01001000 01101001! System initialized."
                      style={textInputStyle}
                    />
                  </div>
                </div>

                {/* Traits selector pills */}
                <div>
                  <label style={labelStyle}>Personality Traits</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {['friendly', 'curious', 'developer', 'playful', 'calm', 'stoic', 'scholarly', 'analytical', 'witty', 'poetic'].map((trait) => {
                      const hasTrait = studioDraft.traits?.includes(trait);
                      return (
                        <button
                          key={trait}
                          onClick={() => {
                            const current = studioDraft.traits || [];
                            const updated = hasTrait
                              ? current.filter((t) => t !== trait)
                              : [...current, trait];
                            setStudioDraft({ ...studioDraft, traits: updated });
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            backgroundColor: hasTrait ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${hasTrait ? '#818CF8' : '#334155'}`,
                            color: hasTrait ? '#818CF8' : '#94A3B8',
                          }}
                        >
                          {trait} {hasTrait ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slider values */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Curiosity</span>
                      <span>{studioDraft.personality.curiosity}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={studioDraft.personality.curiosity}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          personality: { ...studioDraft.personality, curiosity: Number(e.target.value) },
                        })
                      }
                      style={{ width: '100%', accentColor: '#818CF8' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Playfulness</span>
                      <span>{studioDraft.personality.playfulness}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={studioDraft.personality.playfulness}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          personality: { ...studioDraft.personality, playfulness: Number(e.target.value) },
                        })
                      }
                      style={{ width: '100%', accentColor: '#818CF8' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>Focus</span>
                      <span>{studioDraft.personality.focus}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={studioDraft.personality.focus}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          personality: { ...studioDraft.personality, focus: Number(e.target.value) },
                        })
                      }
                      style={{ width: '100%', accentColor: '#818CF8' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: TRANSFORM EDITOR */}
            {studioSubTab === 'transform' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '15px' }}>Transform & Scale Tuning</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() =>
                        setStudioDraft({
                          ...studioDraft,
                          transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: 1.0 },
                        })
                      }
                      style={miniBtnStyle}
                    >
                      Reset
                    </button>
                    <button
                      onClick={() =>
                        setStudioDraft({
                          ...studioDraft,
                          transform: {
                            ...studioDraft.transform,
                            position: { x: 0, y: 0, z: 0 },
                            rotation: studioDraft.transform?.rotation || { x: 0, y: 0, z: 0 },
                            scale: studioDraft.scale || 1.0,
                          },
                        })
                      }
                      style={miniBtnStyle}
                    >
                      Center
                    </button>
                    <button
                      onClick={() =>
                        setStudioDraft({
                          ...studioDraft,
                          transform: {
                            position: studioDraft.transform?.position || { x: 0, y: 0, z: 0 },
                            rotation: {
                              x: studioDraft.transform?.rotation?.x || 0,
                              y: (studioDraft.transform?.rotation?.y || 0) + 180,
                              z: studioDraft.transform?.rotation?.z || 0,
                            },
                            scale: studioDraft.scale || 1.0,
                          },
                        })
                      }
                      style={miniBtnStyle}
                    >
                      Flip 180°
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Position X</label>
                    <input
                      type="number"
                      value={studioDraft.transform?.position?.x || 0}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          transform: {
                            rotation: studioDraft.transform?.rotation || { x: 0, y: 0, z: 0 },
                            scale: studioDraft.scale || 1.0,
                            position: {
                              x: Number(e.target.value),
                              y: studioDraft.transform?.position?.y || 0,
                              z: studioDraft.transform?.position?.z || 0,
                            },
                          },
                        })
                      }
                      style={textInputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Position Y</label>
                    <input
                      type="number"
                      value={studioDraft.transform?.position?.y || 0}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          transform: {
                            rotation: studioDraft.transform?.rotation || { x: 0, y: 0, z: 0 },
                            scale: studioDraft.scale || 1.0,
                            position: {
                              x: studioDraft.transform?.position?.x || 0,
                              y: Number(e.target.value),
                              z: studioDraft.transform?.position?.z || 0,
                            },
                          },
                        })
                      }
                      style={textInputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Scale Factor</label>
                    <input
                      type="number"
                      step={0.1}
                      min={0.5}
                      max={3.0}
                      value={studioDraft.scale}
                      onChange={(e) => setStudioDraft({ ...studioDraft, scale: Number(e.target.value) })}
                      style={textInputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: COLLIDER EDITOR */}
            {studioSubTab === 'collider' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '15px' }}>Interaction & Placement Collider</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                  Defines the bounding box used for dragging, window docking, and cursor clicks.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Width (px)</label>
                    <input
                      type="number"
                      value={studioDraft.collider?.width || 120}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          collider: {
                            height: studioDraft.collider?.height || 120,
                            depth: studioDraft.collider?.depth || 40,
                            centerX: studioDraft.collider?.centerX || 0,
                            centerY: studioDraft.collider?.centerY || 0,
                            centerZ: studioDraft.collider?.centerZ || 0,
                            width: Number(e.target.value),
                          },
                        })
                      }
                      style={textInputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Height (px)</label>
                    <input
                      type="number"
                      value={studioDraft.collider?.height || 120}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          collider: {
                            width: studioDraft.collider?.width || 120,
                            depth: studioDraft.collider?.depth || 40,
                            centerX: studioDraft.collider?.centerX || 0,
                            centerY: studioDraft.collider?.centerY || 0,
                            centerZ: studioDraft.collider?.centerZ || 0,
                            height: Number(e.target.value),
                          },
                        })
                      }
                      style={textInputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Depth (px)</label>
                    <input
                      type="number"
                      value={studioDraft.collider?.depth || 40}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          collider: {
                            width: studioDraft.collider?.width || 120,
                            height: studioDraft.collider?.height || 120,
                            centerX: studioDraft.collider?.centerX || 0,
                            centerY: studioDraft.collider?.centerY || 0,
                            centerZ: studioDraft.collider?.centerZ || 0,
                            depth: Number(e.target.value),
                          },
                        })
                      }
                      style={textInputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: CAMERA SETTINGS */}
            {studioSubTab === 'camera' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '15px' }}>3D Viewport & Camera Configuration</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Camera Mode</label>
                    <select
                      value={studioDraft.camera?.mode || 'close'}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          camera: {
                            distance: studioDraft.camera?.distance || 2.5,
                            fov: studioDraft.camera?.fov || 45,
                            target: studioDraft.camera?.target || { x: 0, y: 0, z: 0 },
                            position: studioDraft.camera?.position || { x: 0, y: 0, z: 2.5 },
                            zoom: studioDraft.camera?.zoom || 1.0,
                            mode: e.target.value as any,
                          },
                        })
                      }
                      style={selectStyle}
                    >
                      <option value="close">Close View</option>
                      <option value="far">Far View</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Distance</label>
                    <input
                      type="number"
                      step={0.1}
                      value={studioDraft.camera?.distance || 2.5}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          camera: {
                            mode: studioDraft.camera?.mode || 'close',
                            fov: studioDraft.camera?.fov || 45,
                            target: studioDraft.camera?.target || { x: 0, y: 0, z: 0 },
                            position: studioDraft.camera?.position || { x: 0, y: 0, z: 2.5 },
                            zoom: studioDraft.camera?.zoom || 1.0,
                            distance: Number(e.target.value),
                          },
                        })
                      }
                      style={textInputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>FOV (°)</label>
                    <input
                      type="number"
                      value={studioDraft.camera?.fov || 45}
                      onChange={(e) =>
                        setStudioDraft({
                          ...studioDraft,
                          camera: {
                            mode: studioDraft.camera?.mode || 'close',
                            distance: studioDraft.camera?.distance || 2.5,
                            target: studioDraft.camera?.target || { x: 0, y: 0, z: 0 },
                            position: studioDraft.camera?.position || { x: 0, y: 0, z: 2.5 },
                            zoom: studioDraft.camera?.zoom || 1.0,
                            fov: Number(e.target.value),
                          },
                        })
                      }
                      style={textInputStyle}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: VOICE */}
            {studioSubTab === 'voice' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Voice Engine Provider</label>
                  <select
                    value={studioDraft.voice_provider || 'local_tts'}
                    onChange={(e) => setStudioDraft({ ...studioDraft, voice_provider: e.target.value as any })}
                    style={selectStyle}
                  >
                    <option value="local_tts">Local Web Speech Synthesis</option>
                    <option value="piper">Piper Neural TTS (Offline Fast)</option>
                    <option value="espeak-ng">eSpeak-NG (Linux Native)</option>
                    <option value="mock">Mute / Text Only</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Language Code</label>
                  <input
                    type="text"
                    value={studioDraft.language || 'en-US'}
                    onChange={(e) => setStudioDraft({ ...studioDraft, language: e.target.value })}
                    style={textInputStyle}
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB: PUBLISH & EXPORT */}
            {studioSubTab === 'export' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '15px' }}>Publish & Character Pack Package</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
                  Export compliant `manifest.json` character packs or validate community manifests.
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleExportPack(studioDraft)} style={primaryActionBtnStyle}>
                    📦 Download {studioDraft.displayName} Pack
                  </button>
                  <button
                    onClick={() => {
                      const res = CharacterPackValidator.validateManifest(JSON.parse(characterManager.exportCharacterPack(studioDraft)));
                      setPackValidationResult(res);
                      speak(res.valid ? 'Manifest validation passed 100%! ✅' : 'Validation errors found.');
                    }}
                    style={secondaryActionBtnStyle}
                  >
                    ✓ Validate Manifest
                  </button>
                </div>

                {packValidationResult && (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: packValidationResult.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${packValidationResult.valid ? '#10B981' : '#EF4444'}`,
                      fontSize: '12px',
                      color: '#F8FAFC',
                    }}
                  >
                    {packValidationResult.valid ? '✅ Manifest is valid and safe for distribution.' : '❌ Manifest failed validation:'}
                    {packValidationResult.errors.map((e, idx) => (
                      <div key={idx} style={{ color: '#FCA5A5', marginTop: '4px' }}>• {e}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. LIVE PREVIEW STAGE VIEW                               */}
      {/* ======================================================== */}
      {activeMainTab === 'preview' && (
        <div
          style={{
            backgroundColor: 'var(--color-bg-card, #1E293B)',
            border: '1px solid var(--color-border, #334155)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              style={primaryActionBtnStyle}
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
              <span style={hudPillStyle('#38BDF8')}>Action: {stageAction}</span>
              <span style={hudPillStyle('#10B981')}>Frame: {Math.floor(stageFrame)}/60</span>
            </div>

            <div style={{ position: 'absolute', top: '12px', right: '12px', pointerEvents: 'none' }}>
              <span style={hudPillStyle('#A855F7')}>Scale: 1.5x</span>
            </div>
          </div>

          {/* Transport Controls & Scrubber */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              padding: '10px 16px',
              borderRadius: '10px',
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
              style={miniBtnStyle}
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
                style={{ flex: 1, accentColor: 'var(--color-primary, #6366F1)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#F8FAFC', minWidth: '50px', textAlign: 'right' }}>
                {Math.floor(stageFrame)} / 60
              </span>
            </div>
          </div>

          {/* Action Selector Buttons */}
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
                    }}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const navTabBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  backgroundColor: active ? 'var(--color-primary, #6366F1)' : 'transparent',
  color: active ? '#FFFFFF' : 'var(--color-text-muted, #94A3B8)',
  transition: 'all 0.15s ease',
});

const textInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-border, #334155)',
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  color: 'var(--color-text, #F8FAFC)',
  fontSize: '12px',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-border, #334155)',
  backgroundColor: '#1E293B',
  color: 'var(--color-text, #F8FAFC)',
  fontSize: '12px',
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--color-text-muted, #94A3B8)',
  display: 'block',
  marginBottom: '6px',
};

const primaryActionBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '8px',
  backgroundColor: 'var(--color-primary, #6366F1)',
  border: 'none',
  color: '#FFFFFF',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryActionBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '8px',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid var(--color-border, #334155)',
  color: '#F8FAFC',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const miniBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '6px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid var(--color-border, #334155)',
  color: 'var(--color-text, #F8FAFC)',
  fontSize: '11px',
  cursor: 'pointer',
};

const cardActionBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: '6px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid var(--color-border, #334155)',
  color: 'var(--color-text, #F8FAFC)',
  fontSize: '11px',
  cursor: 'pointer',
};

const tagPillStyle: React.CSSProperties = {
  fontSize: '10px',
  padding: '2px 6px',
  borderRadius: '4px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  color: 'var(--color-text-muted, #94A3B8)',
};

const hudPillStyle = (color: string): React.CSSProperties => ({
  backgroundColor: 'rgba(0,0,0,0.65)',
  color,
  fontSize: '11px',
  fontFamily: 'monospace',
  padding: '2px 8px',
  borderRadius: '6px',
  border: `1px solid ${color}40`,
});
