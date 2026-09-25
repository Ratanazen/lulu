import { VoiceSettings, VoiceState } from './types';
import { StorageService } from '../../services/storageService';

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  autoSpeak: false,
  volume: 0.8,
  pitch: 1.1,
  rate: 1.0,
  selectedVoiceUri: '',
  pushToTalk: true,
};

export class VoiceManager {
  private settings: VoiceSettings = DEFAULT_VOICE_SETTINGS;
  private state: VoiceState = {
    isListening: false,
    isSpeaking: false,
    isSupported: false,
    transcript: '',
    error: null,
  };

  private recognition: any = null;
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
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.state.isSupported = hasSpeech || hasRecognition;
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

  speak(text: string): Promise<void> {
    if (!this.settings.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      window.speechSynthesis.cancel(); // stop any ongoing speech

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
        this.notify();
      };

      utterance.onend = () => {
        this.state.isSpeaking = false;
        this.notify();
        resolve();
      };

      utterance.onerror = (e) => {
        this.state.isSpeaking = false;
        this.state.error = e.error || 'TTS Error';
        this.notify();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.state.isSpeaking = false;
      this.notify();
    }
  }

  // --- Speech to Text (STT) ---

  startListening(): void {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      this.state.error = 'Speech recognition is not supported in this environment.';
      this.notify();
      return;
    }

    try {
      this.stopListening();

      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.state.isListening = true;
        this.state.transcript = '';
        this.state.error = null;
        this.notify();
      };

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        this.state.transcript = transcript;
        this.notify();
      };

      this.recognition.onerror = (event: any) => {
        this.state.isListening = false;
        this.state.error = event.error || 'Recognition error';
        this.notify();
      };

      this.recognition.onend = () => {
        this.state.isListening = false;
        if (this.state.transcript && this.onTranscriptCallback) {
          this.onTranscriptCallback(this.state.transcript);
        }
        this.notify();
      };

      this.recognition.start();
    } catch (err: any) {
      this.state.isListening = false;
      this.state.error = err.message || 'Failed to start speech recognition.';
      this.notify();
    }
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    this.state.isListening = false;
    this.notify();
  }
}

export const voiceManager = new VoiceManager();
