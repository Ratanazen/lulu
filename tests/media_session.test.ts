import { describe, it, expect } from 'vitest';
import { normalizeMediaSession, getProviderTheme, MediaSession } from '../src/features/media/mediaSession';

describe('MediaSession & YouTube/Spotify Normalization', () => {
  it('normalizes standard Spotify session', () => {
    const session: MediaSession = {
      provider: 'spotify',
      title: 'Sweet',
      artist: 'Cigarettes After Sex',
      album: 'Cigarettes After Sex',
      playing: true,
      paused: false,
    };

    const cleaned = normalizeMediaSession(session);
    expect(cleaned.provider).toBe('spotify');
    expect(cleaned.artist).toBe('Cigarettes After Sex');
    expect(cleaned.title).toBe('Sweet');
    expect(cleaned.isYouTube).toBe(false);
  });

  it('normalizes YouTube composite video title and strips channel suffix', () => {
    const session: MediaSession = {
      provider: 'youtube',
      title: 'Coldplay - Yellow (Official Music Video) - YouTube',
      artist: 'Coldplay',
      playing: true,
      paused: false,
    };

    const cleaned = normalizeMediaSession(session);
    expect(cleaned.provider).toBe('youtube');
    expect(cleaned.artist).toBe('Coldplay');
    expect(cleaned.title).toBe('Yellow');
    expect(cleaned.isYouTube).toBe(true);
  });

  it('handles YouTube title with dash when artist is only channel name', () => {
    const session: MediaSession = {
      provider: 'youtube_music',
      title: 'The Weeknd – Blinding Lights [Official Audio]',
      artist: 'Various Artists',
      playing: true,
      paused: false,
    };

    const cleaned = normalizeMediaSession(session);
    expect(cleaned.provider).toBe('youtube_music');
    expect(cleaned.artist).toBe('The Weeknd');
    expect(cleaned.title).toBe('Blinding Lights');
    expect(cleaned.isYouTube).toBe(true);
  });

  it('returns appropriate theme styling for each media provider', () => {
    const spotTheme = getProviderTheme('spotify');
    expect(spotTheme.badgeText).toBe('Spotify');
    expect(spotTheme.primaryColor).toBe('#1DB954');

    const ytTheme = getProviderTheme('youtube');
    expect(ytTheme.badgeText).toBe('YouTube');
    expect(ytTheme.primaryColor).toBe('#FF0000');

    const ytmTheme = getProviderTheme('youtube_music');
    expect(ytmTheme.badgeText).toBe('YT Music');
  });
});
