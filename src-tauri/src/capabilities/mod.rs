use std::collections::HashMap;
use std::net::{SocketAddr, TcpStream};
use std::time::Duration;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

/// Raw static capability entry parsed from docs/capabilities.json
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StaticCapabilityEntry {
    pub id: String,
    pub name: String,
    pub category: String,
    pub platforms: serde_json::Value,
    pub requires: Vec<String>,
    pub optional: bool,
    pub status: String,
    pub fallback: String,
    pub privacy: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StaticCatalog {
    pub schema_version: u32,
    pub application: String,
    pub platforms: serde_json::Value,
    pub capabilities: Vec<StaticCapabilityEntry>,
}

/// Final resolved runtime capability evaluated against live host OS state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCapability {
    pub id: String,
    pub name: String,
    pub category: String,
    pub status: String,
    pub platform: String,
    pub window_system: String,
    pub dependencies: HashMap<String, bool>,
    pub permission: String,
    pub fallback: Option<String>,
    pub privacy: String,
    pub reason: Option<String>,
}

/// Comprehensive, sanitized diagnostics report (zero secrets or private data)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityDiagnosticsReport {
    pub application: String,
    pub version: String,
    pub os: String,
    pub architecture: String,
    pub window_system: String,
    pub desktop_environment: String,
    pub window_manager: String,
    pub dbus_available: bool,
    pub mpris_available: bool,
    pub notification_service_available: bool,
    pub ollama_available: bool,
    pub tts_available: bool,
    pub stt_available: bool,
    pub monitor_count: usize,
    pub capabilities: Vec<RuntimeCapability>,
    pub timestamp: String,
}

pub struct CapabilityManager;

impl CapabilityManager {
    /// Load compile-time embedded static catalog from docs/capabilities.json
    pub fn get_static_catalog() -> StaticCatalog {
        let json_str = include_str!("../../../docs/capabilities.json");
        serde_json::from_str(json_str).expect("Valid embedded capabilities.json catalog")
    }

    /// Authoritative runtime detection of system environment and dependencies
    pub fn detect_capabilities(app: &AppHandle) -> Vec<RuntimeCapability> {
        let catalog = Self::get_static_catalog();
        let os = std::env::consts::OS.to_string();

        let session_type = std::env::var("XDG_SESSION_TYPE")
            .unwrap_or_else(|_| {
                if std::env::var_os("WAYLAND_DISPLAY").is_some() {
                    "wayland".to_string()
                } else if std::env::var_os("DISPLAY").is_some() {
                    "x11".to_string()
                } else {
                    "unknown".to_string()
                }
            });

        let de = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_else(|_| "unknown".to_string());
        let is_sway = std::env::var_os("SWAYSOCK").is_some() || de.to_lowercase().contains("sway");
        let is_hyprland = std::env::var_os("HYPRLAND_INSTANCE_SIGNATURE").is_some() || de.to_lowercase().contains("hyprland");

        // Runtime dependency checks
        let dbus_available = std::env::var_os("DBUS_SESSION_BUS_ADDRESS").is_some();

        // MPRIS check: dbus available and playerctl tool accessible
        let mpris_available = dbus_available && std::process::Command::new("playerctl")
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);

