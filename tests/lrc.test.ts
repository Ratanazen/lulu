import { describe, it, expect } from 'vitest';
import { LrcParser } from '../src/features/lyrics/LrcParser';

describe('LrcParser', () => {
  const sampleLrc = `
[ti:Starlight Dreams]
[ar:Lulu & The Byte Cats]
[al:Neon Horizon]
[offset:50]
[00:01.00]Gazing at the distant stars in the quiet night
[00:04.50]Whispers of tomorrow glowing soft and bright
[00:08.20][00:15.50]Two synchronized timestamps for this chorus line!
[00:20.000]Standard 3-digit millisecond line
  `.trim();

  it('parses metadata tags correctly', () => {
    const parsed = LrcParser.parse(sampleLrc);
    expect(parsed.title).toBe('Starlight Dreams');
    expect(parsed.artist).toBe('Lulu & The Byte Cats');
    expect(parsed.album).toBe('Neon Horizon');
    expect(parsed.offsetMs).toBe(50);
  });

  it('parses timestamps, normalizes milliseconds, and applies offset', () => {
    const parsed = LrcParser.parse(sampleLrc);
    expect(parsed.lines.length).toBe(5);

    // 00:01.00 + 50ms offset = 1050ms
    expect(parsed.lines[0].timeMs).toBe(1050);
    expect(parsed.lines[0].text).toBe('Gazing at the distant stars in the quiet night');

    // 00:04.50 + 50ms offset = 4550ms
    expect(parsed.lines[1].timeMs).toBe(4550);
    expect(parsed.lines[1].text).toBe('Whispers of tomorrow glowing soft and bright');
  });

  it('handles multiple timestamp tags per single line', () => {
    const parsed = LrcParser.parse(sampleLrc);
    // 00:08.20 (+50ms -> 8250ms) and 00:15.50 (+50ms -> 15550ms)
    const chorusLines = parsed.lines.filter((l) =>
      l.text.includes('Two synchronized timestamps')
    );
    expect(chorusLines.length).toBe(2);
    expect(chorusLines[0].timeMs).toBe(8250);
    expect(chorusLines[1].timeMs).toBe(15550);
  });

  it('handles 3-digit millisecond fractions correctly', () => {
    const parsed = LrcParser.parse(sampleLrc);
    const msLine = parsed.lines.find((l) =>
      l.text.includes('Standard 3-digit millisecond')
    );
    expect(msLine).toBeDefined();
    // 20.000s + 50ms = 20050ms
    expect(msLine?.timeMs).toBe(20050);
  });

  it('correctly retrieves active and next lyric for a given playback time', () => {
    const parsed = LrcParser.parse(sampleLrc);

    // Before any lyric
    const before = LrcParser.getLyricAtTime(parsed.lines, 500);
    expect(before.current).toBeNull();
    expect(before.next?.text).toBe('Gazing at the distant stars in the quiet night');

    // During first lyric
    const duringFirst = LrcParser.getLyricAtTime(parsed.lines, 2000);
    expect(duringFirst.current?.text).toBe(
      'Gazing at the distant stars in the quiet night'
    );
    expect(duringFirst.next?.text).toBe(
      'Whispers of tomorrow glowing soft and bright'
    );

    // After all lyrics
    const afterAll = LrcParser.getLyricAtTime(parsed.lines, 30000);
    expect(afterAll.current?.text).toBe('Standard 3-digit millisecond line');
    expect(afterAll.next).toBeNull();
  });

  it('gracefully handles empty content', () => {
    const parsed = LrcParser.parse('');
    expect(parsed.lines).toEqual([]);
    expect(parsed.title).toBe('');

    const query = LrcParser.getLyricAtTime([], 1000);
    expect(query.current).toBeNull();
    expect(query.next).toBeNull();
  });
});
