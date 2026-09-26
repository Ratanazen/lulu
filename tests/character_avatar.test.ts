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
    expect(madara?.avatarUrl).toBe('/characters/madara_avatar.png');
    expect(madara?.modelPath).toBe('/characters/madara_mascot.png');
    expect(madara?.palette.primary).toBe('#E11D48');
    expect(madara?.first_message).toContain('Wake up to reality');
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
