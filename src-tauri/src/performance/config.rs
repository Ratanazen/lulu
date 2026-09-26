use std::path::PathBuf;
use std::fs;
use tracing::{warn, info};

use super::profile::{PerformanceConfig, PerformanceTier};

pub struct ConfigManager;

impl ConfigManager {
    pub fn get_config_dir() -> PathBuf {
        if let Some(home) = std::env::var_os("HOME") {
            PathBuf::from(home).join(".config").join("lulu")
        } else {
            PathBuf::from(".config").join("lulu")
        }
    }

    pub fn get_config_path() -> PathBuf {
        Self::get_config_dir().join("config.toml")
    }

    pub fn load_or_create(detected_tier: PerformanceTier) -> PerformanceConfig {
        let path = Self::get_config_path();

        if !path.exists() {
            let default_cfg = PerformanceConfig::for_tier(detected_tier);
            if let Err(e) = Self::save(&default_cfg) {
                warn!("[ConfigManager] Failed to create initial config.toml: {}", e);
            }
            return default_cfg;
        }

        match fs::read_to_string(&path) {
            Ok(content) => match toml::from_str::<PerformanceConfig>(&content) {
                Ok(cfg) => cfg,
                Err(e) => {
                    warn!(
                        "[ConfigManager] config.toml is corrupted ({}), backing up to config.toml.bak and restoring defaults",
                        e
                    );
                    let backup_path = Self::get_config_dir().join("config.toml.bak");
                    let _ = fs::copy(&path, backup_path);

                    let fallback_cfg = PerformanceConfig::for_tier(detected_tier);
                    let _ = Self::save(&fallback_cfg);
                    fallback_cfg
                }
            },
            Err(e) => {
                warn!("[ConfigManager] Could not read config.toml ({}), using default", e);
                PerformanceConfig::for_tier(detected_tier)
            }
        }
    }

    pub fn save(config: &PerformanceConfig) -> Result<(), String> {
        let dir = Self::get_config_dir();
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create config dir: {}", e))?;

        let toml_str = toml::to_string_pretty(config)
            .map_err(|e| format!("Failed to serialize TOML config: {}", e))?;

        let path = Self::get_config_path();
        let tmp_path = dir.join("config.toml.tmp");

        fs::write(&tmp_path, toml_str)
            .map_err(|e| format!("Failed to write tmp config: {}", e))?;
        fs::rename(tmp_path, path)
            .map_err(|e| format!("Failed to replace config.toml: {}", e))?;

        info!("[ConfigManager] Saved config to ~/.config/lulu/config.toml");
        Ok(())
    }

    pub fn reset_to_defaults(detected_tier: PerformanceTier) -> Result<PerformanceConfig, String> {
        let default_cfg = PerformanceConfig::for_tier(detected_tier);
        Self::save(&default_cfg)?;
        Ok(default_cfg)
    }
}
