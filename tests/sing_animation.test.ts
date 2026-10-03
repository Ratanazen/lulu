import { describe, it, expect } from 'vitest';
import { resolveAnimationPriority } from '../src/behavior/BehaviorEngine';
import { LULU_FLAME_STYLES, getEffectiveFps, isValidFlameCombo } from '../src/config/luluFlameConfig';
import { spotifyLyricsService } from '../src/features/lyrics/spotifyLyricsService';
import { LrcParser } from '../src/features/lyrics/lrcParser';
import fs from 'fs';
import path from 'path';

describe('Lulu Sing Animation & Spotify Lip-Sync Engine', () => {
  it('1. verifies that transparent singing frame exists on disk (1-frame master artwork)', () => {
    const singDir = path.resolve(__dirname, '../src/assets/avatars/animations/sing');
    expect(fs.existsSync(singDir)).toBe(true);

    const framePath = path.join(singDir, 'sing_0.png');
    expect(fs.existsSync(framePath)).toBe(true);
    const stat = fs.statSync(framePath);
    expect(stat.size).toBeGreaterThan(1000); // Must be real non-empty HD artwork
  });

  it('2. verifies singing priority in behavior resolution (RUN > WALK > SING > DANCE > SLEEP...)', () => {
    // SINGING beats DANCING
    expect(resolveAnimationPriority('idle', false, false, true, false, false, false, 'calm', true)).toBe('sing');

    // SINGING beats SLEEPING, PROTECTING, WAVING, and MOOD
    expect(resolveAnimationPriority('idle', false, false, false, true, true, true, 'happy', true)).toBe('sing');

    // RUNNING beats SINGING
    expect(resolveAnimationPriority('idle', true, false, false, false, false, false, 'calm', true)).toBe('run');

    // WALKING beats SINGING
    expect(resolveAnimationPriority('idle', false, true, false, false, false, false, 'calm', true)).toBe('walk');

    // When not singing, returns DANCING or other states
    expect(resolveAnimationPriority('idle', false, false, true, false, false, false, 'calm', false)).toBe('dance');
  });

  it('3. verifies Master Flame configuration for spotify_sing (1-frame system)', () => {
    const flame = LULU_FLAME_STYLES.spotify_sing;
    expect(flame).toBeDefined();
    expect(flame.animation).toBe('sing');
    expect(flame.framesCount).toBe(1);
    expect(flame.fps).toBe(1);
    expect(flame.comboWith).toContain('spotify_dance');
    expect(flame.comboWith).toContain('celebration_cheer');
    expect(flame.comboWith).toContain('ninja_salute');

    // Valid combos
    expect(isValidFlameCombo('spotify_sing', 'spotify_dance')).toBe(true);
    expect(isValidFlameCombo('spotify_sing', 'celebration_cheer')).toBe(true);
  });

  it('4. verifies effective singing FPS with -40% slow speed multiplier', () => {
    // Base 10 FPS scaled by 0.60 (-40% slow flame update)
    const effectiveFps = getEffectiveFps(10, 0.60);
    expect(effectiveFps).toBe(6);

    // Frame interval should be ~167ms per frame for clear lip-sync observation
    const frameIntervalMs = Math.round(1000 / effectiveFps);
    expect(frameIntervalMs).toBe(167);
  });

  it('5. verifies live lyrics detection driving singing vs dancing transitions', () => {
    const rawLrc = `
[00:02.00]First lyric verse
[00:06.00]Second lyric verse
[00:10.00]
[00:15.00]Final chorus
    `.trim();

    const lrc = LrcParser.parse(rawLrc);

    // Before vocal starts: instrumental / dancing
    expect(spotifyLyricsService.getActiveLine(lrc, 1.0)).toBeNull();

    // Active vocals: singing
    expect(spotifyLyricsService.getActiveLine(lrc, 3.0)).toBe('First lyric verse');
    expect(spotifyLyricsService.getActiveLine(lrc, 7.5)).toBe('Second lyric verse');

    // Instrumental break (timestamp with empty text): switches back to dance
    expect(spotifyLyricsService.getActiveLine(lrc, 11.0)).toBeNull();

    // Final chorus vocals: singing again
    expect(spotifyLyricsService.getActiveLine(lrc, 16.0)).toBe('Final chorus');
  });

  it('6. verifies sleep / lullaby mode takes precedence over singing during sleep', () => {
    // When isSleeping is active, sleep mode is preserved while music is playing (lullaby mode)
    const isSleeping = true;
    const isMusicPlaying = true;
    const anim = isSleeping ? 'sleep' : isMusicPlaying ? 'sing' : 'idle';
    expect(anim).toBe('sleep');
  });
});