        // Notification daemon check: dbus available or notify-send installed
        let notify_available = dbus_available || std::process::Command::new("notify-send")
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);

        // Ollama check: probe localhost:11434 with quick 250ms timeout
        let ollama_available = {
            let addr: Result<SocketAddr, _> = "127.0.0.1:11434".parse();
            match addr {
                Ok(sa) => TcpStream::connect_timeout(&sa, Duration::from_millis(250)).is_ok(),
                Err(_) => false,
            }
        };

        let monitor_count = app.available_monitors().map(|m| m.len()).unwrap_or(1);

        let mut resolved = Vec::new();

        for cap in catalog.capabilities {
            let mut dependencies = HashMap::new();
            let mut status = cap.status.clone();
            let mut reason = None;
            let mut permission = "not_required".to_string();

            // Evaluate dependency states
            for req in &cap.requires {
                match req.as_str() {
                    "dbus" => {
                        dependencies.insert("dbus".to_string(), dbus_available);
                    }
                    "mpris" => {
                        dependencies.insert("mpris".to_string(), mpris_available);
                    }
                    "ollama" => {
                        dependencies.insert("ollama".to_string(), ollama_available);
                    }
                    "microphone_permission" => {
                        permission = "requires_permission".to_string();
                    }
                    "screen_capture_permission" => {
                        permission = "requires_permission".to_string();
                    }
                    "clipboard_read_permission" => {
                        permission = "requires_permission".to_string();
                    }
                    "explicit_user_confirmation" => {
                        permission = "requires_permission".to_string();
                    }
                    "explicit_user_opt_in" => {
                        permission = "requires_permission".to_string();
                    }
                    _ => {}
                }
            }

            // AUTHORITATIVE RESOLUTION RULES:
            // 1. Operating system platform compatibility
            if os != "linux" && (cap.id.starts_with("notifications.dbus") || cap.id == "music.mpris") {
                status = "unsupported".to_string();
                reason = Some(format!("Requires Linux (current OS is {})", os));
            } else if cap.id == "notifications.dbus" {
                if !dbus_available {
                    status = "unsupported".to_string();
                    reason = Some("D-Bus session bus unavailable".to_string());
                } else if !notify_available {
                    status = "partial".to_string();
                    reason = Some("No desktop notification daemon detected".to_string());
                } else {
                    status = "supported".to_string();
                }
            } else if cap.id == "music.mpris" {
                if !dbus_available {
                    status = "unsupported".to_string();
                    reason = Some("D-Bus session bus unavailable".to_string());
                } else if !mpris_available {
                    status = "requires_dependency".to_string();
                    reason = Some("playerctl or MPRIS interface not detected".to_string());
                } else {
                    status = "supported".to_string();
                }
            } else if cap.id == "ai.ollama" {
                if ollama_available {
                    status = "supported".to_string();
                } else {
                    status = "requires_dependency".to_string();
                    reason = Some("Ollama service not running on localhost:11434".to_string());
                }
            } else if cap.id == "pet.always_on_top" {
                if session_type == "wayland" {
                    // On Wayland, always on top depends on compositor (Sway / Hyprland vs GNOME)
                    status = "partial".to_string();
                    reason = Some(format!("Wayland compositor ({}) partial layer-shell support", if is_sway { "Sway" } else if is_hyprland { "Hyprland" } else { &de }));
                } else {
                    status = "supported".to_string();
                }
            } else if cap.id == "pet.multi_monitor" {
                status = "supported".to_string();
                if monitor_count <= 1 {
                    reason = Some("Single display active".to_string());
                }
            } else if cap.requires.iter().any(|r| r.contains("permission") || r.contains("opt_in") || r.contains("confirmation")) {
                status = "requires_permission".to_string();
                reason = Some("Requires explicit user permission or opt-in".to_string());
            }

            resolved.push(RuntimeCapability {
                id: cap.id,
                name: cap.name,
                category: cap.category,
                status,
                platform: os.clone(),
                window_system: session_type.clone(),
                dependencies,
                permission,
                fallback: Some(cap.fallback),
                privacy: cap.privacy,
                reason,
            });
        }

        resolved
    }

    pub fn get_capability(id: &str, app: &AppHandle) -> Option<RuntimeCapability> {
        let all = Self::detect_capabilities(app);
        all.into_iter().find(|c| c.id == id)
    }

    pub fn is_supported(id: &str, app: &AppHandle) -> bool {
        if let Some(c) = Self::get_capability(id, app) {
            c.status == "supported"
        } else {
            false
        }
    }

    pub fn requires_permission(id: &str, app: &AppHandle) -> bool {
        if let Some(c) = Self::get_capability(id, app) {
            c.status == "requires_permission" || c.permission == "requires_permission"
        } else {
            false
        }
    }

    pub fn requires_dependency(id: &str, app: &AppHandle) -> bool {
        if let Some(c) = Self::get_capability(id, app) {
            c.status == "requires_dependency"
        } else {
            false
        }
    }

    pub fn get_fallback(id: &str) -> Option<String> {
        let catalog = Self::get_static_catalog();
        catalog.capabilities.into_iter().find(|c| c.id == id).map(|c| c.fallback)
    }

    pub fn get_diagnostics(app: &AppHandle) -> CapabilityDiagnosticsReport {
        let capabilities = Self::detect_capabilities(app);
        let os = std::env::consts::OS.to_string();
        let arch = std::env::consts::ARCH.to_string();

        let session_type = std::env::var("XDG_SESSION_TYPE")
            .unwrap_or_else(|_| {
                if std::env::var_os("WAYLAND_DISPLAY").is_some() {
                    "wayland".to_string()
                } else if std::env::var_os("DISPLAY").is_some() {
                    "x11".to_string()
                } else {
                    "unknown".to_string()
                }
            });

        let de = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_else(|_| "unknown".to_string());
        let is_sway = std::env::var_os("SWAYSOCK").is_some() || de.to_lowercase().contains("sway");
        let is_hyprland = std::env::var_os("HYPRLAND_INSTANCE_SIGNATURE").is_some() || de.to_lowercase().contains("hyprland");

        let wm = if is_sway {
            "Sway".to_string()
        } else if is_hyprland {
            "Hyprland".to_string()
        } else {
            de.clone()
        };

        let dbus_available = std::env::var_os("DBUS_SESSION_BUS_ADDRESS").is_some();
        let mpris_available = dbus_available && std::process::Command::new("playerctl")
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);

        let notification_service_available = dbus_available || std::process::Command::new("notify-send")
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);

        let ollama_available = {
            let addr: Result<SocketAddr, _> = "127.0.0.1:11434".parse();
            match addr {
                Ok(sa) => TcpStream::connect_timeout(&sa, Duration::from_millis(250)).is_ok(),
                Err(_) => false,
            }
        };

        let monitor_count = app.available_monitors().map(|m| m.len()).unwrap_or(1);

        CapabilityDiagnosticsReport {
            application: "Lulu".to_string(),
            version: "0.1.0".to_string(),
            os,
            architecture: arch,
            window_system: session_type,
            desktop_environment: de,
            window_manager: wm,
            dbus_available,
            mpris_available,
            notification_service_available,
            ollama_available,
            tts_available: true,
            stt_available: true,
            monitor_count,
            capabilities,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_embedded_catalog_loads_valid_schema() {
        let catalog = CapabilityManager::get_static_catalog();
        assert_eq!(catalog.schema_version, 1);
        assert_eq!(catalog.application, "Lulu");
        assert!(!catalog.capabilities.is_empty());
        assert!(catalog.capabilities.iter().any(|c| c.id == "music.mpris"));
        assert!(catalog.capabilities.iter().any(|c| c.id == "notifications.dbus"));
    }

    #[test]
    fn test_fallback_lookup() {
        let fb = CapabilityManager::get_fallback("music.mpris");
        assert_eq!(fb, Some("music_metadata_unavailable".to_string()));

        let fb_nonexistent = CapabilityManager::get_fallback("invalid.nonexistent");
        assert_eq!(fb_nonexistent, None);
    }
}
