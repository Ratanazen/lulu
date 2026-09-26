import { LrcParser } from './LrcParser';
import { LyricLine, LyricsFileInfo, ParsedLrc } from './types';

let tauriInvoke: (<T = any>(cmd: string, args?: Record<string, unknown>) => Promise<T>) | null = null;

async function getInvoke() {
  if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
    return null;
  }
  if (tauriInvoke) return tauriInvoke;
  try {
    const core = await import('@tauri-apps/api/core');
    tauriInvoke = core.invoke;
    return tauriInvoke;
  } catch {
    return null;
  }
}

export class LyricsSyncManager {
  private activeLrc: ParsedLrc | null = null;
  private activeIndex: number = -1;
  private lastUpdateMs: number = 0;
  private lastPositionMs: number = -1;
  private minIntervalMs: number = 100;
  private listeners: Set<(current: LyricLine | null, next: LyricLine | null) => void> = new Set();

  public setThrottleInterval(ms: number) {
    this.minIntervalMs = Math.max(50, ms);
  }

  public updatePosition(positionMs: number): {
    current: LyricLine | null;
    next: LyricLine | null;
    hasChanged: boolean;
  } {
    if (!this.activeLrc || this.activeLrc.lines.length === 0) {
      return { current: null, next: null, hasChanged: false };
    }

    const now = performance.now();
    // Throttle frequent redundant checks when position changes smoothly by small amounts
    if (
      this.activeIndex !== -1 &&
      now - this.lastUpdateMs < this.minIntervalMs &&
      Math.abs(positionMs - this.lastPositionMs) < 600
    ) {
      return { current: null, next: null, hasChanged: false };
    }

    this.lastUpdateMs = now;
    this.lastPositionMs = positionMs;

    const { current, next, index } = LrcParser.getLyricAtTime(this.activeLrc.lines, positionMs);

    const hasChanged = index !== this.activeIndex;
    if (hasChanged) {
      this.activeIndex = index;
      this.notifyListeners(current, next);
    }

    return { current, next, hasChanged };
  }

  public async fetchLocalLyricsList(): Promise<LyricsFileInfo[]> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        return await invoke<LyricsFileInfo[]>('list_local_lyrics');
      } catch (e) {
        console.warn('[LyricsSyncManager] list_local_lyrics failed:', e);
      }
    }
    // Fallback bundled list
    return [
      {
        fileName: 'starlight_dreams.lrc',
        path: 'music/starlight_dreams.lrc',
        title: 'Starlight Dreams',
        artist: 'Lulu & The Stars',
      },
      {
        fileName: 'cyber_groove.lrc',
        path: 'music/cyber_groove.lrc',
        title: 'Cyber Groove',
        artist: 'Byte Beat Syndicate',
      },
      {
        fileName: 'cozy_rain.lrc',
        path: 'music/cozy_rain.lrc',
        title: 'Cozy Rain',
        artist: 'Lo-Fi Companion',
      },
    ];
  }

  public async loadLyricsFile(path: string): Promise<ParsedLrc | null> {
    const invoke = await getInvoke();
    let content = '';

    if (invoke) {
      try {
        content = await invoke<string>('load_lrc_content', { path });
      } catch (e) {
        console.warn('[LyricsSyncManager] load_lrc_content failed:', e);
      }
    }

    if (!content) {
      // Offline fallback sample content
      content = `[ti:Starlight Dreams]\n[ar:Lulu & The Stars]\n[00:00.00]♪ Starlight Dreams - Lulu & The Stars ♪\n[00:05.00]Looking up at the velvet night\n[00:09.50]Millions of galaxies glowing bright\n[00:14.20]Floating gently through the cosmic sea\n[00:19.00]Where time stands still for you and me`;
    }

    const parsed = LrcParser.parse(content);
    this.activeLrc = parsed;
    this.activeIndex = -1;
    return parsed;
  }

  public loadRawLrc(content: string): ParsedLrc {
    const parsed = LrcParser.parse(content);
    this.activeLrc = parsed;
    this.activeIndex = -1;
    return parsed;
  }

  public getActiveLrc(): ParsedLrc | null {
    return this.activeLrc;
  }

  public onLyricChange(cb: (current: LyricLine | null, next: LyricLine | null) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notifyListeners(current: LyricLine | null, next: LyricLine | null) {
    for (const listener of this.listeners) {
      try {
        listener(current, next);
      } catch (e) {
        console.error('[LyricsSyncManager] listener error:', e);
      }
    }
  }

  public clear() {
    this.activeLrc = null;
    this.activeIndex = -1;
    this.notifyListeners(null, null);
  }
}

export const lyricsSyncManager = new LyricsSyncManager();
