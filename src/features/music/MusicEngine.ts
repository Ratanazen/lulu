import { MediaStatus, MusicState } from './types';
import { lyricsSyncManager } from '../lyrics/LyricsSync';

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

export type MusicListener = (status: MediaStatus, state: MusicState) => void;

export class MusicEngine {
  private status: MediaStatus = {
    isAvailable: false,
    playerName: '',
    status: 'none',
    title: '',
    artist: '',
    album: '',
    artUrl: '',
    durationMs: 0,
    positionMs: 0,
  };

  private state: MusicState = 'MUSIC_STOPPED';
  private pollingTimer: ReturnType<typeof setTimeout> | null = null;
  private isRunning: boolean = false;
  private listeners: Set<MusicListener> = new Set();
  private onStateChangeCallback: ((state: MusicState, trackTitle: string) => void) | null = null;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.pollLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  public getStatus(): MediaStatus {
    return { ...this.status };
  }

  public getState(): MusicState {
    return this.state;
  }

  public onStatusChange(listener: MusicListener): () => void {
    this.listeners.add(listener);
    listener(this.status, this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setOnStateChange(cb: (state: MusicState, trackTitle: string) => void) {
    this.onStateChangeCallback = cb;
  }

  public async control(action: 'play-pause' | 'next' | 'previous' | 'play' | 'pause' | 'stop'): Promise<void> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('media_control', { action });
        await this.refreshOnce();
      } catch (e) {
        console.warn('[MusicEngine] media_control failed:', e);
      }
    }
  }

  public async refreshOnce(): Promise<MediaStatus> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        const nextStatus = await invoke<MediaStatus>('get_media_status');
        this.processNewStatus(nextStatus);
        return nextStatus;
      } catch (e) {
        console.warn('[MusicEngine] get_media_status failed:', e);
      }
    }
    return this.status;
  }

  public simulatePlayback(title: string, artist: string, durationMs: number = 180000) {
    this.processNewStatus({
      isAvailable: true,
      playerName: 'Demo Player',
      status: 'playing',
      title,
      artist,
      album: 'Demo Album',
      artUrl: '',
      durationMs,
      positionMs: 0,
    });
  }

  private async pollLoop() {
    if (!this.isRunning) return;

    await this.refreshOnce();

    // Determine poll interval: faster when playing (250ms for smooth lyrics), slower when paused (1200ms)
    const interval = this.status.status === 'playing' ? 300 : 1500;
    this.pollingTimer = setTimeout(() => {
      this.pollLoop();
    }, interval);
  }

  private processNewStatus(nextStatus: MediaStatus) {
    const prevStatus = this.status;
    const prevPlayback = prevStatus.status;
    const nextPlayback = nextStatus.status;

    this.status = nextStatus;

    // Derive MusicState
    let nextState: MusicState = 'MUSIC_STOPPED';
    if (!nextStatus.isAvailable || nextPlayback === 'none' || nextPlayback === 'stopped') {
      nextState = 'MUSIC_STOPPED';
    } else if (nextPlayback === 'playing') {
      nextState = 'MUSIC_PLAYING';
    } else if (nextPlayback === 'paused') {
      nextState = 'MUSIC_PAUSED';
    } else {
      nextState = 'MUSIC_DETECTED';
    }

    const stateChanged = nextState !== this.state || prevPlayback !== nextPlayback;
    this.state = nextState;

    // Update real-time lyrics position
    if (nextStatus.positionMs > 0 || nextStatus.status === 'playing') {
      lyricsSyncManager.updatePosition(nextStatus.positionMs);
    }

    if (stateChanged && this.onStateChangeCallback) {
      this.onStateChangeCallback(nextState, nextStatus.title);
    }

    for (const listener of this.listeners) {
      try {
        listener(nextStatus, nextState);
      } catch (e) {
        console.error('[MusicEngine] Listener error:', e);
      }
    }
  }
}

export const musicEngine = new MusicEngine();
