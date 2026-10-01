import { LrcParser, ParsedLrc } from './lrcParser';
import { invokeCommand } from '../../services/tauriBridge';

export interface LyricsSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  syncedLyrics?: string;
  plainLyrics?: string;
}

class SpotifyLyricsService {
  private cache = new Map<string, ParsedLrc | null>();
  private activeTrackKey = '';
  private currentLrc: ParsedLrc | null = null;
  private syncOffsetSecs: number = 0;
  private currentSource: string = 'None';

  public setSyncOffset(offsetSecs: number) {
    this.syncOffsetSecs = Math.max(-5, Math.min(5, offsetSecs));
  }

  public getSyncOffset(): number {
    return this.syncOffsetSecs;
  }

  public getCurrentSource(): string {
    return this.currentSource;
  }

  private cleanString(str: string): string {
    return str
      .replace(/\s*\(feat\..*?\)/gi, '')
      .replace(/\s*\[feat\..*?\]/gi, '')
      .replace(/\s*\(with.*?\)/gi, '')
      .replace(/\s*\(remastered.*?\)/gi, '')
      .replace(/\s*-\s*remastered.*/gi, '')
      .replace(/\s*-\s*live.*/gi, '')
      .replace(/\s*\(live.*?\)/gi, '')
      .replace(/\s*\[.*?\]/g, '')
      .replace(/\s*\(official.*?\)/gi, '')
      .trim();
  }

