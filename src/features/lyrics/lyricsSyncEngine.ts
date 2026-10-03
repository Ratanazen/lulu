import { ParsedLrc } from './lrcParser';

export interface LyricLineMs {
  startMs: number;
  text: string;
}

export interface SyncEngineState {
  currentLineIndex: number;
  previousText: string | null;
  currentText: string | null;
  nextText: string | null;
  totalLines: number;
  trackKey: string;
  isPaused: boolean;
  positionMs: number;
  durationMs: number;
}

/**
 * Convert standard ParsedLrc (seconds-based) to millisecond timestamp lines.
 */
export function parsedLrcToMs(lrc: ParsedLrc | null): LyricLineMs[] {
  if (!lrc || !lrc.lines) return [];
  return lrc.lines.map((line) => ({
    startMs: Math.round(line.timeSeconds * 1000),
    text: line.text,
  }));
}

/**
 * LyricsSyncEngine — Native Millisecond-Accurate Lyric Sync Engine for Lulu.
 *
 * SOURCE OF TRUTH:
 * Spotify / YouTube / YouTube Music playback position (D-Bus / MPRIS / playerctl)
 *         ↓
 *     positionMs
 *         ↓
 *   LyricsSyncEngine
 *         ↓
 *   currentLineIndex
 *         ↓
 *       Lulu UI
 *
 * Current line rule:
 * line.startMs <= effectivePositionMs < nextLine.startMs
 * For the final lyric:
 * effectivePositionMs >= finalLine.startMs
 */
export class LyricsSyncEngine {
  private lines: LyricLineMs[] = [];
  private trackKey: string = '';
  private currentLineIndex: number = -1;
  private isPaused: boolean = false;
  private lastPositionMs: number = 0;
  private durationMs: number = 0;
  private syncToleranceMs: number = 100;
  private listeners: Array<(state: SyncEngineState) => void> = [];

  constructor(syncToleranceMs: number = 100) {
    this.syncToleranceMs = syncToleranceMs;
  }

  public setTolerance(ms: number) {
    this.syncToleranceMs = Math.max(0, ms);
  }

  public getTolerance(): number {
    return this.syncToleranceMs;
  }

  public getTrackKey(): string {
    return this.trackKey;
  }

  public getCurrentLineIndex(): number {
    return this.currentLineIndex;
  }

  public isPlaybackPaused(): boolean {
    return this.isPaused;
  }

  public getLines(): readonly LyricLineMs[] {
    return this.lines;
  }

  /**
   * Load lyrics for a specific track. Clears existing state if track changes.
   */
  public loadLyrics(lines: LyricLineMs[], trackKey: string, durationMs: number = 0) {
    const isNewTrack = this.trackKey !== trackKey;
    if (isNewTrack) {
      this.clear();
      this.trackKey = trackKey;
    }

    this.lines = [...lines].sort((a, b) => a.startMs - b.startMs);
    this.durationMs = durationMs;

    // Recalculate with current position if playing
    if (!this.isPaused && this.lastPositionMs > 0) {
      this.currentLineIndex = this.findCurrentLine(this.lastPositionMs);
    }
    this.notify();
  }

  /**
   * Clear all loaded lyrics and reset state. Never show old lyrics over a new track.
   */
  public clear() {
    this.lines = [];
    this.trackKey = '';
    this.currentLineIndex = -1;
    this.durationMs = 0;
    this.notify();
  }

  /**
   * Binary search to find current line index at effectivePositionMs.
   *
   * Exact Rules:
   * - effectivePositionMs = positionMs + syncToleranceMs
   * - Before first line (intro): returns -1
   * - Between lines: line.startMs <= effectivePositionMs < nextLine.startMs -> returns line index
   * - Final line: effectivePositionMs >= finalLine.startMs -> returns last index
   */
  public findCurrentLine(positionMs: number): number {
    if (this.lines.length === 0) return -1;
    const effectiveMs = positionMs + this.syncToleranceMs;

    if (effectiveMs < this.lines[0].startMs) {
      return -1; // Instrumental intro before first lyric
    }

    let low = 0;
    let high = this.lines.length - 1;
    let activeIdx = -1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.lines[mid].startMs <= effectiveMs) {
        activeIdx = mid;
        low = mid + 1; // Try to find a later line that also qualifies
      } else {
        high = mid - 1;
      }
    }

    return activeIdx;
  }

  /**
   * Primary sync loop entry point (~200ms frequency or event-driven).
   *
   * - When Paused: Freeze current lyric line and progress. Do not advance or clear.
   * - When Playing: Recalculate currentLineIndex immediately from positionMs.
   * - On Seek: Immediately jumps to target line index without intermediate animations.
   */
  public updatePosition(
    positionMs: number,
    playbackStatus: 'Playing' | 'Paused' | 'Stopped'
  ): SyncEngineState {
    const wasPaused = this.isPaused;
    this.isPaused = playbackStatus === 'Paused';
    this.lastPositionMs = Math.max(0, positionMs);

    if (playbackStatus === 'Stopped') {
      this.clear();
      return this.getState();
    }

    if (playbackStatus === 'Paused') {
      // Freeze current line: preserve currentLineIndex & lines
      return this.getState();
    }

    // Playback is active: evaluate current line
    const prevIndex = this.currentLineIndex;
    const newIndex = this.findCurrentLine(this.lastPositionMs);
    this.currentLineIndex = newIndex;

    if (newIndex !== prevIndex || wasPaused) {
      this.notify();
    }

    return this.getState();
  }

  /**
   * Extract 3 lines around the active line:
   * Boundary rules:
   * - If index < 0 (intro instrumental): previous=null, current=null, next=firstLine
   * - If index = 0 (first line): previous=null, current=line[0], next=line[1]
   * - If index = lastIndex (final lyric): previous=line[last-1], current=line[last], next=null
   * - Otherwise: previous=line[i-1], current=line[i], next=line[i+1]
   */
  public getLinesAround(index: number = this.currentLineIndex): {
    previous: string | null;
    current: string | null;
    next: string | null;
  } {
    if (this.lines.length === 0) {
      return { previous: null, current: null, next: null };
    }

    if (index < 0) {
      return {
        previous: null,
        current: null,
        next: this.lines[0]?.text || null,
      };
    }

    const current = index < this.lines.length ? this.lines[index].text : null;
    const previous = index > 0 && index - 1 < this.lines.length ? this.lines[index - 1].text : null;
    const next = index + 1 < this.lines.length ? this.lines[index + 1].text : null;

    return { previous, current, next };
  }

  /**
   * Return full snapshot of engine state for reactive UI bindings.
   */
  public getState(): SyncEngineState {
    const { previous, current, next } = this.getLinesAround(this.currentLineIndex);
    return {
      currentLineIndex: this.currentLineIndex,
      previousText: previous,
      currentText: current,
      nextText: next,
      totalLines: this.lines.length,
      trackKey: this.trackKey,
      isPaused: this.isPaused,
      positionMs: this.lastPositionMs,
      durationMs: this.durationMs,
    };
  }

  public subscribe(listener: (state: SyncEngineState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

export const lyricsSyncEngine = new LyricsSyncEngine(100);
