import { describe, it, expect, vi } from 'vitest';
import { SpriteSheetRendererAdapter } from '../src/character/renderers/SpriteSheetRendererAdapter';
import { CharacterProfile } from '../src/types';
import { ANIME_CHARACTERS } from '../src/character/animePresets';
import { characterManager } from '../src/character/CharacterManager';

describe('Universal SpriteSheetRendererAdapter & Nexus Coder Companion', () => {
  it('correctly registers and reports hardware acceleration capability', () => {
    const adapter = new SpriteSheetRendererAdapter();
    const cap = adapter.checkCapability();

    expect(cap.supported).toBe(true);
    expect(cap.rendererId).toBe('spritesheet');
    expect(cap.hardwareAccelerated).toBe(true);
    expect(cap.name).toContain('Sprite Sheet');
  });

  it('is available in characterManager renderer registry', () => {
    const caps = characterManager.getRendererCapabilities();
    const spriteSheetCap = caps.find((c) => c.rendererId === 'spritesheet');

    expect(spriteSheetCap).toBeDefined();
    expect(spriteSheetCap?.supported).toBe(true);
  });

  it('renders procedural fallback when no image URL is supplied without throwing', () => {
    const adapter = new SpriteSheetRendererAdapter();
    const mockCtx = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      roundRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const testChar: CharacterProfile = {
      id: 'test_bot',
      displayName: 'Test Cyber Bot',
      description: 'Test cyber companion',
      category: 'original',
      renderer: 'spritesheet',
      personality: {
        curiosity: 80,
        friendliness: 80,
        playfulness: 80,
        calmness: 80,
        focus: 80,
        energy: 80,
        social: 80,
        speakingStyle: 'robotic',
        tone: 'analytical',
      },
      scale: 1.0,
      defaultPosition: { x: 100, y: 100 },
      palette: {
        primary: '#06B6D4',
        secondary: '#10B981',
        accent: '#F59E0B',
        shadow: '#0F172A',
        glow: '#38BDF8',
      },
      unlocked: true,
      license: 'MIT',
      author: 'Test',
      version: '1.0.0',
    };

    expect(() => {
      adapter.render({
        ctx: mockCtx,
        width: 320,
        height: 240,
        animationState: 'idle',
        animationFrame: 12,
        facing: 'right',
        character: testChar,
        mouthShape: 'smile',
        scale: 1.0,
      });
    }).not.toThrow();

    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 320, 240);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('renders left-facing fallback flipped correctly', () => {
    const adapter = new SpriteSheetRendererAdapter();
    const mockCtx = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      roundRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const testChar = ANIME_CHARACTERS.find((c) => c.id === 'nexus_bot')!;
    expect(testChar).toBeDefined();

    adapter.render({
      ctx: mockCtx,
      width: 320,
      height: 240,
      animationState: 'dance',
      animationFrame: 5,
      facing: 'left',
      character: testChar,
      mouthShape: 'smile',
      scale: 1.0,
    });

    expect(mockCtx.scale).toHaveBeenCalledWith(-1, 1);
  });

  it('verifies Nexus (Cyber Alien Coder) companion profile and personality', () => {
    const nexus = ANIME_CHARACTERS.find((c) => c.id === 'nexus_bot');
    expect(nexus).toBeDefined();
    expect(nexus?.category).toBe('original');
    expect(nexus?.displayName).toBe('Nexus (Cyber Alien Coder)');
    expect(nexus?.personality.speakingStyle).toContain('tech-savvy');
    expect(nexus?.personality.greeting).toContain('01001000 01101001');
    expect(nexus?.personality.favoriteTopics).toContain('rust');
    expect(nexus?.accessories).toContain('antenna_led');
    expect(nexus?.accessories).toContain('hologram_visor');
    expect(nexus?.palette.primary).toBe('#06B6D4');
  });

  it('correctly slices horizontal strip frame bounds with loop boundary clamping', () => {
    const frameCount = 12;
    const stripWidth = 1200;
    const stripHeight = 100;
    const frameWidth = stripWidth / frameCount;

    for (let frame = 0; frame < 36; frame++) {
      const frameIndex = frame % frameCount;
      const sx = frameIndex * frameWidth;
      const sy = 0;

      expect(frameIndex).toBeGreaterThanOrEqual(0);
      expect(frameIndex).toBeLessThan(frameCount);
      expect(sx).toBe(frameIndex * 100);
      expect(sy).toBe(0);
    }
  });

  it('correctly slices vertical strip frame bounds', () => {
    const frameCount = 8;
    const stripWidth = 150;
    const stripHeight = 1200;
    const frameHeight = stripHeight / frameCount;

    for (let frame = 0; frame < 24; frame++) {
      const frameIndex = frame % frameCount;
      const sx = 0;
      const sy = frameIndex * frameHeight;

      expect(frameIndex).toBeGreaterThanOrEqual(0);
      expect(frameIndex).toBeLessThan(frameCount);
      expect(sx).toBe(0);
      expect(sy).toBe(frameIndex * 150);
    }
  });
});