  private async fetchJson(url: string): Promise<any | null> {
    // 1. Try Rust backend native curl fetch first (bypasses CORS & WebKit User-Agent restrictions)
    try {
      const rawText = await invokeCommand<string>('fetch_remote_lyrics', { url });
      if (rawText && rawText.trim().length > 0) {
        return JSON.parse(rawText);
      }
    } catch {
      // Fallback to window.fetch
    }

    // 2. Fallback to standard web fetch (without forbidden User-Agent header)
    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[SpotifyLyrics] fetchJson error:', e);
    }
    return null;
  }

  public async searchLyrics(query: string): Promise<LyricsSearchResult[]> {
    if (!query || query.trim().length === 0) return [];
    try {
      const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query.trim())}`;
      const data = await this.fetchJson(url);
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          id: item.id,
          trackName: item.trackName || item.name || '',
          artistName: item.artistName || '',
          albumName: item.albumName,
          duration: item.duration,
          syncedLyrics: item.syncedLyrics,
          plainLyrics: item.plainLyrics,
        }));
      }
    } catch (e) {
      console.warn('[SpotifyLyrics] searchLyrics error:', e);
    }
    return [];
  }

  public async getLyricsForTrack(artist: string, title: string, durationSecs?: number): Promise<ParsedLrc | null> {
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
        this.currentSource = 'Local File';
        return parsed;
      }
    } catch {
      // Not cached locally, proceed to fetch
    }

    // 2. Fetch from LRCLIB API (Direct Get with or without duration)
    try {
      let data = null;
      if (durationSecs && durationSecs > 0) {
        const directUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}&duration=${Math.round(durationSecs)}`;
        data = await this.fetchJson(directUrl);
      }
      if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
        const directNoDurUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
        data = await this.fetchJson(directNoDurUrl);
      }

      const rawContent = data?.syncedLyrics || data?.plainLyrics;
      if (rawContent && rawContent.trim().length > 0) {
        const parsed = LrcParser.parse(rawContent);
        await this.saveLocalCache(cleanFilename, rawContent);
        this.cache.set(key, parsed);
        this.activeTrackKey = key;
        this.currentLrc = parsed;
        this.currentSource = data.syncedLyrics ? 'LRCLIB (Synced)' : 'LRCLIB (Plain)';
        return parsed;
      }
    } catch (e) {
      console.warn('[SpotifyLyrics] Direct fetch error:', e);
    }

    // 3. Fallback: Cleaned Artist & Title Search
    const cleanArtist = this.cleanString(artist);
    const cleanTitle = this.cleanString(title);
    if (cleanArtist !== artist || cleanTitle !== title) {
      try {
        const cleanUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
        const data = await this.fetchJson(cleanUrl);
        const rawContent = data?.syncedLyrics || data?.plainLyrics;
        if (rawContent && rawContent.trim().length > 0) {
          const parsed = LrcParser.parse(rawContent);
          await this.saveLocalCache(cleanFilename, rawContent);
          this.cache.set(key, parsed);
          this.activeTrackKey = key;
          this.currentLrc = parsed;
          this.currentSource = 'LRCLIB (Cleaned Match)';
          return parsed;
        }
      } catch (e) {
        console.warn('[SpotifyLyrics] Cleaned match error:', e);
      }
    }

    // 4. Fallback: Query Search API
    try {
      const searchResults = await this.searchLyrics(`${cleanArtist} ${cleanTitle}`);
      if (searchResults.length > 0) {
        // Prioritize items with synced lyrics
        const best = searchResults.find((r) => r.syncedLyrics) || searchResults[0];
        const rawContent = best.syncedLyrics || best.plainLyrics;
        if (rawContent && rawContent.trim().length > 0) {
          const parsed = LrcParser.parse(rawContent);
          await this.saveLocalCache(cleanFilename, rawContent);
          this.cache.set(key, parsed);
          this.activeTrackKey = key;
          this.currentLrc = parsed;
          this.currentSource = best.syncedLyrics ? 'LRCLIB Search (Synced)' : 'LRCLIB Search (Plain)';
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[SpotifyLyrics] Fallback search error:', e);
    }

    this.cache.set(key, null);
    this.activeTrackKey = key;
    this.currentLrc = null;
    this.currentSource = 'Not Found';
    return null;
  }

  public async setCustomLyrics(artist: string, title: string, content: string): Promise<ParsedLrc> {
    const key = `${artist.trim()} - ${title.trim()}`.toLowerCase();
    const cleanFilename = `${artist.replace(/[/\?%*:|"<>]/g, '_')} - ${title.replace(/[/\?%*:|"<>]/g, '_')}.lrc`;
    const parsed = LrcParser.parse(content);
    await this.saveLocalCache(cleanFilename, content);
    this.cache.set(key, parsed);
    this.activeTrackKey = key;
    this.currentLrc = parsed;
    this.currentSource = 'Custom User LRC';
    return parsed;
  }

  private async saveLocalCache(filename: string, content: string): Promise<void> {
    try {
      await invokeCommand('save_lyrics_file', { filename, content });
    } catch {
      // Ignore write errors in mock or restricted environments
    }
  }

  public getActiveLine(lrc: ParsedLrc | null, positionSecs: number): string | null {
    if (!lrc || !lrc.lines || lrc.lines.length === 0) return null;
    const adjustedSecs = positionSecs + this.syncOffsetSecs;
    if (adjustedSecs < lrc.lines[0].timeSeconds) return null;
    const idx = LrcParser.findActiveLineIndex(lrc.lines, adjustedSecs);
    if (idx >= 0 && idx < lrc.lines.length) {
      return lrc.lines[idx].text || null;
    }
    return null;
  }

  public getSyncedLyricsLines(lrc: ParsedLrc | null, positionSecs: number): {
    previous: string | null;
    current: string | null;
    next: string | null;
    currentIndex: number;
    totalLines: number;
  } {
    if (!lrc || !lrc.lines || lrc.lines.length === 0) {
      return { previous: null, current: null, next: null, currentIndex: -1, totalLines: 0 };
    }
    const adjustedSecs = positionSecs + this.syncOffsetSecs;
    if (adjustedSecs < lrc.lines[0].timeSeconds) {
      return {
        previous: null,
        current: null,
        next: lrc.lines[0]?.text || null,
        currentIndex: -1,
        totalLines: lrc.lines.length,
      };
    }
    const idx = LrcParser.findActiveLineIndex(lrc.lines, adjustedSecs);
    if (idx >= 0 && idx < lrc.lines.length) {
      const previous = idx > 0 ? lrc.lines[idx - 1].text || null : null;
      const current = lrc.lines[idx].text || null;
      const next = idx + 1 < lrc.lines.length ? lrc.lines[idx + 1].text || null : null;
      return { previous, current, next, currentIndex: idx, totalLines: lrc.lines.length };
    }
    return { previous: null, current: null, next: null, currentIndex: -1, totalLines: lrc.lines.length };
  }

  public getActiveAndNextLines(lrc: ParsedLrc | null, positionSecs: number): {
    current: string | null;
    next: string | null;
    currentIndex: number;
    totalLines: number;
  } {
    const lines = this.getSyncedLyricsLines(lrc, positionSecs);
    return {
      current: lines.current,
      next: lines.next,
      currentIndex: lines.currentIndex,
      totalLines: lines.totalLines,
    };
  }
}

export const spotifyLyricsService = new SpotifyLyricsService();
