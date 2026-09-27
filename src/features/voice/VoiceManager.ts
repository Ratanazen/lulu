import { VoiceSettings, VoiceState } from './types';
import { StorageService } from '../../services/storageService';
import { lipSyncController } from '../../character/LipSyncController';

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  autoSpeak: false,
  volume: 0.8,
  pitch: 1.1,
  rate: 1.0,
  selectedVoiceUri: '',
  pushToTalk: true,
};

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

export class VoiceManager {
  private settings: VoiceSettings = DEFAULT_VOICE_SETTINGS;
  private state: VoiceState = {
    isListening: false,
    isSpeaking: false,
    isSupported: false,
    transcript: '',
    error: null,
  };

  private onStateChangeCallback?: (state: VoiceState) => void;
  private onTranscriptCallback?: (transcript: string) => void;

  constructor() {
    this.checkSupport();
  }

  async initialize(): Promise<void> {
    const saved = await StorageService.get<VoiceSettings>('lulu_voice_settings', DEFAULT_VOICE_SETTINGS);
    this.settings = { ...DEFAULT_VOICE_SETTINGS, ...saved };
  }

  private checkSupport(): void {
    if (typeof window === 'undefined') return;
    const hasSpeech = 'speechSynthesis' in window;
    const hasTauri = !!(window as any).__TAURI_INTERNALS__;
    this.state.isSupported = hasSpeech || hasTauri;
  }

  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  getState(): VoiceState {
    return { ...this.state };
  }

  updateSettings(partial: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...partial };
    StorageService.set('lulu_voice_settings', this.settings).catch(console.error);
  }

  onStateChange(cb: (state: VoiceState) => void): void {
    this.onStateChangeCallback = cb;
  }

  onTranscript(cb: (transcript: string) => void): void {
    this.onTranscriptCallback = cb;
  }

  private notify(): void {
    this.onStateChangeCallback?.(this.getState());
  }

  // --- Text to Speech (TTS) ---

  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }

  async speak(text: string): Promise<void> {
    if (!this.settings.enabled) return;

    // 1. Try Native Linux TTS (espeak-ng / espeak) first via Tauri
    const invoke = await getInvoke();
    if (invoke) {
      try {
        const rate = Math.round(150 * (this.settings.rate || 1.0));
        const pitch = Math.round(55 * (this.settings.pitch || 1.1));
        const volume = Math.round(100 * (this.settings.volume ?? 0.8));

        const ok = await invoke<boolean>('speak_native_text', {
          text,
          rate,
          pitch,
          volume,
        });

        if (ok) {
          this.state.isSpeaking = true;
          lipSyncController.startSpeechCadence();
          this.notify();

          const wordCount = text.split(/\s+/).filter(Boolean).length;
          const estDurationMs = Math.max(1200, Math.round((wordCount / (rate / 60)) * 1000));

          setTimeout(() => {
            this.state.isSpeaking = false;
            lipSyncController.stopSpeechCadence();
            this.notify();
          }, estDurationMs);

          return;
        }
      } catch (err) {
        console.warn('[VoiceManager] Native Linux TTS failed, falling back to Web Speech API', err);
      }
    }

    // 2. Fall back to browser Web Speech API
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    return new Promise((resolve) => {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.settings.volume;
      utterance.pitch = this.settings.pitch;
      utterance.rate = this.settings.rate;

      if (this.settings.selectedVoiceUri) {
        const voices = this.getAvailableVoices();
        const found = voices.find((v) => v.voiceURI === this.settings.selectedVoiceUri);
        if (found) utterance.voice = found;
      }

      utterance.onstart = () => {
        this.state.isSpeaking = true;
        lipSyncController.startSpeechCadence();
        this.notify();
      };

      utterance.onend = () => {
        this.state.isSpeaking = false;
        lipSyncController.stopSpeechCadence();
        this.notify();
        resolve();
      };

      utterance.onerror = (e) => {
        this.state.isSpeaking = false;
        lipSyncController.stopSpeechCadence();
        this.state.error = e.error || 'TTS Error';
        this.notify();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  async stopSpeaking(): Promise<void> {
    const invoke = await getInvoke();
    if (invoke) {
      invoke('stop_native_speech').catch(() => {});
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    lipSyncController.stopSpeechCadence();
    this.state.isSpeaking = false;
    this.notify();
  }

  // --- Speech to Text (STT) ---
  // STT is unsupported in Linux WebKitGTK / Tauri webview environment without heavy external daemon.

  startListening(): void {
    this.state.isListening = false;
  }

  stopListening(): void {
    this.state.isListening = false;
  }
}

export const voiceManager = new VoiceManager();
