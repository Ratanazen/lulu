import { LyricLine, ParsedLrc } from './types';

export class LrcParser {
  /**
   * Parses raw .lrc string into a structured, chronologically sorted ParsedLrc object
   */
  public static parse(content: string): ParsedLrc {
    let title = '';
    let artist = '';
    let album = '';
    let offsetMs = 0;
    const lines: LyricLine[] = [];

    const rawLines = content.split(/\r?\n/);
    const timeTagRegex = /\[(\d{1,3}):(\d{2})(?:\.(\d{2,3}))?\]/g;

    for (const rawLine of rawLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      // 1. Check for standard metadata tags
      const tiMatch = trimmed.match(/^\[ti:\s*(.+?)\]$/i);
      if (tiMatch) {
        title = tiMatch[1].trim();
        continue;
      }

      const arMatch = trimmed.match(/^\[ar:\s*(.+?)\]$/i);
      if (arMatch) {
        artist = arMatch[1].trim();
        continue;
      }

      const alMatch = trimmed.match(/^\[al:\s*(.+?)\]$/i);
      if (alMatch) {
        album = alMatch[1].trim();
        continue;
      }

      const offsetMatch = trimmed.match(/^\[offset:\s*([+-]?\d+)\]$/i);
      if (offsetMatch) {
        offsetMs = parseInt(offsetMatch[1], 10) || 0;
        continue;
      }

      // 2. Extract timestamp tags and text
      timeTagRegex.lastIndex = 0;
      const timestamps: number[] = [];
      let match: RegExpExecArray | null;

      while ((match = timeTagRegex.exec(trimmed)) !== null) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const fracStr = match[3] || '0';
        // Normalize fraction to milliseconds
        const fracMs = fracStr.length === 2 ? parseInt(fracStr, 10) * 10 : parseInt(fracStr, 10);
        const totalMs = minutes * 60 * 1000 + seconds * 1000 + fracMs;
        timestamps.push(totalMs);
      }

      if (timestamps.length > 0) {
        // Strip all [timestamp] tags from the line to extract lyric text
        const text = trimmed.replace(/\[\d{1,3}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();

        for (const t of timestamps) {
          lines.push({
            timeMs: Math.max(0, t + offsetMs),
            text,
          });
        }
      }
    }

    // Sort chronologically
    lines.sort((a, b) => a.timeMs - b.timeMs);

    return {
      title,
      artist,
      album,
      offsetMs,
      lines,
    };
  }

  /**
   * Returns the active lyric and next lyric for a given playback position in milliseconds
   */
  public static getLyricAtTime(
    lines: LyricLine[],
    currentTimeMs: number
  ): { current: LyricLine | null; next: LyricLine | null; index: number } {
    if (!lines || lines.length === 0) {
      return { current: null, next: null, index: -1 };
    }

    let activeIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].timeMs <= currentTimeMs) {
        activeIdx = i;
      } else {
        break;
      }
    }

    if (activeIdx === -1) {
      // Prior to first lyric
      return {
        current: null,
        next: lines[0] || null,
        index: -1,
      };
    }

    return {
      current: lines[activeIdx],
      next: lines[activeIdx + 1] || null,
      index: activeIdx,
    };
  }
}
