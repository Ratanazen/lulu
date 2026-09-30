use serde::{Deserialize, Serialize};
use std::env;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapabilityItem {
    pub name: String,
    pub status: String, // "SUPPORTED", "PARTIAL", "UNSUPPORTED"
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformCapabilities {
    pub display_server: String,
    pub session_type: String,
    pub desktop_env: String,
    pub items: Vec<CapabilityItem>,
}

#[tauri::command]
pub fn get_capabilities() -> PlatformCapabilities {
    let session_type = env::var("XDG_SESSION_TYPE").unwrap_or_else(|_| "unknown".to_string());
    let desktop_env = env::var("XDG_CURRENT_DESKTOP").unwrap_or_else(|_| "unknown".to_string());
    let display_server = if session_type.to_lowercase().contains("wayland") {
        "Wayland".to_string()
    } else if env::var("DISPLAY").is_ok() {
        "X11".to_string()
    } else {
        "Headless/Unknown".to_string()
    };

    let mut items = Vec::new();

    // 1. D-Bus Session Bus
    let dbus_ok = env::var("DBUS_SESSION_BUS_ADDRESS").is_ok()
        || Path::new(&format!(
            "/run/user/{}/bus",
            nix_uid()
        ))
        .exists();

    items.push(CapabilityItem {
        name: "D-Bus Session Bus".to_string(),
        status: if dbus_ok { "SUPPORTED".to_string() } else { "UNSUPPORTED".to_string() },
        reason: if dbus_ok {
            "Active session bus connected".to_string()
        } else {
            "DBUS_SESSION_BUS_ADDRESS not found in environment".to_string()
        },
    });

    // 2. Linux Notifications (D-Bus listener)
    let has_dbus_monitor = which_exists("dbus-monitor");
    items.push(CapabilityItem {
        name: "Notification Companion (D-Bus)".to_string(),
        status: if has_dbus_monitor && dbus_ok {
            "SUPPORTED".to_string()
        } else {
            "UNSUPPORTED".to_string()
        },
        reason: if has_dbus_monitor && dbus_ok {
            "org.freedesktop.Notifications stream available via dbus-monitor".to_string()
        } else {
            "dbus-monitor binary or session bus missing".to_string()
        },
    });

    // 3. Music MPRIS Integration
    let has_playerctl = which_exists("playerctl");
    items.push(CapabilityItem {
        name: "Music / MPRIS Control".to_string(),
        status: if has_playerctl {
            "SUPPORTED".to_string()
        } else {
            "PARTIAL".to_string()
        },
        reason: if has_playerctl {
            "playerctl utility available for MPRIS queries and playback controls".to_string()
        } else {
            "playerctl not installed; MPRIS fallback to direct D-Bus only".to_string()
        },
    });

    // 4. Local Lyrics Parser
    items.push(CapabilityItem {
        name: "Local LRC Lyrics Engine".to_string(),
        status: "SUPPORTED".to_string(),
        reason: "Offline local .lrc parser supporting UTF-8, Khmer, English, timestamps & offsets".to_string(),
    });

    // 5. Wayland Window Movement
    if session_type.to_lowercase().contains("wayland") {
        items.push(CapabilityItem {
            name: "Desktop Window Repositioning".to_string(),
            status: "PARTIAL".to_string(),
            reason: "Wayland security restrictions limit client-initiated global coordinate positioning; native dragging works via data-tauri-drag-region".to_string(),
        });
    } else {
        items.push(CapabilityItem {
            name: "Desktop Window Repositioning".to_string(),
            status: "SUPPORTED".to_string(),
            reason: "X11 supports absolute window positioning".to_string(),
        });
    }

    // 6. Multi-Monitor Screen Map
    items.push(CapabilityItem {
        name: "Multi-Monitor Detection".to_string(),
        status: "SUPPORTED".to_string(),
        reason: "Tauri native monitor enumeration available".to_string(),
    });

    // 7. System Tray
    items.push(CapabilityItem {
        name: "System Tray Integration".to_string(),
        status: "SUPPORTED".to_string(),
        reason: "Built with Tauri native tray feature".to_string(),
    });

    // 8. Fullscreen Detection
    items.push(CapabilityItem {
        name: "Fullscreen Detection".to_string(),
        status: "UNSUPPORTED".to_string(),
        reason: "Wayland compositors do not expose global fullscreen state to unprivileged clients".to_string(),
    });

    PlatformCapabilities {
        display_server,
        session_type,
        desktop_env,
        items,
    }
}

fn which_exists(binary: &str) -> bool {
    Command::new("which")
        .arg(binary)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn nix_uid() -> u32 {
    unsafe { libc::getuid() }
}
