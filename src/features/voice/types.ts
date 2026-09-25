// Voice Subsystem Types

export interface VoiceSettings {
  enabled: boolean;
  autoSpeak: boolean;
  volume: number; // 0 - 1
  pitch: number;  // 0.5 - 2
  rate: number;   // 0.5 - 2
  selectedVoiceUri: string;
  pushToTalk: boolean;
}

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
}
