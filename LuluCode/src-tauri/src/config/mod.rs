use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    pub mode: String, // "auto" | "power_saver" | "very_low" | "low" | "balanced" | "high" | "custom"
    pub fps: u32,
    pub animations: bool,
    pub blur: bool,
    pub shadow: bool,
    pub particles: bool,
    pub file_watchers: bool,
    pub git_auto_refresh: bool,
    pub system_monitor_interval_ms: u64,
    pub terminal_flush_interval_ms: u64,
    pub max_terminal_lines: usize,
}

impl Default for PerformanceConfig {
    fn default() -> Self {
        Self {
            mode: "auto".to_string(),
            fps: 30,
            animations: true,
            blur: false,
            shadow: false,
            particles: false,
            file_watchers: true,
            git_auto_refresh: false,
            system_monitor_interval_ms: 5000,
            terminal_flush_interval_ms: 50,
            max_terminal_lines: 5000,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditorConfig {
    pub minimap: bool,
    pub animations: bool,
    pub code_lens: bool,
    pub font_size: u32,
    pub line_height: u32,
}

impl Default for EditorConfig {
    fn default() -> Self {
        Self {
            minimap: false,
            animations: false,
            code_lens: false,
            font_size: 13,
            line_height: 20,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatConfig {
    pub stream_batch_ms: u64,
    pub max_messages: usize,
}

impl Default for ChatConfig {
    fn default() -> Self {
        Self {
            stream_batch_ms: 50,
            max_messages: 500,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfig {
    pub provider: String,
    pub model: String,
    pub endpoint: String,
}

impl Default for AiConfig {
    fn default() -> Self {
        Self {
            provider: "GOOGLE_GEMINI".to_string(),
            model: "gemini-2.0-flash".to_string(),
            endpoint: "https://generativelanguage.googleapis.com".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemConfigSection {
    pub auto_detect: bool,
}

impl Default for SystemConfigSection {
    fn default() -> Self {
        Self { auto_detect: true }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatteryConfig {
    pub auto_power_save: bool,
}

impl Default for BatteryConfig {
    fn default() -> Self {
        Self { auto_power_save: true }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LuluAppConfig {
    pub performance: PerformanceConfig,
    pub editor: EditorConfig,
    pub chat: ChatConfig,
    pub ai: AiConfig,
    pub system: SystemConfigSection,
    pub battery: BatteryConfig,
}

pub struct ConfigManager;

impl ConfigManager {
    pub fn config_path() -> PathBuf {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".into());
        PathBuf::from(home).join(".config/lulu-code/config.toml")
    }

    pub fn load_or_default() -> LuluAppConfig {
        let path = Self::config_path();
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(parsed) = toml::from_str::<LuluAppConfig>(&content) {
                    return parsed;
                }
            }
        }
        let def = LuluAppConfig::default();
        let _ = Self::save(&def);
        def
    }

    pub fn save(cfg: &LuluAppConfig) -> Result<(), String> {
        let path = Self::config_path();
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let serialized = toml::to_string_pretty(cfg).map_err(|e| e.to_string())?;
        fs::write(&path, serialized).map_err(|e| e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config_serialization() {
        let cfg = LuluAppConfig::default();
        let s = toml::to_string_pretty(&cfg).expect("toml serialization failed");
        assert!(s.contains("[performance]"));
        assert!(s.contains("max_terminal_lines = 5000"));
    }
}
