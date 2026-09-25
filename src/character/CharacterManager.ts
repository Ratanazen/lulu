import { CharacterProfile, CharacterRendererType } from '../types';
import { ICharacterRenderer, CharacterRendererCapability } from './renderers/ICharacterRenderer';
import { PixelRendererAdapter } from './renderers/PixelRendererAdapter';
import { Skeletal2DRenderer } from './renderers/Skeletal2DRenderer';
import { ThreeVRMAdapter } from './renderers/ThreeVRMAdapter';
import { SpriteSheetRendererAdapter } from './renderers/SpriteSheetRendererAdapter';
import { lipSyncController, LipSyncController } from './LipSyncController';
import { OFFICIAL_CHARACTERS } from './index';
import { ANIME_CHARACTERS } from './animePresets';
import { StorageService } from '../services/storageService';

export class CharacterManager {
  private renderers = new Map<CharacterRendererType, ICharacterRenderer>();
  private activeCharacter: CharacterProfile;
  private characterRoster: CharacterProfile[] = [];
  public readonly lipSync: LipSyncController = lipSyncController;
  private currentRendererType: CharacterRendererType = 'pixel';

  constructor() {
    // Register standard renderers
    this.registerRenderer(new PixelRendererAdapter());
    this.registerRenderer(new Skeletal2DRenderer());
    this.registerRenderer(new ThreeVRMAdapter());
    this.registerRenderer(new SpriteSheetRendererAdapter());

    // Merge default and anime characters
    this.characterRoster = [...OFFICIAL_CHARACTERS, ...ANIME_CHARACTERS];
    this.activeCharacter = OFFICIAL_CHARACTERS[0];
  }

  public getCurrentRendererType(): CharacterRendererType {
    return this.currentRendererType;
  }

  public setRenderer(type: CharacterRendererType): void {
    this.currentRendererType = type;
  }

  public registerRenderer(renderer: ICharacterRenderer): void {
    this.renderers.set(renderer.id, renderer);
  }

  public getRenderer(id: CharacterRendererType): ICharacterRenderer | undefined {
    return this.renderers.get(id);
  }

  public getRendererCapabilities(): CharacterRendererCapability[] {
    const list: CharacterRendererCapability[] = [];
    for (const r of this.renderers.values()) {
      list.push(r.checkCapability());
    }
    return list;
  }

  /**
   * Resolves the appropriate renderer for a character, checking capability
   */
  public getEffectiveRenderer(char: CharacterProfile, overrideType?: CharacterRendererType): {
    renderer: ICharacterRenderer;
    capability: CharacterRendererCapability;
    usedFallback: boolean;
  } {
    const requestedType = overrideType || char.renderer || this.currentRendererType || 'pixel';
    const target = this.renderers.get(requestedType);

    if (target) {
      const cap = target.checkCapability();
      if (cap.supported) {
        return { renderer: target, capability: cap, usedFallback: false };
      }
    }

    // Fallback: If 3D or skeletal is unsupported, use pixel or skeletal
    const fallback = this.renderers.get('skeletal_2d') || this.renderers.get('pixel')!;
    return {
      renderer: fallback,
      capability: fallback.checkCapability(),
      usedFallback: true,
    };
  }

  public getActiveCharacter(): CharacterProfile {
    return this.activeCharacter;
  }

  public setActiveCharacter(char: CharacterProfile): void {
    this.activeCharacter = char;
    StorageService.set('active_character_id', char.id);
  }

  public getRoster(): CharacterProfile[] {
    return [...this.characterRoster];
  }

  public addCharacter(char: CharacterProfile): void {
    const existingIdx = this.characterRoster.findIndex((c) => c.id === char.id);
    if (existingIdx >= 0) {
      this.characterRoster[existingIdx] = char;
    } else {
      this.characterRoster.push(char);
    }
    this.saveCustomRoster();
  }

  public removeCharacter(id: string): boolean {
    if (this.activeCharacter.id === id) {
      return false; // Cannot delete currently active character without switching
    }
    const idx = this.characterRoster.findIndex((c) => c.id === id);
    if (idx >= 0) {
      this.characterRoster.splice(idx, 1);
      this.saveCustomRoster();
      return true;
    }
    return false;
  }

  public async loadRoster(): Promise<void> {
    const custom = await StorageService.get<CharacterProfile[]>('custom_character_roster', []);
    if (custom && custom.length > 0) {
      for (const char of custom) {
        if (!this.characterRoster.some((c) => c.id === char.id)) {
          this.characterRoster.push(char);
        }
      }
    }

    const savedActiveId = await StorageService.get<string>('active_character_id', 'lulu');
    const found = this.characterRoster.find((c) => c.id === savedActiveId);
    if (found) {
      this.activeCharacter = found;
    }
  }

  private async saveCustomRoster(): Promise<void> {
    const customOnly = this.characterRoster.filter(
      (c) => !OFFICIAL_CHARACTERS.some((o) => o.id === c.id) && !ANIME_CHARACTERS.some((a) => a.id === c.id)
    );
    await StorageService.set('custom_character_roster', customOnly);
  }
}

export const characterManager = new CharacterManager();
