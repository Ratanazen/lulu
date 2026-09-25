use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaStatus {
    pub is_available: bool,
    pub player_name: String,
    pub status: String, // "playing", "paused", "stopped", "none"
    pub title: String,
    pub artist: String,
    pub album: String,
    pub art_url: String,
    pub duration_ms: u64,
    pub position_ms: u64,
}

pub struct MusicService;

impl MusicService {
    pub fn get_media_status() -> MediaStatus {
        #[cfg(target_os = "linux")]
        {
            // 1. Check player status
            let status_output = std::process::Command::new("playerctl")
                .arg("status")
                .output();

            let status_str = match status_output {
                Ok(out) if out.status.success() => {
                    String::from_utf8_lossy(&out.stdout).trim().to_lowercase()
                }
                _ => "none".to_string(),
            };

            if status_str == "none" || status_str.is_empty() {
                return MediaStatus {
                    is_available: false,
                    player_name: String::new(),
                    status: "none".to_string(),
                    title: String::new(),
                    artist: String::new(),
                    album: String::new(),
                    art_url: String::new(),
                    duration_ms: 0,
                    position_ms: 0,
                };
            }

            // 2. Query formatted metadata
            let meta_output = std::process::Command::new("playerctl")
                .arg("metadata")
                .arg("--format")
                .arg("{{playerName}};;;{{title}};;;{{artist}};;;{{album}};;;{{mpris:artUrl}};;;{{mpris:length}};;;{{position}}")
                .output();

            if let Ok(meta) = meta_output {
                if meta.status.success() {
                    let line = String::from_utf8_lossy(&meta.stdout);
                    let parts: Vec<&str> = line.trim().split(";;;").collect();
                    if parts.len() >= 4 {
                        let player_name = parts.get(0).unwrap_or(&"").trim().to_string();
                        let title = parts.get(1).unwrap_or(&"").trim().to_string();
                        let artist = parts.get(2).unwrap_or(&"").trim().to_string();
                        let album = parts.get(3).unwrap_or(&"").trim().to_string();
                        let art_url = parts.get(4).unwrap_or(&"").trim().to_string();

                        // mpris:length is in microseconds
                        let duration_us = parts.get(5).unwrap_or(&"0").trim().parse::<u64>().unwrap_or(0);
                        let duration_ms = duration_us / 1000;

                        // position is in seconds or microseconds depending on playerctl version
                        let pos_raw = parts.get(6).unwrap_or(&"0").trim().parse::<f64>().unwrap_or(0.0);
                        let position_ms = (pos_raw * 1000.0) as u64;

                        return MediaStatus {
                            is_available: true,
                            player_name,
                            status: status_str,
                            title,
                            artist,
                            album,
                            art_url,
                            duration_ms,
                            position_ms,
                        };
                    }
                }
            }

            MediaStatus {
                is_available: true,
                player_name: "Media Player".to_string(),
                status: status_str,
                title: String::new(),
                artist: String::new(),
                album: String::new(),
                art_url: String::new(),
                duration_ms: 0,
                position_ms: 0,
            }
        }

        #[cfg(not(target_os = "linux"))]
        {
            MediaStatus {
                is_available: false,
                player_name: String::new(),
                status: "none".to_string(),
                title: String::new(),
                artist: String::new(),
                album: String::new(),
                art_url: String::new(),
                duration_ms: 0,
                position_ms: 0,
            }
        }
    }

    pub fn media_control(action: &str) -> Result<(), String> {
        #[cfg(target_os = "linux")]
        {
            let cmd = match action {
                "play-pause" => "play-pause",
                "next" => "next",
                "previous" => "previous",
                "play" => "play",
                "pause" => "pause",
                "stop" => "stop",
                _ => return Err(format!("Unknown media action: {}", action)),
            };

            let res = std::process::Command::new("playerctl")
                .arg(cmd)
                .output();

            match res {
                Ok(_) => Ok(()),
                Err(e) => Err(format!("Failed to control media: {}", e)),
            }
        }

        #[cfg(not(target_os = "linux"))]
        {
            Err("MPRIS media control is only supported on Linux".to_string())
        }
    }
}
