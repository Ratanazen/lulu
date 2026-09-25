import { CharacterPackManifest, CharacterRendererType } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  manifest?: CharacterPackManifest;
}

export interface CharacterPackArchiveEntry {
  path: string;
  sizeBytes: number;
}

export class CharacterPackValidator {
  private static readonly MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly MAX_FILE_COUNT = 1000;
  private static readonly ALLOWED_RENDERERS: CharacterRendererType[] = [
    'pixel',
    'skeletal_2d',
    'live2d',
    'three_vrm',
  ];

  private static readonly DISALLOWED_EXTENSIONS = new Set([
    'exe', 'dll', 'so', 'dylib', 'sh', 'bat', 'cmd', 'vbs', 'ps1', 'jar', 'appimage',
  ]);

  /**
   * Validates a character pack manifest JSON object
   */
  public static validateManifest(manifest: any): { valid: boolean; errors: string[]; parsed?: CharacterPackManifest } {
    const errors: string[] = [];

    if (!manifest || typeof manifest !== 'object') {
      return { valid: false, errors: ['Manifest must be a non-empty JSON object'] };
    }

    if (!manifest.id || typeof manifest.id !== 'string') {
      errors.push('Manifest missing required string field: "id"');
    } else if (!/^[a-z0-9_.-]+$/i.test(manifest.id)) {
      errors.push('Manifest "id" contains invalid characters (use alphanumeric, dash, dot, underscore)');
    }

    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push('Manifest missing required string field: "name"');
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push('Manifest missing required string field: "version"');
    }

    const type = manifest.type || 'original';
    if (!['original', 'anime', 'user', 'imported'].includes(type)) {
      errors.push('Manifest "type" must be one of: "original", "anime", "user", "imported"');
    }

    const renderer = manifest.renderer || 'skeletal_2d';
    if (!this.ALLOWED_RENDERERS.includes(renderer)) {
      errors.push(`Manifest "renderer" must be one of: ${this.ALLOWED_RENDERERS.join(', ')}`);
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const parsed: CharacterPackManifest = {
      id: manifest.id,
      name: manifest.name,
      type: manifest.type || 'original',
      renderer,
      version: manifest.version,
      author: manifest.author || 'Unknown',
      description: manifest.description || '',
      license: manifest.license || 'User Content',
      entryModel: manifest.entryModel,
      animations: manifest.animations || {},
      expressions: manifest.expressions || {},
      audio: manifest.audio || {},
      voice: manifest.voice,
      permissions: Array.isArray(manifest.permissions) ? manifest.permissions : [],
    };

    return { valid: true, errors: [], parsed };
  }

  /**
   * Validates character pack directory structure and security constraints
   */
  public static validatePackFiles(files: CharacterPackArchiveEntry[], manifestJsonContent?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!files || files.length === 0) {
      return { valid: false, errors: ['Character pack archive contains zero files.'], warnings };
    }

    if (files.length > this.MAX_FILE_COUNT) {
      errors.push(`Character pack exceeds maximum allowed file count (${files.length} > ${this.MAX_FILE_COUNT})`);
    }

    let totalSize = 0;
    const paths = new Set<string>();

    for (const f of files) {
      totalSize += f.sizeBytes;

      // 1. Path traversal security checks
      if (f.path.includes('..') || f.path.startsWith('/') || f.path.includes('\\')) {
        errors.push(`Security violation: Malicious path traversal detected in file "${f.path}"`);
      }

      // 2. Disallowed executable formats
      const ext = f.path.split('.').pop()?.toLowerCase();
      if (ext && this.DISALLOWED_EXTENSIONS.has(ext)) {
        errors.push(`Security violation: Executable script or binary not permitted in pack: "${f.path}"`);
      }

      paths.add(f.path.replace(/^\.\//, ''));
    }

    if (totalSize > this.MAX_TOTAL_SIZE) {
      errors.push(`Character pack total uncompressed size exceeds limit (${(totalSize / 1024 / 1024).toFixed(1)}MB > 50MB)`);
    }

    // Check for manifest.json
    const hasManifest = paths.has('manifest.json') || Array.from(paths).some((p) => p.endsWith('/manifest.json'));
    if (!hasManifest && !manifestJsonContent) {
      errors.push('Missing required file: "manifest.json" in root of pack');
    }

    let parsedManifest: CharacterPackManifest | undefined;
    if (manifestJsonContent) {
      try {
        const raw = JSON.parse(manifestJsonContent);
        const res = this.validateManifest(raw);
        if (!res.valid) {
          errors.push(...res.errors);
        } else {
          parsedManifest = res.parsed;
        }
      } catch (err: any) {
        errors.push(`Invalid manifest.json syntax: ${err.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      manifest: parsedManifest,
    };
  }
}
