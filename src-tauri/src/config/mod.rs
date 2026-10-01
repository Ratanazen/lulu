use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaConfig {
    pub enabled: bool,
    pub poll_interval_ms: u64,
}

impl Default for MediaConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            poll_interval_ms: 500,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LyricsConfig {
    pub enabled: bool,
    pub provider: String,
    pub sync: bool,
    pub cache: bool,
}

impl Default for LyricsConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            provider: "lrclib".to_string(),
            sync: true,
            cache: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalConfig {
    pub enabled: bool,
    pub show_artwork: bool,
    pub lines_above: usize,
    pub lines_below: usize,
}

impl Default for TerminalConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            show_artwork: false,
            lines_above: 2,
            lines_below: 2,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverlayConfig {
    pub enabled: bool,
}

impl Default for OverlayConfig {
    fn default() -> Self {
        Self { enabled: true }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LuluSettings {
    pub media: MediaConfig,
    pub lyrics: LyricsConfig,
    pub terminal: TerminalConfig,
    pub overlay: OverlayConfig,
}

pub fn get_config_dir() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    PathBuf::from(home).join(".config/lulu")
}

pub fn get_config_path() -> PathBuf {
    get_config_dir().join("config.toml")
}

pub fn load_settings() -> LuluSettings {
    let path = get_config_path();
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(settings) = toml::from_str::<LuluSettings>(&content) {
                return settings;
            }
        }
    }

    // Generate and persist default configuration if not present
    let default_settings = LuluSettings::default();
    let dir = get_config_dir();
    let _ = fs::create_dir_all(&dir);
    if let Ok(serialized) = toml::to_string_pretty(&default_settings) {
        let _ = fs::write(&path, serialized);
    }
    default_settings
}
