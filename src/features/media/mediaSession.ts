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
  searchQuery: string;
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
      searchQuery: '',
      isYouTube: false,
      provider: 'unknown',
    };
  }

  let rawTitle = session.title.trim();
  let rawArtist = (session.artist || '').trim();

  // Strip unread notification counts like "(809) " or "(1) "
  rawTitle = rawTitle.replace(/^\s*\(\d+\)\s*/, '').trim();

  // Strip common YouTube browser suffixes
  rawTitle = rawTitle
    .replace(/\s*-\s*youtube(\s*music)?$/i, '')
    .replace(/\s*\|\s*youtube(\s*music)?$/i, '')
    .trim();

  // Strip brackets (e.g. (Official Music Video), [Official Audio], (Lyrics), etc.)
  const bracketRegex = /\s*[\(\[](official\s*(music\s*)?(video|audio)?|video|audio|lyrics?|hd|4k|mv|remastered|visualizer|color\s*coded(\s*lyrics)?|eng\s*sub|live|acoustic|performance)[\)\]]/gi;
  const cleaned = rawTitle.replace(bracketRegex, '').trim();

  let finalTitle = cleaned;
  let finalArtist = rawArtist;

  // If title has "Artist - Song" or "Song - Artist"
  if (cleaned.includes(' - ')) {
    const [partA, partB] = cleaned.split(' - ');
    if (partA && partB) {
      finalArtist = partA.trim();
      finalTitle = partB.replace(bracketRegex, '').trim();
    }
  } else if (cleaned.includes(' – ')) {
    const [partA, partB] = cleaned.split(' – ');
    if (partA && partB) {
      finalArtist = partA.trim();
      finalTitle = partB.replace(bracketRegex, '').trim();
    }
  }

  const isYouTube = session.provider === 'youtube' || session.provider === 'youtube_music';

  return {
    artist: finalArtist || (isYouTube ? 'YouTube Channel' : 'Unknown Artist'),
    title: finalTitle,
    cleanTitle: finalTitle.replace(/[\(\[].*?[\)\]]/g, '').trim(),
    searchQuery: cleaned,
    isYouTube,
    provider: session.provider,
  };
}

export type MediaProviderIcon = 'spotify' | 'youtube' | 'youtube_music' | 'mpris' | 'media';

export interface ProviderTheme {
  primaryColor: string;
  accentColor: string;
  badgeText: string;
  badgeIcon: string;
  iconType: MediaProviderIcon;
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
        iconType: 'spotify',
        glowColor: 'rgba(29, 185, 84, 0.45)',
        borderColor: 'border-emerald-500/80',
      };
    case 'youtube_music':
      return {
        primaryColor: '#FF4E45',
        accentColor: '#fb7185',
        badgeText: 'YT Music',
        badgeIcon: '🎵',
        iconType: 'youtube_music',
        glowColor: 'rgba(255, 78, 69, 0.45)',
        borderColor: 'border-rose-500/80',
      };
    case 'youtube':
      return {
        primaryColor: '#FF0000',
        accentColor: '#f87171',
        badgeText: 'YouTube',
        badgeIcon: '🔴',
        iconType: 'youtube',
        glowColor: 'rgba(255, 0, 0, 0.45)',
        borderColor: 'border-red-500/80',
      };
    case 'mpris':
      return {
        primaryColor: '#6366F1',
        accentColor: '#818cf8',
        badgeText: 'MPRIS',
        badgeIcon: '🎧',
        iconType: 'mpris',
        glowColor: 'rgba(99, 102, 241, 0.45)',
        borderColor: 'border-indigo-500/80',
      };
    default:
      return {
        primaryColor: '#8B5CF6',
        accentColor: '#a78bfa',
        badgeText: 'Media',
        badgeIcon: '🐾',
        iconType: 'media',
        glowColor: 'rgba(139, 92, 246, 0.45)',
        borderColor: 'border-purple-500/80',
      };
  }
}
