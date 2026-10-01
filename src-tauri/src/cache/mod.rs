use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStatus {
    pub cache_dir: String,
    pub total_files: usize,
    pub total_bytes: u64,
    pub lyrics_count: usize,
    pub media_count: usize,
    pub artwork_count: usize,
}

pub fn get_cache_root() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    PathBuf::from(home).join(".cache/lulu")
}

pub fn ensure_cache_dirs() -> Result<(PathBuf, PathBuf, PathBuf), String> {
    let root = get_cache_root();
    let media = root.join("media");
    let lyrics = root.join("lyrics");
    let artwork = root.join("artwork");

    fs::create_dir_all(&media).map_err(|e| e.to_string())?;
    fs::create_dir_all(&lyrics).map_err(|e| e.to_string())?;
    fs::create_dir_all(&artwork).map_err(|e| e.to_string())?;

    Ok((media, lyrics, artwork))
}

fn dir_stats(dir: &Path) -> (usize, u64) {
    let mut count = 0;
    let mut bytes = 0;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    count += 1;
                    bytes += metadata.len();
                }
            }
        }
    }
    (count, bytes)
}

#[tauri::command]
pub fn get_cache_status() -> Result<CacheStatus, String> {
    let (media_dir, lyrics_dir, artwork_dir) = ensure_cache_dirs()?;

    let (m_count, m_bytes) = dir_stats(&media_dir);
    let (l_count, l_bytes) = dir_stats(&lyrics_dir);
    let (a_count, a_bytes) = dir_stats(&artwork_dir);

    Ok(CacheStatus {
        cache_dir: get_cache_root().to_string_lossy().to_string(),
        total_files: m_count + l_count + a_count,
        total_bytes: m_bytes + l_bytes + a_bytes,
        lyrics_count: l_count,
        media_count: m_count,
        artwork_count: a_count,
    })
}

#[tauri::command]
pub fn clear_cache() -> Result<String, String> {
    let root = get_cache_root();
    if root.exists() {
        fs::remove_dir_all(&root).map_err(|e| e.to_string())?;
    }
    ensure_cache_dirs()?;
    Ok("Lulu media & lyrics cache cleared successfully.".to_string())
}

pub fn sanitize_cache_key(s: &str) -> String {
    s.chars()
        .map(|c| if c.is_alphanumeric() || c == '-' || c == '_' { c } else { '_' })
        .collect::<String>()
        .to_lowercase()
}

pub fn get_cached_lyric(provider: &str, artist: &str, title: &str) -> Option<String> {
    let (_, lyrics_dir, _) = ensure_cache_dirs().ok()?;
    let filename = format!("{}_{}_{}.lrc", sanitize_cache_key(provider), sanitize_cache_key(artist), sanitize_cache_key(title));
    let path = lyrics_dir.join(filename);
    if path.exists() {
        fs::read_to_string(path).ok()
    } else {
        None
    }
}

pub fn save_cached_lyric(provider: &str, artist: &str, title: &str, content: &str) -> Option<PathBuf> {
    let (_, lyrics_dir, _) = ensure_cache_dirs().ok()?;
    let filename = format!("{}_{}_{}.lrc", sanitize_cache_key(provider), sanitize_cache_key(artist), sanitize_cache_key(title));
    let path = lyrics_dir.join(filename);
    if fs::write(&path, content).is_ok() {
        Some(path)
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_cache_key() {
        assert_eq!(sanitize_cache_key("Artist / Name!"), "artist___name_");
        assert_eq!(sanitize_cache_key("Sweet (Remastered)"), "sweet__remastered_");
    }

    #[test]
    fn test_cache_dirs_created() {
        let (media, lyrics, artwork) = ensure_cache_dirs().expect("dirs should create");
        assert!(media.exists());
        assert!(lyrics.exists());
        assert!(artwork.exists());
    }
}
