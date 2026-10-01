export type MediaProviderKind =
  | 'spotify'
  | 'youtube'
  | 'youtube_music'
  | 'mpris'
  | 'unknown';

export interface MediaSession {
  provider: MediaProviderKind;
  title: string;
  artist?: string | null;
  album?: string | null;
  artwork?: string | null;
  duration_ms?: number | null;
  position_ms?: number | null;
  playing: boolean;
  paused: boolean;
  source_app?: string | null;
  source_url?: string | null;
  media_id?: string | null;
  lyrics_capability?: string;
}

export interface ProviderCapabilityInfo {
  name: string;
  provider: MediaProviderKind;
  active: boolean;
  metadata: string;
  position: string;
  lyrics: string;
  control: string;
}

export interface CleanedTrack {
  artist: string;
  title: string;
  cleanTitle: string;
  isYouTube: boolean;
  provider: MediaProviderKind;
}

/**
 * Normalizes title and artist strings from YouTube, Spotify, and MPRIS players
 */
export function normalizeMediaSession(session: MediaSession | null): CleanedTrack {
  if (!session || !session.title) {
    return {
      artist: '',
      title: '',
      cleanTitle: '',
      isYouTube: false,
      provider: 'unknown',
    };
  }

  let rawTitle = session.title.trim();
  let rawArtist = (session.artist || '').trim();

  // Strip common YouTube browser suffixes
  if (rawTitle.toLowerCase().endsWith(' - youtube')) {
    rawTitle = rawTitle.slice(0, -10).trim();
  }
  if (rawTitle.toLowerCase().endsWith(' | youtube')) {
    rawTitle = rawTitle.slice(0, -10).trim();
  }

  // Strip brackets (e.g. (Official Music Video), [Official Audio], (Lyrics), etc.)
  const bracketRegex = /\s*[\(\[](official\s*(music\s*)?(video|audio)|video|audio|lyrics?|hd|4k|mv|remastered|visualizer)[\)\]]/gi;
  const cleaned = rawTitle.replace(bracketRegex, '').trim();

  let finalTitle = cleaned;
  let finalArtist = rawArtist;

  // If title has "Artist - Song" and artist is missing or identical to channel name
  if (cleaned.includes(' - ')) {
    const [art, song] = cleaned.split(' - ');
    if (art && song) {
      finalArtist = art.trim();
      finalTitle = song.replace(bracketRegex, '').trim();
    }
  } else if (cleaned.includes(' – ')) {
    const [art, song] = cleaned.split(' – ');
    if (art && song) {
      finalArtist = art.trim();
      finalTitle = song.replace(bracketRegex, '').trim();
    }
  }

  const isYouTube = session.provider === 'youtube' || session.provider === 'youtube_music';

  return {
    artist: finalArtist || (isYouTube ? 'YouTube Channel' : 'Unknown Artist'),
    title: finalTitle,
    cleanTitle: finalTitle.replace(/[\(\[].*?[\)\]]/g, '').trim(),
    isYouTube,
    provider: session.provider,
  };
}

export interface ProviderTheme {
  primaryColor: string;
  accentColor: string;
  badgeText: string;
  badgeIcon: string;
  glowColor: string;
  borderColor: string;
}

export function getProviderTheme(provider: MediaProviderKind): ProviderTheme {
  switch (provider) {
    case 'spotify':
      return {
        primaryColor: '#1DB954',
        accentColor: '#34d399',
        badgeText: 'Spotify',
        badgeIcon: '🟢',
        glowColor: 'rgba(29, 185, 84, 0.45)',
        borderColor: 'border-emerald-500/80',
      };
    case 'youtube_music':
      return {
        primaryColor: '#FF4E45',
        accentColor: '#fb7185',
        badgeText: 'YT Music',
        badgeIcon: '🎵',
        glowColor: 'rgba(255, 78, 69, 0.45)',
        borderColor: 'border-rose-500/80',
      };
    case 'youtube':
      return {
        primaryColor: '#FF0000',
        accentColor: '#f87171',
        badgeText: 'YouTube',
        badgeIcon: '🔴',
        glowColor: 'rgba(255, 0, 0, 0.45)',
        borderColor: 'border-red-500/80',
      };
    case 'mpris':
      return {
        primaryColor: '#6366F1',
        accentColor: '#818cf8',
        badgeText: 'MPRIS',
        badgeIcon: '🎧',
        glowColor: 'rgba(99, 102, 241, 0.45)',
        borderColor: 'border-indigo-500/80',
      };
    default:
      return {
        primaryColor: '#8B5CF6',
        accentColor: '#a78bfa',
        badgeText: 'Media',
        badgeIcon: '🐾',
        glowColor: 'rgba(139, 92, 246, 0.45)',
        borderColor: 'border-purple-500/80',
      };
  }
}
