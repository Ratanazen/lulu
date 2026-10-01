use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LyricsFileInfo {
    pub filename: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub path: String,
}

fn get_lyrics_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let dir = PathBuf::from(home).join(".local/share/lulu-desktop/lyrics");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

#[tauri::command]
pub fn list_local_lyrics() -> Result<Vec<LyricsFileInfo>, String> {
    let dir = get_lyrics_dir()?;
    let mut results = Vec::new();

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("lrc") {
                let filename = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                
                // Quick scan of metadata tags
                let mut title = None;
                let mut artist = None;
                if let Ok(content) = fs::read_to_string(&path) {
                    for line in content.lines().take(20) {
                        let line = line.trim();
                        if line.starts_with("[ti:") && line.ends_with(']') {
                            title = Some(line[4..line.len() - 1].trim().to_string());
                        } else if line.starts_with("[ar:") && line.ends_with(']') {
                            artist = Some(line[4..line.len() - 1].trim().to_string());
                        }
                    }
                }

                results.push(LyricsFileInfo {
                    filename,
                    title,
                    artist,
                    path: path.to_string_lossy().to_string(),
                });
            }
        }
    }

    Ok(results)
}

#[tauri::command]
pub fn read_lyrics_file(filename: String) -> Result<String, String> {
    let dir = get_lyrics_dir()?;
    let path = dir.join(&filename);
    if !path.exists() {
        return Err(format!("Lyrics file not found: {}", filename));
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_lyrics_file(filename: String, content: String) -> Result<String, String> {
    let dir = get_lyrics_dir()?;
    let clean_name = if filename.ends_with(".lrc") {
        filename
    } else {
        format!("{}.lrc", filename)
    };
    let path = dir.join(&clean_name);
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(clean_name)
}

#[tauri::command]
pub fn delete_lyrics_file(filename: String) -> Result<(), String> {
    let dir = get_lyrics_dir()?;
    let path = dir.join(filename);
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn fetch_remote_lyrics(url: String) -> Result<String, String> {
    let output = std::process::Command::new("curl")
        .args([
            "-s",
            "--max-time",
            "6",
            "-H",
            "User-Agent: Lulu-Desktop/0.2.0 (Linux)",
            &url,
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

