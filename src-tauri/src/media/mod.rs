use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MediaProviderKind {
    Spotify,
    Youtube,
    YoutubeMusic,
    Mpris,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaSession {
    pub provider: MediaProviderKind,
    pub title: String,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub artwork: Option<String>,
    pub duration_ms: Option<u64>,
    pub position_ms: Option<u64>,
    pub playing: bool,
    pub paused: bool,
    pub source_app: Option<String>,
    pub source_url: Option<String>,
    pub media_id: Option<String>,
    pub lyrics_capability: String, // "SUPPORTED", "PARTIAL", "UNSUPPORTED"
}

impl Default for MediaSession {
    fn default() -> Self {
        Self {
            provider: MediaProviderKind::Unknown,
            title: "".to_string(),
            artist: None,
            album: None,
            artwork: None,
            duration_ms: None,
            position_ms: None,
            playing: false,
            paused: false,
            source_app: None,
            source_url: None,
            media_id: None,
            lyrics_capability: "UNSUPPORTED".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderCapabilityInfo {
    pub name: String,
    pub provider: MediaProviderKind,
    pub active: bool,
    pub metadata: String,
    pub position: String,
    pub lyrics: String,
    pub control: String,
}

pub trait MediaProvider {
    fn name(&self) -> &'static str;
    fn kind(&self) -> MediaProviderKind;
    fn detect(&self) -> Option<MediaSession>;
}

/// Helper to sanitize and normalize YouTube video titles
pub fn parse_youtube_title(raw_title: &str, raw_artist: Option<&str>) -> (String, Option<String>) {
    let mut title = raw_title.trim().to_string();

    // Remove common YouTube suffixes
    if title.to_lowercase().ends_with(" - youtube") {
        title = title[..title.len() - 10].trim().to_string();
    }
    if title.to_lowercase().ends_with(" | youtube") {
        title = title[..title.len() - 10].trim().to_string();
    }

    // Clean brackets like (Official Video), [Official Audio], etc.
    let re_bracket = regex::Regex::new(r"(?i)\s*[\(\[](official\s*(music\s*)?video|audio|lyrics?|hd|4k|mv|remastered|visualizer)[\)\]]").unwrap();
    let cleaned = re_bracket.replace_all(&title, "").trim().to_string();

    // If title has "Artist - Song", split it
    if let Some((art, song)) = cleaned.split_once(" - ") {
        return (song.trim().to_string(), Some(art.trim().to_string()));
    } else if let Some((art, song)) = cleaned.split_once(" – ") {
        // En dash
        return (song.trim().to_string(), Some(art.trim().to_string()));
    } else if let Some((art, song)) = cleaned.split_once(" : ") {
        return (song.trim().to_string(), Some(art.trim().to_string()));
    }

    // Fallback: return cleaned title and raw artist
    (cleaned, raw_artist.map(|a| a.trim().to_string()))
}

/// Discover all active MPRIS media players and return their raw sessions
pub fn discover_mpris_sessions() -> Vec<MediaSession> {
    // Format: {{playerName}};;;{{status}};;;{{title}};;;{{artist}};;;{{album}};;;{{position}};;;{{mpris:length}};;;{{mpris:artUrl}};;;{{xesam:url}};;;{{mpris:trackid}}
    let output = Command::new("playerctl")
        .args([
            "-a",
            "metadata",
            "--format",
            "{{playerName}};;;{{status}};;;{{title}};;;{{artist}};;;{{album}};;;{{position}};;;{{mpris:length}};;;{{mpris:artUrl}};;;{{xesam:url}};;;{{mpris:trackid}}",
        ])
        .output();

    let output = match output {
        Ok(out) if out.status.success() => String::from_utf8_lossy(&out.stdout).trim().to_string(),
        _ => return Vec::new(),
    };

    if output.is_empty() {
        return Vec::new();
    }

    let mut sessions = Vec::new();

    for line in output.lines() {
        let parts: Vec<&str> = line.split(";;;").collect();
        if parts.len() < 7 {
            continue;
        }

        let player = parts[0].trim();
        let status = parts[1].trim();
        let raw_title = parts[2].trim();
        let raw_artist = parts[3].trim();
        let raw_album = parts[4].trim();

        let position_micros: f64 = parts[5].trim().parse().unwrap_or(0.0);
        let duration_micros: f64 = parts[6].trim().parse().unwrap_or(0.0);

        let artwork = if parts.len() > 7 && !parts[7].trim().is_empty() {
            Some(parts[7].trim().to_string())
        } else {
            None
        };

        let source_url = if parts.len() > 8 && !parts[8].trim().is_empty() {
            Some(parts[8].trim().to_string())
        } else {
            None
        };

        let media_id = if parts.len() > 9 && !parts[9].trim().is_empty() {
            Some(parts[9].trim().to_string())
        } else {
            None
        };

        let is_playing = status.eq_ignore_ascii_case("Playing");
        let is_paused = status.eq_ignore_ascii_case("Paused");

        let position_ms = if position_micros > 0.0 {
            Some((position_micros / 1000.0) as u64)
        } else {
            Some(0)
        };

        let duration_ms = if duration_micros > 0.0 {
            Some((duration_micros / 1000.0) as u64)
        } else {
            None
        };

        // Determine Provider Kind
        let player_lower = player.to_lowercase();
        let url_lower = source_url.as_deref().unwrap_or("").to_lowercase();
        let title_lower = raw_title.to_lowercase();

        let (provider, final_title, final_artist, lyrics_cap) = if player_lower.contains("spotify")
            || url_lower.contains("open.spotify.com")
        {
            (
                MediaProviderKind::Spotify,
                raw_title.to_string(),
                if !raw_artist.is_empty() { Some(raw_artist.to_string()) } else { None },
                "SUPPORTED".to_string(),
            )
        } else if url_lower.contains("music.youtube.com") || player_lower.contains("youtubemusic") {
            let (t, a) = parse_youtube_title(raw_title, if !raw_artist.is_empty() { Some(raw_artist) } else { None });
            (MediaProviderKind::YoutubeMusic, t, a, "SUPPORTED".to_string())
        } else if url_lower.contains("youtube.com")
            || url_lower.contains("youtu.be")
            || title_lower.ends_with("- youtube")
        {
            let (t, a) = parse_youtube_title(raw_title, if !raw_artist.is_empty() { Some(raw_artist) } else { None });
            (MediaProviderKind::Youtube, t, a, "PARTIAL".to_string())
        } else {
            (
                MediaProviderKind::Mpris,
                raw_title.to_string(),
                if !raw_artist.is_empty() { Some(raw_artist.to_string()) } else { None },
                if !raw_artist.is_empty() { "SUPPORTED".to_string() } else { "PARTIAL".to_string() },
            )
        };

        sessions.push(MediaSession {
            provider,
            title: final_title,
            artist: final_artist,
            album: if !raw_album.is_empty() { Some(raw_album.to_string()) } else { None },
            artwork,
            duration_ms,
            position_ms,
            playing: is_playing,
            paused: is_paused,
            source_app: Some(player.to_string()),
            source_url,
            media_id,
            lyrics_capability: lyrics_cap,
        });
    }

    sessions
}

/// Retrieve the active, prioritized media session
#[tauri::command]
pub fn get_media_session(filter_provider: Option<String>) -> Result<MediaSession, String> {
    let sessions = discover_mpris_sessions();
    if sessions.is_empty() {
        return Ok(MediaSession::default());
    }

    // Filter by specific provider if requested (e.g. "spotify" or "youtube")
    let filtered: Vec<&MediaSession> = if let Some(ref p) = filter_provider {
        let p_lower = p.to_lowercase();
        sessions
            .iter()
            .filter(|s| match s.provider {
                MediaProviderKind::Spotify => p_lower.contains("spotify"),
                MediaProviderKind::Youtube => p_lower == "youtube",
                MediaProviderKind::YoutubeMusic => p_lower.contains("youtube_music") || p_lower.contains("yt_music"),
                MediaProviderKind::Mpris => p_lower == "mpris",
                MediaProviderKind::Unknown => false,
            })
            .collect()
    } else {
        sessions.iter().collect()
    };

    if filtered.is_empty() {
        return Ok(MediaSession::default());
    }

    // Prioritize: Playing session first (Spotify > YouTube Music > YouTube > MPRIS), then Paused
    let mut chosen = filtered[0];

    // Priority hierarchy for actively playing sessions
    for session in &filtered {
        if session.playing {
            if !chosen.playing {
                chosen = session;
            } else {
                // If both playing, prioritize Spotify > YT Music > YouTube > MPRIS
                let rank = |k: &MediaProviderKind| match k {
                    MediaProviderKind::Spotify => 4,
                    MediaProviderKind::YoutubeMusic => 3,
                    MediaProviderKind::Youtube => 2,
                    MediaProviderKind::Mpris => 1,
                    MediaProviderKind::Unknown => 0,
                };
                if rank(&session.provider) > rank(&chosen.provider) {
                    chosen = session;
                }
            }
        }
    }

    Ok((*chosen).clone())
}

/// Get capability list of all detected media providers
#[tauri::command]
pub fn list_media_providers() -> Result<Vec<ProviderCapabilityInfo>, String> {
    let sessions = discover_mpris_sessions();

    let mut result = Vec::new();

    // 1. Spotify
    let spotify_active = sessions.iter().any(|s| s.provider == MediaProviderKind::Spotify);
    result.push(ProviderCapabilityInfo {
        name: "Spotify (Native & Web MPRIS)".to_string(),
        provider: MediaProviderKind::Spotify,
        active: spotify_active,
        metadata: "YES".to_string(),
        position: "YES".to_string(),
        lyrics: "YES* (LRCLIB & Local Cache)".to_string(),
        control: "YES* (Play/Pause/Skip)".to_string(),
    });

    // 2. YouTube Music
    let ytmusic_active = sessions.iter().any(|s| s.provider == MediaProviderKind::YoutubeMusic);
    result.push(ProviderCapabilityInfo {
        name: "YouTube Music (Browser MPRIS)".to_string(),
        provider: MediaProviderKind::YoutubeMusic,
        active: ytmusic_active,
        metadata: "YES".to_string(),
        position: "YES".to_string(),
        lyrics: "YES* (Artist+Title match)".to_string(),
        control: "LIMITED (Media Keys)".to_string(),
    });

    // 3. YouTube
    let yt_active = sessions.iter().any(|s| s.provider == MediaProviderKind::Youtube);
    result.push(ProviderCapabilityInfo {
        name: "YouTube (Browser MPRIS)".to_string(),
        provider: MediaProviderKind::Youtube,
        active: yt_active,
        metadata: "YES".to_string(),
        position: "YES".to_string(),
        lyrics: "PARTIAL (Music Video match)".to_string(),
        control: "LIMITED (Media Keys)".to_string(),
    });

    // 4. MPRIS Generic
    let mpris_active = sessions.iter().any(|s| s.provider == MediaProviderKind::Mpris);
    result.push(ProviderCapabilityInfo {
        name: "Linux MPRIS (VLC, mpv, Amberol)".to_string(),
        provider: MediaProviderKind::Mpris,
        active: mpris_active,
        metadata: "YES".to_string(),
        position: "YES".to_string(),
        lyrics: "YES* (Tag & File match)".to_string(),
        control: "DEPENDS (Playerctl)".to_string(),
    });

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_youtube_title_with_suffix() {
        let (title, artist) = parse_youtube_title("Coldplay - Yellow (Official Video) - YouTube", None);
        assert_eq!(title, "Yellow");
        assert_eq!(artist.as_deref(), Some("Coldplay"));
    }

    #[test]
    fn test_parse_youtube_title_dash() {
        let (title, artist) = parse_youtube_title("The Weeknd – Blinding Lights [Audio]", None);
        assert_eq!(title, "Blinding Lights");
        assert_eq!(artist.as_deref(), Some("The Weeknd"));
    }

    #[test]
    fn test_parse_youtube_title_plain() {
        let (title, artist) = parse_youtube_title("Chilling lofi beats to relax", Some("Lofi Girl"));
        assert_eq!(title, "Chilling lofi beats to relax");
        assert_eq!(artist.as_deref(), Some("Lofi Girl"));
    }
}
