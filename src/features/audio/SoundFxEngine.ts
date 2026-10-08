/**
 * Lulu Desktop Companion — Sound Effects Engine (Phase 10)
 * 
 * Pure Web Audio API procedural synthesis:
 * - Zero external .mp3/.wav asset files
 * - Zero network bandwidth / offline immediate playback
 * - Shimmering headpat harp chime, playful snack crunch, sprint wind whoosh,
 *   Susanoo chakra shield resonance, zen sleep lullaby chime, and rank-up fanfare.
 */

export type SoundFxType =
  | 'headpat'
  | 'snack'
  | 'sprint_whoosh'
  | 'shield_hum'
  | 'sleep_lullaby'
  | 'rank_up_fanfare'
  | 'click';

export interface SoundFxConfig {
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
}

const STORAGE_KEY = 'lulu_sound_fx_config';

export class SoundFxEngine {
  private static instance: SoundFxEngine | null = null;
  private ctx: AudioContext | null = null;
  private volume: number = 0.75;
  private isMuted: boolean = false;
  private listeners: Set<(config: SoundFxConfig) => void> = new Set();

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): SoundFxEngine {
    if (!SoundFxEngine.instance) {
      SoundFxEngine.instance = new SoundFxEngine();
    }
    return SoundFxEngine.instance;
  }

  private loadConfig(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.volume === 'number') {
            this.volume = Math.max(0, Math.min(1, parsed.volume));
          }
          if (typeof parsed.isMuted === 'boolean') {
            this.isMuted = parsed.isMuted;
          }
        }
      }
    } catch {
      // Ignore storage errors in sandbox/SSR
    }
  }

  private saveConfig(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ volume: this.volume, isMuted: this.isMuted })
        );
      }
    } catch {
      // Ignore storage errors
    }
    this.notifyListeners();
  }

  public subscribe(fn: (config: SoundFxConfig) => void): () => void {
    this.listeners.add(fn);
    fn(this.getConfig());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notifyListeners(): void {
    const config = this.getConfig();
    for (const fn of this.listeners) {
      try {
        fn(config);
      } catch (err) {
        console.error('[SoundFxEngine] Listener error:', err);
      }
    }
  }

  public getConfig(): SoundFxConfig {
    return {
      volume: this.volume,
      isMuted: this.isMuted,
    };
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    this.saveConfig();
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.saveConfig();
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.saveConfig();
    return this.isMuted;
  }

  private getAudioContext(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    if (typeof window !== 'undefined') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.ctx = new AudioCtxClass();
          return this.ctx;
        } catch (e) {
          console.warn('[SoundFxEngine] Failed to create AudioContext:', e);
        }
      }
    }

    return null;
  }

  /**
   * Shimmering harp chime for affectionate headpats & petting
   * Ascending C6 (1046.5Hz) -> G6 (1567.98Hz)
   */
  public playHeadpat(): void {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseGain = this.volume * 0.25;

    // Note 1: C6
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(baseGain, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Note 2: G6 (shimmer sparkle)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1567.98, now + 0.08);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.001, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(baseGain * 0.9, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.4);
  }

  /**
   * Playful snack munch / crunch pop (850Hz -> 380Hz bite drop)
   */
  public playSnack(): void {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseGain = this.volume * 0.3;

    // Crunch 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(860, now);
    osc1.frequency.exponentialRampToValueAtTime(320, now + 0.09);
    gain1.gain.setValueAtTime(baseGain, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.11);

    // Crunch 2 (second bite)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1020, now + 0.09);
    osc2.frequency.exponentialRampToValueAtTime(440, now + 0.19);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(baseGain * 0.85, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.22);
  }

  /**
   * Aerodynamic sprint wind sweep / dash whoosh
   */
  public playSprintWhoosh(): void {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseGain = this.volume * 0.22;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.28);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(900, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.28);
    filter.Q.setValueAtTime(3.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(baseGain, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Susanoo chakra shield low resonant humming tone (110Hz + 220Hz harmonic)
   */
  public playShield(): void {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseGain = this.volume * 0.28;

    // Fundamental A2
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now);
    filter.frequency.linearRampToValueAtTime(520, now + 0.25);
    filter.frequency.linearRampToValueAtTime(220, now + 0.55);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(baseGain, now + 0.12);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc1.connect(filter);
    filter.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.58);
  }

  /**
   * Soothing bedtime lullaby chime / droplet (E5 = 659Hz)
   */
  public playSleep(): void {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseGain = this.volume * 0.2;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.exponentialRampToValueAtTime(650.0, now + 0.5);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(baseGain, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.58);
  }

  /**
   * Triumphant 4-note ascending fanfare chord (C5 -> E5 -> G5 -> C6)
   */
  public playRankUp(): void {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseGain = this.volume * 0.25;
    const notes = [
      { freq: 523.25, start: 0.00, dur: 0.22 },  // C5
      { freq: 659.25, start: 0.14, dur: 0.22 },  // E5
      { freq: 783.99, start: 0.28, dur: 0.24 },  // G5
      { freq: 1046.5, start: 0.44, dur: 0.55 },  // C6 (ringing finale)
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.setValueAtTime(0.001, now + note.start);
      gain.gain.exponentialRampToValueAtTime(baseGain, now + note.start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur + 0.05);
    });
  }

  /**
   * Crisp UI micro-interaction click
   */
  public playClick(): void {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const baseGain = this.volume * 0.15;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);

    gain.gain.setValueAtTime(baseGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playSound(type: SoundFxType): void {
    switch (type) {
      case 'headpat':
        this.playHeadpat();
        break;
      case 'snack':
        this.playSnack();
        break;
      case 'sprint_whoosh':
        this.playSprintWhoosh();
        break;
      case 'shield_hum':
        this.playShield();
        break;
      case 'sleep_lullaby':
        this.playSleep();
        break;
      case 'rank_up_fanfare':
        this.playRankUp();
        break;
      case 'click':
        this.playClick();
        break;
    }
  }
}

export const soundFxEngine = SoundFxEngine.getInstance();
