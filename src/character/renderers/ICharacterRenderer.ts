import { AnimationState, CharacterProfile, CharacterRendererType, MouthShape } from '../../types';

export interface CharacterRenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  animationState: AnimationState;
  animationFrame: number;
  facing: 'left' | 'right';
  character: CharacterProfile;
  mouthShape?: MouthShape;
  scale?: number;
}

export interface CharacterRendererCapability {
  supported: boolean;
  rendererId: CharacterRendererType;
  name: string;
  hardwareAccelerated: boolean;
  reason?: string;
}

export interface ICharacterRenderer {
  readonly id: CharacterRendererType;
  readonly name: string;

  checkCapability(): CharacterRendererCapability;
  render(context: CharacterRenderContext): void;
}
