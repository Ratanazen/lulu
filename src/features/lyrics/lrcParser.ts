export interface LyricLine {
  timeSeconds: number;
  text: string;
}

export interface ParsedLrc {
  title?: string;
  artist?: string;
  album?: string;
  author?: string;
  offsetMs: number;
  lines: LyricLine[];
}

export class LrcParser {
  /**
   * Parse raw LRC string content
   */
  public static parse(content: string): ParsedLrc {
    const lines = content.split(/\r?\n/);
    let title: string | undefined;
    let artist: string | undefined;
    let album: string | undefined;
    let author: string | undefined;
    let offsetMs = 0;

    const parsedLines: LyricLine[] = [];

    // Regex to match tags like [00:12.50] or [01:25.000] or [ti:Song Title]
    const tagRegex = /\[([^\]]+)\]/g;
    const timeRegex = /^(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?$/;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Extract all bracketed tags from the line
      const tags: string[] = [];
      let match;
      while ((match = tagRegex.exec(line)) !== null) {
        tags.push(match[1]);
      }

      if (tags.length === 0) continue;

      // The remaining text is after all tags
      const text = line.replace(tagRegex, '').trim();

      for (const tag of tags) {
        const lowerTag = tag.toLowerCase();

        // Check metadata tags
        if (lowerTag.startsWith('ti:')) {
          title = tag.substring(3).trim();
        } else if (lowerTag.startsWith('ar:')) {
          artist = tag.substring(3).trim();
        } else if (lowerTag.startsWith('al:')) {
          album = tag.substring(3).trim();
        } else if (lowerTag.startsWith('by:')) {
          author = tag.substring(3).trim();
        } else if (lowerTag.startsWith('offset:')) {
          const val = parseInt(tag.substring(7).trim(), 10);
          if (!isNaN(val)) offsetMs = val;
        } else {
          // Check timestamp
          const timeMatch = timeRegex.exec(tag);
          if (timeMatch) {
            const minutes = parseInt(timeMatch[1], 10);
            const seconds = parseInt(timeMatch[2], 10);
            const millisRaw = timeMatch[3] || '0';
            const millis = millisRaw.length === 2 ? parseInt(millisRaw, 10) * 10 : parseInt(millisRaw, 10);

            const totalSeconds = minutes * 60 + seconds + millis / 1000.0;
            parsedLines.push({
              timeSeconds: totalSeconds,
              text,
            });
          }
        }
      }
    }

    // Apply offset to all line timestamps
    const offsetSeconds = offsetMs / 1000.0;
    const finalLines = parsedLines
      .map((l) => ({
        timeSeconds: Math.max(0, l.timeSeconds + offsetSeconds),
        text: l.text,
      }))
      .sort((a, b) => a.timeSeconds - b.timeSeconds);

    return {
      title,
      artist,
      album,
      author,
      offsetMs,
      lines: finalLines,
    };
  }

  /**
   * Find active line index based on playback position in seconds
   */
  public static findActiveLineIndex(lines: LyricLine[], positionSecs: number): number {
    if (lines.length === 0) return -1;
    if (positionSecs < lines[0].timeSeconds) return 0;

    let low = 0;
    let high = lines.length - 1;
    let activeIdx = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lines[mid].timeSeconds <= positionSecs) {
        activeIdx = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return activeIdx;
  }
}
