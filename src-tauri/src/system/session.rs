use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    pub compositor: String, // "Sway" | "Hyprland" | "Niri" | "KDE Plasma" | "GNOME" | "X11 Window Manager" | "Unknown"
    pub session_type: String, // "Wayland" | "X11" | "TTY" | "Unknown"
    pub desktop_environment: String,
    pub is_wayland: bool,
    pub socket_path: Option<String>,
}

impl SessionInfo {
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

        let desktop_env = std::env::var("XDG_CURRENT_DESKTOP")
            .or_else(|_| std::env::var("DESKTOP_SESSION"))
            .unwrap_or_else(|_| "Unknown".to_string());

        let mut compositor = "Unknown".to_string();
        let mut socket_path = None;

        if std::env::var("SWAYSOCK").is_ok() {
            compositor = "Sway".to_string();
            socket_path = std::env::var("SWAYSOCK").ok();
        } else if std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok() {
            compositor = "Hyprland".to_string();
            socket_path = std::env::var("HYPRLAND_INSTANCE_SIGNATURE").ok();
        } else if std::env::var("NIRI_SOCKET").is_ok() {
            compositor = "Niri".to_string();
            socket_path = std::env::var("NIRI_SOCKET").ok();
        } else if desktop_env.to_lowercase().contains("kde") {
            compositor = if is_wayland { "KWin (Wayland)" } else { "KWin (X11)" }.to_string();
        } else if desktop_env.to_lowercase().contains("gnome") {
            compositor = if is_wayland { "Mutter (Wayland)" } else { "Mutter (X11)" }.to_string();
        } else if !is_wayland && std::env::var("DISPLAY").is_ok() {
            compositor = "X11 Window Manager".to_string();
        }

        Self {
            compositor,
            session_type,
            desktop_environment: desktop_env,
            is_wayland,
            socket_path,
        }
    }
}
