import { LrcParser, ParsedLrc } from './lrcParser';
import { invokeCommand } from '../../services/tauriBridge';

class SpotifyLyricsService {
  private cache = new Map<string, ParsedLrc | null>();
  private activeTrackKey = '';
  private currentLrc: ParsedLrc | null = null;

  public async getLyricsForTrack(artist: string, title: string): Promise<ParsedLrc | null> {
    if (!artist || !title) return null;
    const key = `${artist.trim()} - ${title.trim()}`.toLowerCase();

    if (this.activeTrackKey === key && this.currentLrc) {
      return this.currentLrc;
    }

    if (this.cache.has(key)) {
      const cached = this.cache.get(key) || null;
      this.activeTrackKey = key;
      this.currentLrc = cached;
      return cached;
    }

    const cleanFilename = `${artist.replace(/[/\?%*:|"<>]/g, '_')} - ${title.replace(/[/\?%*:|"<>]/g, '_')}.lrc`;

    // 1. Try local storage file first
    try {
      const localContent = await invokeCommand<string>('read_lyrics_file', {
        filename: cleanFilename,
      });
      if (localContent && localContent.trim().length > 0) {
        const parsed = LrcParser.parse(localContent);
        this.cache.set(key, parsed);
        this.activeTrackKey = key;
        this.currentLrc = parsed;
        return parsed;
      }
    } catch {
      // Not cached locally, proceed to fetch
    }

    // 2. Fetch from LRCLIB API
    try {
      const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Lulu-Desktop/0.2.0 (Linux)' } });
      if (res.ok) {
        const data = await res.json();
        const rawContent = data.syncedLyrics || data.plainLyrics;
        if (rawContent && rawContent.trim().length > 0) {
          const parsed = LrcParser.parse(rawContent);

          // Save locally for offline use
          try {
            await invokeCommand('save_lyrics_file', {
              filename: cleanFilename,
              content: rawContent,
            });
          } catch {
            // Ignore write errors in mock environment
          }

          this.cache.set(key, parsed);
          this.activeTrackKey = key;
          this.currentLrc = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[SpotifyLyrics] Failed to fetch online lyrics:', e);
    }

    this.cache.set(key, null);
    this.activeTrackKey = key;
    this.currentLrc = null;
    return null;
  }

  public getActiveLine(lrc: ParsedLrc | null, positionSecs: number): string | null {
    if (!lrc || !lrc.lines || lrc.lines.length === 0) return null;
    if (positionSecs < lrc.lines[0].timeSeconds) return null;
    const idx = LrcParser.findActiveLineIndex(lrc.lines, positionSecs);
    if (idx >= 0 && idx < lrc.lines.length) {
      return lrc.lines[idx].text || null;
    }
    return null;
  }
}

export const spotifyLyricsService = new SpotifyLyricsService();
