use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LyricsFileInfo {
    pub file_name: String,
    pub path: String,
    pub title: String,
    pub artist: String,
}

pub struct LyricsService;

impl LyricsService {
    /// Discovers local .lrc lyrics files in the project music/ folder and standard music paths
    pub fn list_local_lyrics() -> Result<Vec<LyricsFileInfo>, String> {
        let mut results = Vec::new();
        let search_dirs = Self::get_lyrics_search_dirs();

        for dir in search_dirs {
            if dir.exists() && dir.is_dir() {
                if let Ok(entries) = fs::read_dir(&dir) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.extension().and_then(|s| s.to_str()) == Some("lrc") {
                            let file_name = path
                                .file_name()
                                .and_then(|s| s.to_str())
                                .unwrap_or("unknown.lrc")
                                .to_string();

                            // Fast header extraction for title & artist
                            let (title, artist) = Self::peek_metadata(&path);

                            results.push(LyricsFileInfo {
                                file_name,
                                path: path.to_string_lossy().to_string(),
                                title,
                                artist,
                            });
                        }
                    }
                }
            }
        }

        Ok(results)
    }

    /// Loads the raw string content of a local .lrc file
    pub fn load_lrc_content(path_str: &str) -> Result<String, String> {
        let path = Path::new(path_str);
        if !path.exists() {
            return Err(format!("Lyrics file not found: {}", path_str));
        }
        fs::read_to_string(path).map_err(|e| format!("Failed to read lyrics: {}", e))
    }

    fn peek_metadata(path: &Path) -> (String, String) {
        let mut title = String::new();
        let mut artist = String::new();

        if let Ok(content) = fs::read_to_string(path) {
            for line in content.lines().take(15) {
                let trimmed = line.trim();
                if trimmed.starts_with("[ti:") && trimmed.ends_with(']') {
                    title = trimmed[4..trimmed.len() - 1].trim().to_string();
                } else if trimmed.starts_with("[ar:") && trimmed.ends_with(']') {
                    artist = trimmed[4..trimmed.len() - 1].trim().to_string();
                }
            }
        }

        if title.is_empty() {
            title = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Unknown Track")
                .to_string();
        }

        (title, artist)
    }

    fn get_lyrics_search_dirs() -> Vec<PathBuf> {
        let mut dirs = Vec::new();

        // 1. Current working dir / music
        dirs.push(PathBuf::from("music"));

        // 2. Relative to executable
        if let Ok(exe) = std::env::current_exe() {
            if let Some(parent) = exe.parent() {
                dirs.push(parent.join("music"));
                dirs.push(parent.join("../music"));
                dirs.push(parent.join("../../music"));
            }
        }

        // 3. User Music directory (~/Music)
        if let Some(home) = std::env::var_os("HOME") {
            let music_dir = PathBuf::from(home).join("Music");
            dirs.push(music_dir.join("lyrics"));
            dirs.push(music_dir);
        }

        dirs
    }
}
