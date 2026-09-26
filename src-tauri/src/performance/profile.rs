use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PerformanceMode {
    Auto,
    PowerSaver,
    Low,
    Balanced,
    High,
    Custom,
}

impl Default for PerformanceMode {
    fn default() -> Self {
        Self::Auto
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PerformanceTier {
    VeryLow,
    Low,
    Medium,
    High,
    Unknown,
}

impl Default for PerformanceTier {
    fn default() -> Self {
        Self::Unknown
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AnimationQuality {
    None,
    Minimal,
    Simple,
    Normal,
    Full,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PerformanceSection {
    pub mode: String,
    pub fps: u32,
    pub animations: bool,
    pub shadows: bool,
    pub blur: bool,
    pub glow: bool,
    pub particles: bool,
    pub background_effects: bool,
    pub power_saving: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PetSection {
    pub walking: bool,
    pub walking_speed: f32,
    pub idle_animation: bool,
    pub music_animation: bool,
    pub movement_tick_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NotificationsSection {
    pub enabled: bool,
    pub animation: String, // "none", "simple", "full"
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SystemSection {
    pub monitoring: bool,
    pub monitoring_interval: u64, // ms
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MusicSection {
    pub mpris: bool,
    pub position_poll_interval: u64, // ms
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DeveloperSection {
    pub debug_logging: bool,
    pub performance_overlay: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PerformanceConfig {
    pub performance: PerformanceSection,
    pub pet: PetSection,
    pub notifications: NotificationsSection,
    pub system: SystemSection,
    pub music: MusicSection,
    pub developer: DeveloperSection,
}

impl Default for PerformanceConfig {
    fn default() -> Self {
        Self::balanced()
    }
}

impl PerformanceConfig {
    pub fn power_saver() -> Self {
        Self {
            performance: PerformanceSection {
                mode: "power_saver".to_string(),
                fps: 18,
                animations: true,
                shadows: false,
                blur: false,
                glow: false,
                particles: false,
                background_effects: false,
                power_saving: true,
            },
            pet: PetSection {
                walking: true,
                walking_speed: 0.8,
                idle_animation: true,
                music_animation: false,
                movement_tick_ms: 150,
            },
            notifications: NotificationsSection {
                enabled: true,
                animation: "simple".to_string(),
            },
            system: SystemSection {
                monitoring: true,
                monitoring_interval: 10000,
            },
            music: MusicSection {
                mpris: true,
                position_poll_interval: 800,
            },
            developer: DeveloperSection {
                debug_logging: false,
                performance_overlay: false,
            },
        }
    }

    pub fn low() -> Self {
        Self {
            performance: PerformanceSection {
                mode: "low".to_string(),
                fps: 24,
                animations: true,
                shadows: false,
                blur: false,
                glow: false,
                particles: false,
                background_effects: false,
                power_saving: true,
            },
            pet: PetSection {
                walking: true,
                walking_speed: 1.0,
                idle_animation: true,
                music_animation: true,
                movement_tick_ms: 120,
            },
            notifications: NotificationsSection {
                enabled: true,
                animation: "simple".to_string(),
            },
            system: SystemSection {
                monitoring: true,
                monitoring_interval: 6000,
            },
            music: MusicSection {
                mpris: true,
                position_poll_interval: 500,
            },
            developer: DeveloperSection {
                debug_logging: false,
                performance_overlay: false,
            },
        }
    }

    pub fn balanced() -> Self {
        Self {
            performance: PerformanceSection {
                mode: "balanced".to_string(),
                fps: 30,
                animations: true,
                shadows: false,
                blur: false,
                glow: true,
                particles: true,
                background_effects: true,
                power_saving: true,
            },
            pet: PetSection {
                walking: true,
                walking_speed: 1.0,
                idle_animation: true,
                music_animation: true,
                movement_tick_ms: 60,
            },
            notifications: NotificationsSection {
                enabled: true,
                animation: "normal".to_string(),
            },
            system: SystemSection {
                monitoring: true,
                monitoring_interval: 3000,
            },
            music: MusicSection {
                mpris: true,
                position_poll_interval: 350,
            },
            developer: DeveloperSection {
                debug_logging: false,
                performance_overlay: false,
            },
        }
    }

    pub fn high() -> Self {
        Self {
            performance: PerformanceSection {
                mode: "high".to_string(),
                fps: 60,
                animations: true,
                shadows: true,
                blur: true,
                glow: true,
                particles: true,
                background_effects: true,
                power_saving: false,
            },
            pet: PetSection {
                walking: true,
                walking_speed: 1.2,
                idle_animation: true,
                music_animation: true,
                movement_tick_ms: 25,
            },
            notifications: NotificationsSection {
                enabled: true,
                animation: "full".to_string(),
            },
            system: SystemSection {
                monitoring: true,
                monitoring_interval: 1500,
            },
            music: MusicSection {
                mpris: true,
                position_poll_interval: 200,
            },
            developer: DeveloperSection {
                debug_logging: false,
                performance_overlay: false,
            },
        }
    }

    pub fn for_tier(tier: PerformanceTier) -> Self {
        match tier {
            PerformanceTier::VeryLow => Self::power_saver(),
            PerformanceTier::Low => Self::low(),
            PerformanceTier::Medium => Self::balanced(),
            PerformanceTier::High => Self::high(),
            PerformanceTier::Unknown => Self::balanced(),
        }
    }

    pub fn from_mode_str(mode: &str, detected_tier: PerformanceTier) -> Self {
        match mode.to_lowercase().as_str() {
            "power_saver" | "powersaver" => Self::power_saver(),
            "low" => Self::low(),
            "balanced" => Self::balanced(),
            "high" => Self::high(),
            _ => {
                let mut cfg = Self::for_tier(detected_tier);
                cfg.performance.mode = "auto".to_string();
                cfg
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_profile_fps_and_features() {
        let ps = PerformanceConfig::power_saver();
        assert_eq!(ps.performance.fps, 18);
        assert!(!ps.performance.shadows);
        assert!(!ps.performance.blur);
        assert!(!ps.performance.glow);
        assert!(!ps.performance.particles);
        assert_eq!(ps.pet.movement_tick_ms, 150);

        let low = PerformanceConfig::low();
        assert_eq!(low.performance.fps, 24);
        assert!(!low.performance.shadows);
        assert!(!low.performance.blur);
        assert_eq!(low.pet.movement_tick_ms, 120);

        let bal = PerformanceConfig::balanced();
        assert_eq!(bal.performance.fps, 30);
        assert!(bal.performance.glow);
        assert_eq!(bal.pet.movement_tick_ms, 60);

        let high = PerformanceConfig::high();
        assert_eq!(high.performance.fps, 60);
        assert!(high.performance.shadows);
        assert!(high.performance.blur);
        assert_eq!(high.pet.movement_tick_ms, 25);
    }

    #[test]
    fn test_tier_mapping() {
        assert_eq!(PerformanceConfig::for_tier(PerformanceTier::VeryLow).performance.fps, 18);
        assert_eq!(PerformanceConfig::for_tier(PerformanceTier::Low).performance.fps, 24);
        assert_eq!(PerformanceConfig::for_tier(PerformanceTier::Medium).performance.fps, 30);
        assert_eq!(PerformanceConfig::for_tier(PerformanceTier::High).performance.fps, 60);
    }

    #[test]
    fn test_from_mode_str() {
        let ps = PerformanceConfig::from_mode_str("power_saver", PerformanceTier::Medium);
        assert_eq!(ps.performance.fps, 18);

        let low = PerformanceConfig::from_mode_str("LOW", PerformanceTier::Medium);
        assert_eq!(low.performance.fps, 24);

        let auto = PerformanceConfig::from_mode_str("auto", PerformanceTier::Low);
        assert_eq!(auto.performance.mode, "auto");
        assert_eq!(auto.performance.fps, 24);
    }
}

