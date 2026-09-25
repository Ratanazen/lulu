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
    if (this.activeCharacter.id === id || this.activeCharacter.character_id === id) {
      return false; // Cannot delete currently active character without switching
    }
    const idx = this.characterRoster.findIndex((c) => c.id === id || c.character_id === id);
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

  public getCharacterByLuluId(luluId: string): CharacterProfile | undefined {
    const cleanId = luluId.trim().toUpperCase();
    return this.characterRoster.find(
      (c) => (c.character_id && c.character_id.toUpperCase() === cleanId) || c.id.toUpperCase() === cleanId
    );
  }

  public searchCharacters(params: {
    query?: string;
    category?: string;
    renderer?: string;
    favoriteOnly?: boolean;
    visibility?: string;
  }): CharacterProfile[] {
    let result = [...this.characterRoster];

    if (params.query && params.query.trim() !== '') {
      const q = params.query.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.character_id && c.character_id.toLowerCase().includes(q)) ||
          (c.author && c.author.toLowerCase().includes(q)) ||
          (c.tags && c.tags.some((t) => t.toLowerCase().includes(q))) ||
          c.description.toLowerCase().includes(q)
      );
    }

    if (params.category && params.category !== 'all') {
      if (params.category === 'favorites') {
        result = result.filter((c) => c.is_favorite);
      } else if (params.category === 'installed' || params.category === 'my_characters') {
        result = result.filter((c) => c.category === 'original' || c.category === 'user');
      } else {
        result = result.filter((c) => c.category === params.category);
      }
    }

    if (params.renderer && params.renderer !== 'all') {
      result = result.filter((c) => (c.renderer || 'pixel') === params.renderer);
    }

    if (params.favoriteOnly) {
      result = result.filter((c) => c.is_favorite);
    }

    return result;
  }

  public toggleFavorite(id: string): boolean {
    const char = this.characterRoster.find((c) => c.id === id || c.character_id === id);
    if (char) {
      char.is_favorite = !char.is_favorite;
      this.saveCustomRoster();
      return !!char.is_favorite;
    }
    return false;
  }

  public exportCharacterPack(char: CharacterProfile): string {
    const manifest = {
      format_version: 1,
      character_id: char.character_id || `LULU-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      name: char.displayName,
      description: char.description,
      renderer: char.renderer || 'pixel',
      version: char.version || '1.0.0',
      author: char.author || 'Lulu Creator',
      license: char.license || 'Original Creative Commons',
      personality: char.personality,
      scenario: char.scenario || '',
      first_message: char.first_message || '',
      traits: char.traits || [],
      tags: char.tags || [],
      palette: char.palette,
      scale: char.scale,
      transform: char.transform,
      collider: char.collider,
      camera: char.camera,
      voice: char.voice,
      voice_provider: char.voice_provider,
      temperature: char.temperature,
      visibility: char.visibility || 'private',
      created_at: char.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return JSON.stringify(manifest, null, 2);
  }

  public importCharacterPack(manifestJson: string): { success: boolean; character?: CharacterProfile; error?: string } {
    try {
      const parsed = JSON.parse(manifestJson);
      if (!parsed.name) {
        return { success: false, error: 'Character pack manifest missing required "name" field.' };
      }

      const id = parsed.id || parsed.character_id?.toLowerCase().replace(/[^a-z0-9_]/g, '_') || `custom_${Date.now()}`;
      const luluId = parsed.character_id || `LULU-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newChar: CharacterProfile = {
        id,
        character_id: luluId,
        name: parsed.name,
        displayName: parsed.displayName || parsed.name,
        description: parsed.description || 'Imported custom companion pack.',
        category: 'user',
        renderer: parsed.renderer || 'pixel',
        scale: parsed.scale || 1.0,
        defaultPosition: { x: 300, y: 300 },
        palette: parsed.palette || {
          primary: '#6366F1',
          secondary: '#A5B4FC',
          accent: '#F59E0B',
          shadow: '#1E1B4B',
          glow: '#C7D2FE',
        },
        personality: parsed.personality || {
          curiosity: 80,
          friendliness: 85,
          playfulness: 75,
          calmness: 70,
          focus: 75,
          energy: 80,
          social: 75,
        },
        scenario: parsed.scenario,
        first_message: parsed.first_message,
        traits: parsed.traits || ['imported', 'companion'],
        tags: parsed.tags || ['custom'],
        transform: parsed.transform,
        collider: parsed.collider,
        camera: parsed.camera,
        visibility: parsed.visibility || 'private',
        unlocked: true,
        author: parsed.author || 'Community Creator',
        version: parsed.version || '1.0.0',
        license: parsed.license || 'User Pack License',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.addCharacter(newChar);
      return { success: true, character: newChar };
    } catch (err: any) {
      return { success: false, error: `Failed to parse manifest: ${err.message}` };
    }
  }

  public bulkDelete(ids: string[]): number {
    let deletedCount = 0;
    for (const id of ids) {
      if (this.removeCharacter(id)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }

  public bulkExport(ids: string[]): string {
    const selected = this.characterRoster.filter((c) => ids.includes(c.id) || (c.character_id && ids.includes(c.character_id)));
    const pack = {
      export_version: 1,
      exported_at: new Date().toISOString(),
      count: selected.length,
      characters: selected.map((c) => JSON.parse(this.exportCharacterPack(c))),
    };
    return JSON.stringify(pack, null, 2);
  }

  private async saveCustomRoster(): Promise<void> {
    const customOnly = this.characterRoster.filter(
      (c) => !OFFICIAL_CHARACTERS.some((o) => o.id === c.id) && !ANIME_CHARACTERS.some((a) => a.id === c.id)
    );
    await StorageService.set('custom_character_roster', customOnly);
  }
}

export const characterManager = new CharacterManager();
