/**
 * AudioReactiveEngine: High-performance audio-reactive engine for Lulu
 * 
 * Provides:
 * - Real-time 8 & 16 band frequency spectrum synthesis and analysis
 * - Physical attack, decay, and peak-hold physics
 * - Rhythmic beat pulse detection [0..1] and audio energy calculation [0..1]
 * - Dual-mode architecture:
 *   1. Algorithmic Rhythm Synthesizer (zero dependencies, 100% reliable on Wayland/Linux)
 *   2. Web Audio API / AnalyserNode hook when live audio capture is enabled
 */

export type AudioReactiveMode = 'beat_bounce' | 'equalizer_groove' | 'gentle_ambient' | 'off';
export type VisualizerStyle = 'bars' | 'mini' | 'wave';

export interface AudioReactiveState {
  isPlaying: boolean;
  beatPulse: number;          // 0.0 - 1.0 (spikes sharply on beats)
  audioEnergy: number;        // 0.0 - 1.0 (ambient song energy / loudness)
  bassLevel: number;          // 0.0 - 1.0 (low-end thud)
  midLevel: number;           // 0.0 - 1.0 (vocals & melody)
  trebleLevel: number;        // 0.0 - 1.0 (hi-hats & air)
  bands8: number[];           // 8 frequency bands [0..1]
  bands16: number[];          // 16 frequency bands [0..1]
  bpm: number;                // Estimated or default tempo
}

export type AudioReactiveListener = (state: AudioReactiveState) => void;

export class AudioReactiveEngine {
  private isPlaying: boolean = false;
  private currentPositionMs: number = 0;
  private bpm: number = 120;
  private mode: AudioReactiveMode = 'beat_bounce';
  private sensitivity: number = 1.0;

  // Smoothing state for 16 bands
  private bands16: number[] = new Array(16).fill(0);
  private peakHold16: number[] = new Array(16).fill(0);
  private peakDecay: number = 0.02;

  // Beat pulse state
  private beatPulse: number = 0;
  private audioEnergy: number = 0;

  // Listeners
  private listeners: Set<AudioReactiveListener> = new Set();
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  // Web Audio hook (optional live analyser)
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  constructor() {
    this.startLoop();
  }

  /**
   * Set playback state from media session
   */
  public updatePlayback(isPlaying: boolean, positionMs: number = 0, bpmEstimate?: number) {
    this.isPlaying = isPlaying;
    this.currentPositionMs = positionMs;
    if (bpmEstimate && bpmEstimate > 40 && bpmEstimate < 240) {
      this.bpm = bpmEstimate;
    }
  }

  /**
   * Set reactive mode
   */
  public setMode(mode: AudioReactiveMode) {
    this.mode = mode;
  }

  public getMode(): AudioReactiveMode {
    return this.mode;
  }

  /**
   * Set sensitivity multiplier (0.5 to 2.0)
   */
  public setSensitivity(value: number) {
    this.sensitivity = Math.max(0.2, Math.min(2.5, value));
  }

  public getSensitivity(): number {
    return this.sensitivity;
  }

  /**
   * Subscribe to state updates (called ~30-60fps)
   */
  public subscribe(listener: AudioReactiveListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Attach a live Web Audio MediaStream (e.g. from user microphone or system loopback)
   */
  public attachMediaStream(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 64;
      this.analyserNode.smoothingTimeConstant = 0.8;
      source.connect(this.analyserNode);

      const bufferLength = this.analyserNode.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
    } catch {
      this.audioContext = null;
      this.analyserNode = null;
    }
  }

