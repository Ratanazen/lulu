import { describe, it, expect } from 'vitest';
import { ANIME_CHARACTERS } from '../src/character/animePresets';
import { CharacterManager } from '../src/character/CharacterManager';
import { ImageAvatarRendererAdapter } from '../src/character/renderers/ImageAvatarRendererAdapter';

describe('Madara Uchiha & Image Avatar Engine', () => {
  it('defines madara_shinobi character profile with image_avatar renderer', () => {
    const madara = ANIME_CHARACTERS.find((c) => c.id === 'madara_shinobi');

    expect(madara).toBeDefined();
    expect(madara?.name).toBe('Madara Uchiha');
    expect(madara?.displayName).toContain('Madara');
    expect(madara?.renderer).toBe('image_avatar');
    expect(madara?.avatarUrl).toBe('/characters/lulu-character.png');
    expect(madara?.modelPath).toBe('/characters/lulu-character.png');
    expect(madara?.palette.primary).toBe('#E11D48');
    expect(madara?.first_message).toContain('Wake up to reality');
  });

  it('verifies lulu-character asset metadata is configured', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const metaPath = path.resolve(__dirname, '../src/assets/character/lulu/metadata.json');
    const imgPath = path.resolve(__dirname, '../src/assets/character/lulu/lulu-character.png');

    expect(fs.existsSync(metaPath)).toBe(true);
    expect(fs.existsSync(imgPath)).toBe(true);

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    expect(meta.id).toBe('lulu-character');
    expect(meta.type).toBe('desktop-pet-character');
    expect(meta.source).toBe('user-provided-image');
    expect(meta.transparent).toBe(true);
  });

  it('provides ImageAvatarRendererAdapter capability', () => {
    const adapter = new ImageAvatarRendererAdapter();
    const cap = adapter.checkCapability();

    expect(cap.supported).toBe(true);
    expect(cap.rendererId).toBe('image_avatar');
    expect(cap.hardwareAccelerated).toBe(true);
  });

  it('resolves ImageAvatarRendererAdapter for image-based characters in CharacterManager', () => {
    const manager = new CharacterManager();
    const madara = manager.getRoster().find((c) => c.id === 'madara_shinobi');

    expect(madara).toBeDefined();
    const { renderer, capability } = manager.getEffectiveRenderer(madara!);

    expect(renderer).toBeDefined();
    expect(renderer.id).toBe('image_avatar');
    expect(capability.supported).toBe(true);
  });
});
