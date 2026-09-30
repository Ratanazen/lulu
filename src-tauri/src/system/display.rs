use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorInfo {
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub refresh_rate_hz: u32,
    pub scale_factor: f64,
    pub is_primary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayInfo {
    pub session_type: String, // "Wayland" | "X11" | "Unknown"
    pub monitor_count: usize,
    pub primary_resolution: String,
    pub refresh_rate_hz: u32,
    pub scale_factor: f64,
    pub monitors: Vec<MonitorInfo>,
    pub status: String,
}

impl DisplayInfo {
    pub fn probe() -> Self {
        let is_wayland = std::env::var("WAYLAND_DISPLAY").is_ok()
            || std::env::var("XDG_SESSION_TYPE").map(|s| s.to_lowercase() == "wayland").unwrap_or(false);

        let session_type = if is_wayland {
            "Wayland".to_string()
        } else if std::env::var("DISPLAY").is_ok() {
            "X11".to_string()
        } else {
            "Unknown".to_string()
        };

        // 1. Try Sway output query
        if std::env::var("SWAYSOCK").is_ok() {
            if let Ok(output) = Command::new("swaymsg").args(["-t", "get_outputs", "--raw"]).output() {
                if output.status.success() {
                    if let Ok(json_str) = String::from_utf8(output.stdout) {
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&json_str) {
                            if let Some(arr) = val.as_array() {
                                let mut monitors = Vec::new();
                                for (idx, item) in arr.iter().enumerate() {
                                    let name = item["name"].as_str().unwrap_or("Display").to_string();
                                    let mode = &item["current_mode"];
                                    let width = mode["width"].as_u64().unwrap_or(1920) as u32;
                                    let height = mode["height"].as_u64().unwrap_or(1080) as u32;
                                    let refresh_raw = mode["refresh"].as_u64().unwrap_or(60000);
                                    let refresh_hz = ((refresh_raw as f64) / 1000.0).round() as u32;
                                    let scale = item["scale"].as_f64().unwrap_or(1.0);
                                    let is_primary = item["primary"].as_bool().unwrap_or(idx == 0);

                                    monitors.push(MonitorInfo {
                                        name,
                                        width,
                                        height,
                                        refresh_rate_hz: refresh_hz,
                                        scale_factor: scale,
                                        is_primary,
                                    });
                                }

                                if let Some(first) = monitors.first() {
                                    return Self {
                                        session_type,
                                        monitor_count: monitors.len(),
                                        primary_resolution: format!("{}x{}", first.width, first.height),
                                        refresh_rate_hz: first.refresh_rate_hz,
                                        scale_factor: first.scale_factor,
                                        monitors,
                                        status: "DETECTED".to_string(),
                                    };
                                }
                            }
                        }
                    }
                }
            }
        }

        // Fallback for default display
        let default_monitor = MonitorInfo {
            name: "Default Display".to_string(),
            width: 1920,
            height: 1080,
            refresh_rate_hz: 60,
            scale_factor: 1.0,
            is_primary: true,
        };

        Self {
            session_type,
            monitor_count: 1,
            primary_resolution: "1920x1080".to_string(),
            refresh_rate_hz: 60,
            scale_factor: 1.0,
            monitors: vec![default_monitor],
            status: "FALLBACK".to_string(),
        }
    }
}
