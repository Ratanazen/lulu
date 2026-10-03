import { describe, it, expect, beforeEach } from 'vitest';
import { LyricsSyncEngine, LyricLineMs, parsedLrcToMs } from '../src/features/lyrics/lyricsSyncEngine';
import { ParsedLrc } from '../src/features/lyrics/lrcParser';

describe('LyricsSyncEngine — Automatic Live Lyric Line Progression', () => {
  let engine: LyricsSyncEngine;

  const mockLines: LyricLineMs[] = [
    { startMs: 5000, text: 'First line of the song' },
    { startMs: 12000, text: 'បទចម្រៀងខ្មែរ ពីរោះរណ្ដំ (Khmer Unicode)' },
    { startMs: 20000, text: '日本語の歌詞 (Japanese Lyric)' },
    { startMs: 28000, text: 'Final concluding line of track' },
  ];

  beforeEach(() => {
    // 100ms sync tolerance default
    engine = new LyricsSyncEngine(100);
    engine.loadLyrics(mockLines, 'Artist - Test Track', 35000);
  });

  it('1. verifies intro instrumental section before first lyric timestamp', () => {
    // Before 5000ms - 100ms = 4900ms
    const state = engine.updatePosition(2000, 'Playing');
    expect(state.currentLineIndex).toBe(-1);
    expect(state.previousText).toBeNull();
    expect(state.currentText).toBeNull();
    expect(state.nextText).toBe('First line of the song');
  });

  it('2. verifies automatic progression to first lyric at startMs with tolerance', () => {
    // At 4950ms + 100ms tolerance = 5050ms >= 5000ms
    const state = engine.updatePosition(4950, 'Playing');
    expect(state.currentLineIndex).toBe(0);
    expect(state.previousText).toBeNull();
    expect(state.currentText).toBe('First line of the song');
    expect(state.nextText).toBe('បទចម្រៀងខ្មែរ ពីរោះរណ្ដំ (Khmer Unicode)');
  });

  it('3. verifies automatic progression to second lyric (Khmer Unicode) as time advances', () => {
    // At 12500ms -> line 1
    const state = engine.updatePosition(12500, 'Playing');
    expect(state.currentLineIndex).toBe(1);
    expect(state.previousText).toBe('First line of the song');
    expect(state.currentText).toBe('បទចម្រៀងខ្មែរ ពីរោះរណ្ដំ (Khmer Unicode)');
    expect(state.nextText).toBe('日本語の歌詞 (Japanese Lyric)');
  });

  it('4. verifies automatic progression to third lyric (Japanese/CJK)', () => {
    // At 21000ms -> line 2
    const state = engine.updatePosition(21000, 'Playing');
    expect(state.currentLineIndex).toBe(2);
    expect(state.previousText).toBe('បទចម្រៀងខ្មែរ ពីរោះរណ្ដំ (Khmer Unicode)');
    expect(state.currentText).toBe('日本語の歌詞 (Japanese Lyric)');
    expect(state.nextText).toBe('Final concluding line of track');
  });

  it('5. verifies final lyric boundary rule (effectivePositionMs >= finalLine.startMs)', () => {
    // At 30000ms -> final line (index 3)
    const state = engine.updatePosition(30000, 'Playing');
    expect(state.currentLineIndex).toBe(3);
    expect(state.previousText).toBe('日本語の歌詞 (Japanese Lyric)');
    expect(state.currentText).toBe('Final concluding line of track');
    expect(state.nextText).toBeNull();
  });

  it('6. verifies pause freezes the active lyric line without clearing or advancing', () => {
    // Advance to line 1
    engine.updatePosition(14000, 'Playing');
    expect(engine.getCurrentLineIndex()).toBe(1);

    // Pause playback
    const pausedState = engine.updatePosition(14000, 'Paused');
    expect(pausedState.isPaused).toBe(true);
    expect(pausedState.currentLineIndex).toBe(1);
    expect(pausedState.currentText).toBe('បទចម្រៀងខ្មែរ ពីរោះរណ្ដំ (Khmer Unicode)');

    // Even if position drifts while paused, freeze holds
    const stillPaused = engine.updatePosition(25000, 'Paused');
    expect(stillPaused.currentLineIndex).toBe(1);
    expect(stillPaused.currentText).toBe('បទចម្រៀងខ្មែរ ពីរោះរណ្ដំ (Khmer Unicode)');
  });

  it('7. verifies resume recalculates currentLineIndex immediately from actual player position', () => {
    // Paused at line 1
    engine.updatePosition(14000, 'Paused');

    // Resumed at 22000ms (Line 2: Japanese)
    const resumedState = engine.updatePosition(22000, 'Playing');
    expect(resumedState.isPaused).toBe(false);
    expect(resumedState.currentLineIndex).toBe(2);
    expect(resumedState.currentText).toBe('日本語の歌詞 (Japanese Lyric)');
  });

  it('8. verifies immediate forward and backward seek recalculation without intermediate step delay', () => {
    // Seek forward from start directly to final line (29000ms)
    const seekForward = engine.updatePosition(29000, 'Playing');
    expect(seekForward.currentLineIndex).toBe(3);
    expect(seekForward.currentText).toBe('Final concluding line of track');

    // Seek backward directly to line 0 (6000ms)
    const seekBackward = engine.updatePosition(6000, 'Playing');
    expect(seekBackward.currentLineIndex).toBe(0);
    expect(seekBackward.currentText).toBe('First line of the song');
    expect(seekBackward.previousText).toBeNull();
  });

  it('9. verifies track change clears previous lyrics and resets state completely', () => {
    engine.updatePosition(15000, 'Playing');
    expect(engine.getCurrentLineIndex()).toBe(1);

    // Track change occurs
    engine.clear();
    const cleared = engine.getState();
    expect(cleared.currentLineIndex).toBe(-1);
    expect(cleared.previousText).toBeNull();
    expect(cleared.currentText).toBeNull();
    expect(cleared.nextText).toBeNull();
    expect(cleared.totalLines).toBe(0);
    expect(cleared.trackKey).toBe('');

    // Load new track
    const newSongLines: LyricLineMs[] = [
      { startMs: 1000, text: 'New Song Intro' },
      { startMs: 8000, text: 'New Song Chorus' },
    ];
    engine.loadLyrics(newSongLines, 'New Artist - New Title', 20000);
    expect(engine.getTrackKey()).toBe('New Artist - New Title');

    const newSongState = engine.updatePosition(2000, 'Playing');
    expect(newSongState.currentLineIndex).toBe(0);
    expect(newSongState.currentText).toBe('New Song Intro');
  });

  it('10. verifies parsedLrcToMs converter correctly scales seconds to milliseconds', () => {
    const lrc: ParsedLrc = {
      offsetMs: 0,
      lines: [
        { timeSeconds: 1.5, text: 'Line 1' },
        { timeSeconds: 12.345, text: 'Line 2' },
      ],
    };

    const msLines = parsedLrcToMs(lrc);
    expect(msLines).toHaveLength(2);
    expect(msLines[0]).toEqual({ startMs: 1500, text: 'Line 1' });
    expect(msLines[1]).toEqual({ startMs: 12345, text: 'Line 2' });
  });

  it('11. verifies subscription listener fires on line index progression', () => {
    let notifiedIndex = -999;
    const unsubscribe = engine.subscribe((state) => {
      notifiedIndex = state.currentLineIndex;
    });

    engine.updatePosition(5500, 'Playing');
    expect(notifiedIndex).toBe(0);

    engine.updatePosition(13000, 'Playing');
    expect(notifiedIndex).toBe(1);

    unsubscribe();
    engine.updatePosition(21000, 'Playing');
    // After unsubscribe, notifiedIndex remains 1
    expect(notifiedIndex).toBe(1);
  });
});
