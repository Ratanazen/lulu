export type SoundEffect =
  | 'click'
  | 'chirp'
  | 'purr'
  | 'happy'
  | 'jump'
  | 'step'
  | 'achievement'
  | 'game_win'
  | 'game_over'
  | 'morning_chime'
  | 'lullaby'
  | 'notification';

class SoundService {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public masterVolume: number = 0.7;
  public characterVolume: number = 0.8;
  public gameVolume: number = 0.7;
  public notificationVolume: number = 0.8;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public play(effect: SoundEffect, category: 'character' | 'game' | 'notification' | 'ui' = 'character'): void {
    if (!this.enabled || this.masterVolume <= 0) return;

    let catVol = 1.0;
    if (category === 'character') catVol = this.characterVolume;
    else if (category === 'game') catVol = this.gameVolume;
    else if (category === 'notification') catVol = this.notificationVolume;

    const finalVol = this.masterVolume * catVol;
    if (finalVol <= 0) return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      switch (effect) {
        case 'click':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
          gain.gain.setValueAtTime(finalVol * 0.3, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
          break;

        case 'chirp':
        case 'happy':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.1); // G5
          osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2); // C6
          gain.gain.setValueAtTime(finalVol * 0.4, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
          break;

        case 'jump':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(650, now + 0.15);
          gain.gain.setValueAtTime(finalVol * 0.35, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;

        case 'step':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(120, now);
          gain.gain.setValueAtTime(finalVol * 0.15, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.03);
          osc.start(now);
          osc.stop(now + 0.03);
          break;

        case 'achievement':
          osc.type = 'triangle';
          // Fanfare arpeggio
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(554.37, now + 0.08);
          osc.frequency.setValueAtTime(659.25, now + 0.16);
          osc.frequency.setValueAtTime(880, now + 0.24);
          gain.gain.setValueAtTime(finalVol * 0.4, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.45);
          break;

        case 'game_win':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now);
          osc.frequency.setValueAtTime(880, now + 0.1);
          gain.gain.setValueAtTime(finalVol * 0.35, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
          break;

        case 'game_over':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(350, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);
          gain.gain.setValueAtTime(finalVol * 0.25, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
          break;

        case 'morning_chime':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
          osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
          osc.frequency.setValueAtTime(987.77, now + 0.3); // B5
          osc.frequency.setValueAtTime(1046.5, now + 0.4); // C6
          gain.gain.setValueAtTime(finalVol * 0.4, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.65);
          osc.start(now);
          osc.stop(now + 0.65);
          break;

        case 'lullaby':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(783.99, now); // G5
          osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
          osc.frequency.setValueAtTime(523.25, now + 0.3); // C5
          osc.frequency.setValueAtTime(440.0, now + 0.45); // A4
          gain.gain.setValueAtTime(finalVol * 0.35, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.7);
          osc.start(now);
          osc.stop(now + 0.7);
          break;

        case 'notification':
        default:
          osc.type = 'sine';
          osc.frequency.setValueAtTime(659.25, now); // E5
          osc.frequency.setValueAtTime(880, now + 0.08); // A5
          gain.gain.setValueAtTime(finalVol * 0.3, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
      }
    } catch {
      // Audio playback fails gracefully
    }
  }
}

export const soundService = new SoundService();
