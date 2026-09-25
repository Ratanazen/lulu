import { ICharacterRenderer, CharacterRenderContext, CharacterRendererCapability } from './ICharacterRenderer';
import { PixelRenderer } from '../../animation/pixelRenderer';
import { CharacterRendererType } from '../../types';

export class PixelRendererAdapter implements ICharacterRenderer {
  readonly id: CharacterRendererType = 'pixel';
  readonly name = 'Procedural Pixel Art Engine';

  checkCapability(): CharacterRendererCapability {
    return {
      supported: true,
      rendererId: 'pixel',
      name: this.name,
      hardwareAccelerated: false,
    };
  }

  render(context: CharacterRenderContext): void {
    PixelRenderer.renderFrame(
      context.ctx,
      context.animationState,
      context.animationFrame,
      context.facing,
      context.character.palette,
      context.width,
      context.height,
      context.character.aura,
      context.character.accessories || []
    );
  }
}
