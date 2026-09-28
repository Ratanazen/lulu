import { describe, it, expect } from 'vitest';
import { characterManager } from '../src/character/CharacterManager';
import { LipSyncController } from '../src/character/LipSyncController';
import { CharacterPackValidator } from '../src/character/CharacterPackValidator';
import { ANIME_CHARACTERS } from '../src/character/animePresets';
import { OFFICIAL_CHARACTERS } from '../src/character/index';
import { MouthShape } from '../src/types';

describe('Multi-Renderer Character Engine & Anime Character Platform', () => {
  it('registers all standard renderers and checks capability', () => {
    const caps = characterManager.getRendererCapabilities();
    expect(caps.length).toBeGreaterThanOrEqual(3);

    const pixelCap = caps.find((c) => c.rendererId === 'pixel');
    expect(pixelCap).toBeDefined();
    expect(pixelCap?.supported).toBe(true);

    const skeletalCap = caps.find((c) => c.rendererId === 'skeletal_2d');
    expect(skeletalCap).toBeDefined();
    expect(skeletalCap?.supported).toBe(true);

    const threeCap = caps.find((c) => c.rendererId === 'three_vrm');
    expect(threeCap).toBeDefined();
  });

  it('correctly resolves effective renderer and handles unsupported fallbacks', () => {
    // Official character with pixel renderer
    const lulu = OFFICIAL_CHARACTERS[0];
    const resLulu = characterManager.getEffectiveRenderer({ ...lulu, renderer: 'pixel' });
    expect(resLulu.renderer.id).toBe('pixel');
    expect(resLulu.usedFallback).toBe(false);

    // Anime character with skeletal_2d renderer
    const shinobi = ANIME_CHARACTERS[0];
    const resShinobi = characterManager.getEffectiveRenderer(shinobi);
    expect(resShinobi.renderer.id).toBe('skeletal_2d');
    expect(resShinobi.usedFallback).toBe(false);
  });

  it('manages LipSyncController mouth shapes and subscriptions', () => {
    const lip = new LipSyncController();
    const observed: MouthShape[] = [];

    const unsub = lip.subscribe((shape) => {
      observed.push(shape);
    });

    lip.setShape('small');
    lip.setShape('open');
    lip.setShape('smile');
    lip.setShape('closed');

    unsub();
    lip.setShape('medium'); // Should not record after unsub

    expect(observed).toEqual(['closed', 'small', 'open', 'smile', 'closed']);
  });

  it('validates character pack manifests correctly', () => {
    const valid = CharacterPackValidator.validateManifest({
      id: 'custom.ninja',
      name: 'Shadow Ninja',
      type: 'original',
      renderer: 'skeletal_2d',
      version: '1.0.0',
    });
    expect(valid.valid).toBe(true);
    expect(valid.parsed?.id).toBe('custom.ninja');

    const invalid = CharacterPackValidator.validateManifest({
      id: 'bad id with spaces!',
      version: '1.0.0',
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });

  it('rejects path traversal and dangerous executables in character pack archives', () => {
    const maliciousFiles = [
      { path: 'manifest.json', sizeBytes: 100 },
      { path: '../../etc/passwd', sizeBytes: 50 },
      { path: 'model/malware.exe', sizeBytes: 500 },
    ];

    const res = CharacterPackValidator.validatePackFiles(maliciousFiles, JSON.stringify({
      id: 'test.pack',
      name: 'Test Pack',
      version: '1.0.0',
      renderer: 'skeletal_2d',
    }));

    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('path traversal'))).toBe(true);
    expect(res.errors.some((e) => e.includes('Executable script or binary'))).toBe(true);
  });

  it('includes all original anime test character presets', () => {
    expect(ANIME_CHARACTERS.length).toBeGreaterThanOrEqual(4);
    const ids = ANIME_CHARACTERS.map((c) => c.id);
    expect(ids).toContain('kage_shinobi');
    expect(ids).toContain('ren_cyber_ninja');
    expect(ids).toContain('takeshi_samurai');
    expect(ids).toContain('aria_celestial_mage');
    expect(ids).toContain('nexus_bot');

    for (const c of ANIME_CHARACTERS) {
      expect(c.category).toBe('original');
      expect(c.license).toBeDefined();
      expect(c.personality.speakingStyle).toBeDefined();
      expect(c.personality.tone).toBeDefined();
    }
  });

  it('includes all 6 official Lulu Pet Hub companion characters', () => {
    const petIds = ['lulu', 'neko', 'robo', 'mochi', 'pixel', 'sprout'];
    const officialIds = OFFICIAL_CHARACTERS.map((c) => c.id);
    for (const id of petIds) {
      expect(officialIds).toContain(id);
    }

    const officialPets = OFFICIAL_CHARACTERS.filter((c) => petIds.includes(c.id));
    expect(officialPets).toHaveLength(6);
    for (const pet of officialPets) {
      expect(pet.name).toBeDefined();
      expect(pet.displayName).toBeDefined();
      expect(pet.description).toBeDefined();
      expect(pet.personality).toBeDefined();
      expect(pet.palette).toBeDefined();
    }
  });
});
