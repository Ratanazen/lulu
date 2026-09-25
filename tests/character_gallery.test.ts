import { describe, it, expect } from 'vitest';
import { characterManager } from '../src/character/CharacterManager';
import { useLuluStore } from '../src/stores/useLuluStore';

describe('Lulu Character Platform: ID System, Gallery, Studio, & Agent Sync', () => {
  it('correctly resolves characters by LULU-XXXX IDs from local registry', () => {
    // Standard default Lulu
    const lulu = characterManager.getCharacterByLuluId('LULU-0001');
    expect(lulu).toBeDefined();
    expect(lulu?.displayName).toBe('Lulu');
    expect(lulu?.character_id).toBe('LULU-0001');

    // Cyber Alien Coder (Nexus)
    const nexus = characterManager.getCharacterByLuluId('LULU-7A91');
    expect(nexus).toBeDefined();
    expect(nexus?.displayName).toContain('Nexus');
    expect(nexus?.character_id).toBe('LULU-7A91');

    // Case-insensitive lookup
    const lowerLookup = characterManager.getCharacterByLuluId('lulu-7a91');
    expect(lowerLookup).toBeDefined();
    expect(lowerLookup?.id).toBe('nexus_bot');

    // Unknown ID returns undefined without remote requests
    const unknown = characterManager.getCharacterByLuluId('LULU-9999');
    expect(unknown).toBeUndefined();
  });

  it('searches and filters characters by name, ID, author, tags, and renderer', () => {
    // Search by name
    const byName = characterManager.searchCharacters({ query: 'Ninja' });
    expect(byName.length).toBeGreaterThanOrEqual(1);
    expect(byName.some((c) => c.displayName.includes('Ninja') || c.displayName.includes('Shinobi'))).toBe(true);

    // Search by LULU ID
    const byId = characterManager.searchCharacters({ query: 'LULU-0001' });
    expect(byId.length).toBe(1);
    expect(byId[0].id).toBe('lulu');

    // Search by tag
    const byTag = characterManager.searchCharacters({ query: 'rust' });
    expect(byTag.length).toBeGreaterThanOrEqual(1);
    expect(byTag[0].id).toBe('nexus_bot');

    // Filter by renderer
    const pixelOnly = characterManager.searchCharacters({ renderer: 'pixel' });
    expect(pixelOnly.every((c) => (c.renderer || 'pixel') === 'pixel')).toBe(true);

    const skeletalOnly = characterManager.searchCharacters({ renderer: 'skeletal_2d' });
    expect(skeletalOnly.every((c) => c.renderer === 'skeletal_2d')).toBe(true);
  });

  it('toggles favorites and filters by favorites list', () => {
    characterManager.toggleFavorite('nexus_bot');
    const favs = characterManager.searchCharacters({ category: 'favorites' });
    expect(favs.some((c) => c.id === 'nexus_bot')).toBe(true);

    // Toggle back
    characterManager.toggleFavorite('nexus_bot');
  });

  it('exports compliant manifest.json with format_version: 1 and character_id', () => {
    const lulu = characterManager.getCharacterByLuluId('LULU-0001')!;
    const packJson = characterManager.exportCharacterPack(lulu);

    const parsed = JSON.parse(packJson);
    expect(parsed.format_version).toBe(1);
    expect(parsed.character_id).toBe('LULU-0001');
    expect(parsed.name).toBe('Lulu');
    expect(parsed.renderer).toBe('pixel');
    expect(parsed.personality).toBeDefined();
    expect(parsed.transform).toBeDefined();
    expect(parsed.collider).toBeDefined();
  });

  it('imports valid character packs safely into local custom library', () => {
    const customPack = JSON.stringify({
      format_version: 1,
      character_id: 'LULU-9X9X',
      name: 'Aether Knight',
      description: 'A valiant starlight guardian created by user.',
      renderer: 'skeletal_2d',
      version: '1.0.0',
      personality: {
        curiosity: 75,
        friendliness: 90,
        playfulness: 70,
        calmness: 85,
        focus: 90,
        energy: 80,
        social: 80,
      },
      traits: ['valiant', 'guardian'],
      tags: ['knight', 'custom'],
    });

    const res = characterManager.importCharacterPack(customPack);
    expect(res.success).toBe(true);
    expect(res.character).toBeDefined();
    expect(res.character?.character_id).toBe('LULU-9X9X');

    // Confirm it is retrievable by ID
    const found = characterManager.getCharacterByLuluId('LULU-9X9X');
    expect(found).toBeDefined();
    expect(found?.displayName).toBe('Aether Knight');
  });

  it('performs bulk export and bulk deletion cleanly', () => {
    // Add two test custom characters
    characterManager.importCharacterPack(JSON.stringify({
      name: 'Temp 1',
      character_id: 'LULU-TMP1',
    }));
    characterManager.importCharacterPack(JSON.stringify({
      name: 'Temp 2',
      character_id: 'LULU-TMP2',
    }));

    // Bulk Export
    const exportedBundle = characterManager.bulkExport(['LULU-TMP1', 'LULU-TMP2']);
    const parsedBundle = JSON.parse(exportedBundle);
    expect(parsedBundle.count).toBe(2);
    expect(parsedBundle.characters.length).toBe(2);

    // Bulk Delete
    const deletedCount = characterManager.bulkDelete(['LULU-TMP1', 'LULU-TMP2']);
    expect(deletedCount).toBe(2);
    expect(characterManager.getCharacterByLuluId('LULU-TMP1')).toBeUndefined();
    expect(characterManager.getCharacterByLuluId('LULU-TMP2')).toBeUndefined();
  });

  it('synchronizes AI agent task states to desktop character animations and emotions', () => {
    const store = useLuluStore.getState();

    // Thinking state
    store.syncAgentState('thinking');
    expect(useLuluStore.getState().animationState).toBe('curious');
    expect(useLuluStore.getState().mood).toBe('curious');

    // Working state
    store.syncAgentState('working');
    expect(useLuluStore.getState().animationState).toBe('read');
    expect(useLuluStore.getState().mood).toBe('focused');

    // Success state
    store.syncAgentState('success');
    expect(useLuluStore.getState().animationState).toBe('celebrate');
    expect(useLuluStore.getState().mood).toBe('excited');

    // Error state
    store.syncAgentState('error');
    expect(useLuluStore.getState().animationState).toBe('dizzy');
    expect(useLuluStore.getState().mood).toBe('tired');

    // Cancelled state
    store.syncAgentState('cancelled');
    expect(useLuluStore.getState().animationState).toBe('sit');
    expect(useLuluStore.getState().mood).toBe('calm');
  });
});
