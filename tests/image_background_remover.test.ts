import { describe, it, expect } from 'vitest';
import { removeImageBackground } from '../src/utils/imageBackgroundRemover';

describe('Image Background Remover Engine', () => {
  it('exports removeImageBackground function', () => {
    expect(typeof removeImageBackground).toBe('function');
  });

  it('handles non-browser or empty input gracefully', async () => {
    const result = await removeImageBackground('');
    expect(typeof result).toBe('string');
  });

  it('returns valid base64 data url when canvas is provided', async () => {
    if (typeof document !== 'undefined' && typeof HTMLCanvasElement !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#E11D48'; // red center
        ctx.fillRect(4, 4, 8, 8);

        const transparentPng = await removeImageBackground(canvas, { tolerance: 30 });
        expect(transparentPng).toContain('data:image/png;base64');
      }
    }
  });
});
