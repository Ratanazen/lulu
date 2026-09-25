export type MusicState =
  | 'MUSIC_DETECTED'
  | 'MUSIC_PLAYING'
  | 'MUSIC_PAUSED'
  | 'MUSIC_STOPPED';

export interface MediaStatus {
  isAvailable: boolean;
  playerName: string;
  status: string; // "playing", "paused", "stopped", "none"
  title: string;
  artist: string;
  album: string;
  artUrl: string;
  durationMs: number;
  positionMs: number;
}
