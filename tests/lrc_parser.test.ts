import { describe, it, expect } from 'vitest';
import { LrcParser } from '../src/features/lyrics/lrcParser';

describe('LrcParser Specification', () => {
  it('parses metadata tags accurately', () => {
    const lrc = `
[ti:Khmer Melody]
[ar:Sinn Sisamouth]
[al:Golden Era]
[by:Ratana]
[offset:+500]
[00:05.00]បទចំរៀងខ្មែរពិរោះ
`;
    const res = LrcParser.parse(lrc);
    expect(res.title).toBe('Khmer Melody');
    expect(res.artist).toBe('Sinn Sisamouth');
    expect(res.album).toBe('Golden Era');
    expect(res.author).toBe('Ratana');
    expect(res.offsetMs).toBe(500);
    expect(res.lines.length).toBe(1);
    // 5.00s + 0.5s offset = 5.5s
    expect(res.lines[0].timeSeconds).toBe(5.5);
    expect(res.lines[0].text).toBe('បទចំរៀងខ្មែរពិរោះ');
  });

  it('handles multiple timestamps per line and sorts lines chronologically', () => {
    const lrc = `
[00:10.00][00:30.00]Chorus line repeated
[00:02.00]Opening verse
`;
    const res = LrcParser.parse(lrc);
    expect(res.lines.length).toBe(3);
    expect(res.lines[0].timeSeconds).toBe(2.0);
    expect(res.lines[0].text).toBe('Opening verse');
    expect(res.lines[1].timeSeconds).toBe(10.0);
    expect(res.lines[1].text).toBe('Chorus line repeated');
    expect(res.lines[2].timeSeconds).toBe(30.0);
    expect(res.lines[2].text).toBe('Chorus line repeated');
  });

  it('matches active line index correctly against playback seconds', () => {
    const lines = [
      { timeSeconds: 5, text: 'First' },
      { timeSeconds: 15, text: 'Second' },
      { timeSeconds: 30, text: 'Third' },
    ];

    expect(LrcParser.findActiveLineIndex(lines, 2)).toBe(0);
    expect(LrcParser.findActiveLineIndex(lines, 5)).toBe(0);
    expect(LrcParser.findActiveLineIndex(lines, 10)).toBe(0);
    expect(LrcParser.findActiveLineIndex(lines, 15)).toBe(1);
    expect(LrcParser.findActiveLineIndex(lines, 28)).toBe(1);
    expect(LrcParser.findActiveLineIndex(lines, 30)).toBe(2);
    expect(LrcParser.findActiveLineIndex(lines, 45)).toBe(2);
  });
});
