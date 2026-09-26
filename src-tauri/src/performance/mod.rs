pub mod profile;
pub mod detector;
pub mod config;
pub mod power;
pub mod adaptive;
pub mod monitor;

use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

pub use profile::{PerformanceConfig, PerformanceMode, PerformanceTier};
pub use detector::{HardwareDetector, HardwareInfo};
pub use config::ConfigManager;
pub use power::{PowerDetector, PowerState};
pub use adaptive::AdaptiveGovernor;
pub use monitor::{PerformanceMonitor, RuntimePerformance};

pub struct PerformanceService {
    hardware_info: Mutex<HardwareInfo>,
    config: Mutex<PerformanceConfig>,
    adaptive: Mutex<AdaptiveGovernor>,
}

impl Default for PerformanceService {
    fn default() -> Self {
        let hardware = HardwareDetector::detect();
        let config = ConfigManager::load_or_create(hardware.overall_tier);

        Self {
            hardware_info: Mutex::new(hardware),
            config: Mutex::new(config),
            adaptive: Mutex::new(AdaptiveGovernor::default()),
        }
    }
}

impl PerformanceService {
    pub fn get_hardware_info(&self) -> HardwareInfo {
        if let Ok(info) = self.hardware_info.lock() {
            info.clone()
        } else {
            HardwareDetector::detect()
        }
    }

    pub fn get_performance_config(&self) -> PerformanceConfig {
        if let Ok(cfg) = self.config.lock() {
            cfg.clone()
        } else {
            PerformanceConfig::balanced()
        }
    }

    pub fn set_performance_config(&self, new_config: PerformanceConfig, app: Option<&AppHandle>) -> Result<(), String> {
        ConfigManager::save(&new_config)?;

        if let Ok(mut cfg) = self.config.lock() {
            *cfg = new_config.clone();
        }

        if let Some(app_handle) = app {
            let _ = app_handle.emit("performance:profile_changed", &new_config);
        }

        Ok(())
    }

    pub fn get_performance_profile(&self, mode: &str) -> PerformanceConfig {
        let tier = if let Ok(info) = self.hardware_info.lock() {
            info.overall_tier
        } else {
            PerformanceTier::Medium
        };
        PerformanceConfig::from_mode_str(mode, tier)
    }

    pub fn apply_performance_profile(&self, mode: &str, app: Option<&AppHandle>) -> Result<PerformanceConfig, String> {
        let preset = self.get_performance_profile(mode);
        self.set_performance_config(preset.clone(), app)?;

        if let Some(app_handle) = app {
            let _ = app_handle.emit("performance:mode_changed", mode);
        }

        Ok(preset)
    }

    pub fn reset_performance_config(&self, app: Option<&AppHandle>) -> Result<PerformanceConfig, String> {
        let tier = if let Ok(info) = self.hardware_info.lock() {
            info.overall_tier
        } else {
            PerformanceTier::Medium
        };

        let default_cfg = ConfigManager::reset_to_defaults(tier)?;
        if let Ok(mut cfg) = self.config.lock() {
            *cfg = default_cfg.clone();
        }

        if let Some(app_handle) = app {
            let _ = app_handle.emit("performance:profile_changed", &default_cfg);
            let _ = app_handle.emit("performance:mode_changed", &default_cfg.performance.mode);
        }

        Ok(default_cfg)
    }

    pub fn get_power_state(&self) -> PowerState {
        let power_saving_enabled = if let Ok(cfg) = self.config.lock() {
            cfg.performance.power_saving
        } else {
            true
        };
        PowerDetector::get_power_state(power_saving_enabled)
    }

    pub fn get_runtime_performance(&self) -> RuntimePerformance {
        let cfg = self.get_performance_config();
        let hw = self.get_hardware_info();
        let power = self.get_power_state();
        let mem_mb = PerformanceMonitor::get_process_memory_mb();
        let db_writes = PerformanceMonitor::get_db_writes();

        let is_adaptive_downgraded = if let Ok(ad) = self.adaptive.lock() {
            ad.get_state() != adaptive::AdaptiveState::Normal
        } else {
            false
        };

        let tier_str = format!("{:?}", hw.overall_tier);

        RuntimePerformance {
            current_fps: cfg.performance.fps,
            target_fps: cfg.performance.fps,
            cpu_usage: 0.0, // Updated by frontend from system metrics or monitor
            memory_rss_mb: mem_mb,
            mode: cfg.performance.mode.to_uppercase(),
            tier: tier_str,
            animation_quality: if cfg.performance.fps <= 18 {
                "MINIMAL".to_string()
            } else if cfg.performance.fps <= 24 {
                "SIMPLE".to_string()
            } else if cfg.performance.fps <= 45 {
                "NORMAL".to_string()
            } else {
                "FULL".to_string()
            },
            renderer_state: "ACTIVE".to_string(),
            dbus_state: "CONNECTED".to_string(),
            mpris_state: if cfg.music.mpris { "CONNECTED".to_string() } else { "DISABLED".to_string() },
            lyrics_state: "ACTIVE".to_string(),
            database_writes_count: db_writes,
            is_power_saving: power.is_power_saving_active,
            is_adaptive_downgraded,
        }
    }
}
