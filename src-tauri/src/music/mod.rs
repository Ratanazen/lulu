use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicTrackInfo {
    pub player: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub playback_status: String, // "Playing", "Paused", "Stopped", "NoPlayer"
    pub position_secs: f64,
    pub duration_secs: f64,
    pub can_control: bool,
}

impl Default for MusicTrackInfo {
    fn default() -> Self {
        Self {
            player: "None".to_string(),
            title: "".to_string(),
            artist: "".to_string(),
            album: "".to_string(),
            playback_status: "NoPlayer".to_string(),
            position_secs: 0.0,
            duration_secs: 0.0,
            can_control: false,
        }
    }
}

#[tauri::command]
pub fn get_music_status() -> Result<MusicTrackInfo, String> {
    let output = Command::new("playerctl")
        .args(["-a", "metadata", "--format", "{{playerName}};;;{{status}};;;{{title}};;;{{artist}};;;{{album}};;;{{position}};;;{{mpris:length}}"])
        .output();

    let output = match output {
        Ok(out) if out.status.success() => {
            String::from_utf8_lossy(&out.stdout).trim().to_string()
        }
        _ => return Ok(MusicTrackInfo::default()),
    };

    if output.is_empty() {
        return Ok(MusicTrackInfo::default());
    }

    // playerctl outputs multiple lines if multiple players are running; prioritize Spotify or active Playing player
    let mut chosen_line = output.lines().next().unwrap_or("");
    for line in output.lines() {
        let parts: Vec<&str> = line.split(";;;").collect();
        if parts.len() >= 2 {
            let player = parts[0].trim().to_lowercase();
            let status = parts[1].trim();
            if player.contains("spotify") && status == "Playing" {
                chosen_line = line;
                break;
            } else if status == "Playing" && !chosen_line.contains("Playing") {
                chosen_line = line;
            } else if player.contains("spotify") && !chosen_line.contains("Playing") {
                chosen_line = line;
            }
        }
    }
    let parts: Vec<&str> = chosen_line.split(";;;").collect();

    if parts.len() < 7 {
        return Ok(MusicTrackInfo::default());
    }

    let player = parts[0].trim().to_string();
    let status = parts[1].trim().to_string();
    let title = parts[2].trim().to_string();
    let artist = parts[3].trim().to_string();
    let album = parts[4].trim().to_string();

    let position_micros: f64 = parts[5].trim().parse().unwrap_or(0.0);
    let duration_micros: f64 = parts[6].trim().parse().unwrap_or(0.0);

    let position_secs = position_micros / 1_000_000.0;
    let duration_secs = duration_micros / 1_000_000.0;

    let playback_status = if status.is_empty() {
        "NoPlayer".to_string()
    } else {
        status
    };

    let can_control = playback_status != "NoPlayer";

    Ok(MusicTrackInfo {
        player,
        title,
        artist,
        album,
        playback_status,
        position_secs,
        duration_secs,
        can_control,
    })
}

#[tauri::command]
pub fn music_play_pause() -> Result<String, String> {
    let status = Command::new("playerctl")
        .arg("play-pause")
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok("Toggled playback".to_string())
    } else {
        Err("No active media player found to play/pause".to_string())
    }
}

#[tauri::command]
pub fn music_next() -> Result<String, String> {
    let status = Command::new("playerctl")
        .arg("next")
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok("Skipped to next track".to_string())
    } else {
        Err("Unable to skip track".to_string())
    }
}

#[tauri::command]
pub fn music_previous() -> Result<String, String> {
    let status = Command::new("playerctl")
        .arg("previous")
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok("Skipped to previous track".to_string())
    } else {
        Err("Unable to skip to previous track".to_string())
    }
}
