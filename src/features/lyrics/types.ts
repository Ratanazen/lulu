export interface LyricLine {
  timeMs: number;
  text: string;
}

export interface ParsedLrc {
  title: string;
  artist: string;
  album: string;
  offsetMs: number;
  lines: LyricLine[];
}

export interface LyricsFileInfo {
  fileName: string;
  path: string;
  title: string;
  artist: string;
}