  /**
   * Detach live Web Audio stream and revert to synthetic engine
   */
  public detachMediaStream() {
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.analyserNode = null;
      this.dataArray = null;
    }
  }

  /**
   * Main calculation loop (runs every ~33ms, 30fps)
   */
  private startLoop() {
    if (this.tickInterval) return;

    this.tickInterval = setInterval(() => {
      this.computeFrame();
    }, 33);
  }

  public stopLoop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Compute single frame of frequency spectrum & beat pulses
   */
  public computeFrame(): AudioReactiveState {
    if (!this.isPlaying || this.mode === 'off') {
      // Natural decay down to zero when stopped
      for (let i = 0; i < 16; i++) {
        this.bands16[i] = Math.max(0, this.bands16[i] - 0.08);
        this.peakHold16[i] = Math.max(0, this.peakHold16[i] - this.peakDecay * 2);
      }
      this.beatPulse = Math.max(0, this.beatPulse - 0.1);
      this.audioEnergy = Math.max(0, this.audioEnergy - 0.08);

      const state = this.buildState();
      this.notifyListeners(state);
      return state;
    }

    // Advance synthetic position if playing
    this.currentPositionMs += 33;

    // Check if live Web Audio analyzer is active
    if (this.analyserNode && this.dataArray) {
      this.computeFromLiveAnalyser();
    } else {
      this.computeFromSyntheticEngine();
    }

    const state = this.buildState();
    this.notifyListeners(state);
    return state;
  }

  /**
   * Real Web Audio Analyser calculation
   */
  private computeFromLiveAnalyser() {
    if (!this.analyserNode || !this.dataArray) return;
    this.analyserNode.getByteFrequencyData(this.dataArray as any);

    const binCount = this.dataArray.length;
    const step = Math.max(1, Math.floor(binCount / 16));

    let sum = 0;
    for (let i = 0; i < 16; i++) {
      const idx = Math.min(i * step, binCount - 1);
      const raw = (this.dataArray[idx] || 0) / 255;
      const target = Math.min(1.0, raw * this.sensitivity);

      // Smooth attack & decay
      if (target > this.bands16[i]) {
        this.bands16[i] = this.bands16[i] * 0.4 + target * 0.6;
      } else {
        this.bands16[i] = this.bands16[i] * 0.8 + target * 0.2;
      }

      // Peak hold
      if (this.bands16[i] >= this.peakHold16[i]) {
        this.peakHold16[i] = this.bands16[i];
      } else {
        this.peakHold16[i] = Math.max(0, this.peakHold16[i] - this.peakDecay);
      }

      sum += this.bands16[i];
    }

    this.audioEnergy = Math.min(1.0, sum / 16);

    // Beat pulse from low bass transients (first 3 bands)
    const bassTransient = (this.bands16[0] + this.bands16[1] + this.bands16[2]) / 3;
    if (bassTransient > 0.65) {
      this.beatPulse = Math.min(1.0, bassTransient * 1.2);
    } else {
      this.beatPulse = Math.max(0, this.beatPulse - 0.15);
    }
  }

  /**
   * High-Precision Synthetic Rhythm & Equalizer Engine
   * Generates realistic, dynamic 16-band equalizer motion synchronized to position & BPM
   */
  private computeFromSyntheticEngine() {
    const timeSec = this.currentPositionMs / 1000;
    const beatIntervalSec = 60 / this.bpm;
    const beatFraction = (timeSec % beatIntervalSec) / beatIntervalSec; // 0.0 at beat start -> 1.0 at next beat

    // Sharp attack on the beat, followed by exponential decay
    // Decay curve: e^(-7.5 * beatFraction)
    const basePulse = Math.exp(-7.5 * beatFraction);
    
    // Half-beat snare backbeat (on 2nd and 4th beats)
    const measureFraction = (timeSec % (beatIntervalSec * 4)) / (beatIntervalSec * 4);
    const isSnareBeat = (measureFraction >= 0.24 && measureFraction <= 0.35) || (measureFraction >= 0.74 && measureFraction <= 0.85);
    const snarePulse = isSnareBeat ? Math.exp(-9.0 * ((measureFraction % 0.25) / 0.25)) * 0.75 : 0;

    const rawBeatPulse = Math.min(1.0, Math.max(basePulse, snarePulse) * this.sensitivity);

    if (this.mode === 'gentle_ambient') {
      this.beatPulse = rawBeatPulse * 0.4;
    } else {
      this.beatPulse = rawBeatPulse;
    }

    // Overall energy swells smoothly over musical phrasing (16-beat cycle)
    const phraseCycle = Math.sin(timeSec * (Math.PI / (beatIntervalSec * 8))) * 0.25 + 0.75;
    this.audioEnergy = Math.min(1.0, (0.45 + rawBeatPulse * 0.35) * phraseCycle * this.sensitivity);

    // Synthesize 16 frequency bands with harmonic curves
    for (let i = 0; i < 16; i++) {
      let bandTarget = 0;

      if (i < 3) {
        // Bass kick
        const sub = Math.sin(timeSec * 8 + i) * 0.15 + 0.3;
        bandTarget = (this.beatPulse * 0.75 + sub * 0.25) * this.sensitivity;
      } else if (i < 8) {
        // Mids & Harmony
        const midWave = Math.sin(timeSec * 4 + i * 1.2) * 0.25 + 0.45;
        bandTarget = (midWave * 0.65 + this.beatPulse * 0.35) * this.sensitivity;
      } else if (i < 12) {
        // Vocals
        const vocalWave = Math.cos(timeSec * 6 + i * 0.8) * 0.3 + 0.5;
        bandTarget = (vocalWave * 0.7 + this.audioEnergy * 0.3) * this.sensitivity;
      } else {
        // Highs & Percussion
        const flutter = Math.sin(timeSec * 16 + i * 2) * 0.2 + 0.35;
        const hiPulse = (isSnareBeat ? snarePulse : 0) * 0.5;
        bandTarget = (flutter * 0.5 + hiPulse * 0.5) * this.sensitivity;
      }

      bandTarget = Math.max(0.05, Math.min(1.0, bandTarget));

      // Natural spring attack & decay
      if (bandTarget > this.bands16[i]) {
        this.bands16[i] = this.bands16[i] * 0.3 + bandTarget * 0.7; // Fast attack
      } else {
        this.bands16[i] = this.bands16[i] * 0.82 + bandTarget * 0.18; // Smooth decay
      }

      // Peak-hold caps
      if (this.bands16[i] >= this.peakHold16[i]) {
        this.peakHold16[i] = this.bands16[i];
      } else {
        this.peakHold16[i] = Math.max(0, this.peakHold16[i] - this.peakDecay);
      }
    }
  }

  /**
   * Build complete immutable state object
   */
  private buildState(): AudioReactiveState {
    // 8-band downsampling by averaging pairs of 16-band values
    const bands8: number[] = [];
    for (let i = 0; i < 8; i++) {
      bands8.push((this.bands16[i * 2] + this.bands16[i * 2 + 1]) / 2);
    }

    const bassLevel = (this.bands16[0] + this.bands16[1] + this.bands16[2]) / 3;
    const midLevel = (this.bands16[5] + this.bands16[6] + this.bands16[7]) / 3;
    const trebleLevel = (this.bands16[13] + this.bands16[14] + this.bands16[15]) / 3;

    return {
      isPlaying: this.isPlaying,
      beatPulse: Math.min(1.0, Math.max(0, this.beatPulse)),
      audioEnergy: Math.min(1.0, Math.max(0, this.audioEnergy)),
      bassLevel: Math.min(1.0, Math.max(0, bassLevel)),
      midLevel: Math.min(1.0, Math.max(0, midLevel)),
      trebleLevel: Math.min(1.0, Math.max(0, trebleLevel)),
      bands8,
      bands16: [...this.bands16],
      bpm: this.bpm,
    };
  }

  public getState(): AudioReactiveState {
    return this.buildState();
  }

  private notifyListeners(state: AudioReactiveState) {
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch {
        // Isolate listener errors
      }
    }
  }
}

// Export singleton instance
export const audioReactiveEngine = new AudioReactiveEngine();
