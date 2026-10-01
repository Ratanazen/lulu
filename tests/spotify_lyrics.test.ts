import { describe, it, expect } from 'vitest';
import { spotifyLyricsService } from '../src/features/lyrics/spotifyLyricsService';
import { LrcParser } from '../src/features/lyrics/lrcParser';

describe('spotifyLyricsService', () => {
  it('identifies active lyrics line by timestamp', () => {
    const raw = '[00:05.00]First line\n[00:10.00]Second line\n[00:15.00]Third line';
    const lrc = LrcParser.parse(raw);
    
    expect(spotifyLyricsService.getActiveLine(lrc, 4.0)).toBeNull();
    expect(spotifyLyricsService.getActiveLine(lrc, 5.5)).toBe('First line');
    expect(spotifyLyricsService.getActiveLine(lrc, 11.2)).toBe('Second line');
    expect(spotifyLyricsService.getActiveLine(lrc, 20.0)).toBe('Third line');
  });

  it('handles empty or missing lrc gracefully', () => {
    expect(spotifyLyricsService.getActiveLine(null, 10)).toBeNull();
    expect(spotifyLyricsService.getActiveLine({ lines: [], offsetMs: 0 }, 10)).toBeNull();
  });

  it('handles rapid sequential timestamp lookups without deviation', () => {
    const raw = '[00:01.00]Verse 1\n[00:03.00]Chorus\n[00:06.00]Outro';
    const lrc = LrcParser.parse(raw);
    for (let t = 1.0; t < 3.0; t += 0.2) {
      expect(spotifyLyricsService.getActiveLine(lrc, t)).toBe('Verse 1');
    }
    for (let t = 3.0; t < 6.0; t += 0.2) {
      expect(spotifyLyricsService.getActiveLine(lrc, t)).toBe('Chorus');
    }
    expect(spotifyLyricsService.getActiveLine(lrc, 6.5)).toBe('Outro');
  });

  it('adjusts active line detection based on sync offset', () => {
    const raw = '[00:10.00]Line at 10s\n[00:20.00]Line at 20s';
    const lrc = LrcParser.parse(raw);

    // Default offset 0s: at 9.5s -> null
    spotifyLyricsService.setSyncOffset(0);
    expect(spotifyLyricsService.getActiveLine(lrc, 9.5)).toBeNull();

    // Advance offset by +1.0s: position 9.5s + 1.0s = 10.5s -> 'Line at 10s'
    spotifyLyricsService.setSyncOffset(1.0);
    expect(spotifyLyricsService.getSyncOffset()).toBe(1.0);
    expect(spotifyLyricsService.getActiveLine(lrc, 9.5)).toBe('Line at 10s');

    // Delay offset by -1.0s: position 10.5s - 1.0s = 9.5s -> null
    spotifyLyricsService.setSyncOffset(-1.0);
    expect(spotifyLyricsService.getActiveLine(lrc, 10.5)).toBeNull();

    // Reset offset
    spotifyLyricsService.setSyncOffset(0);
    expect(spotifyLyricsService.getSyncOffset()).toBe(0);
  });
});

