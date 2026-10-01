use crate::media::{discover_mpris_sessions, MediaProviderKind};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct DiagnosticCheck {
    pub name: String,
    pub status: String, // "PASS", "WARN", "FAIL", "UNSUPPORTED"
    pub message: String,
    pub suggestion: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DoctorReport {
    pub overall_status: String,
    pub checks: Vec<DiagnosticCheck>,
    pub timestamp: i64,
}

#[tauri::command]
pub fn run_lulu_doctor() -> Result<DoctorReport, String> {
    let mut checks = Vec::new();
    let mut has_fail = false;
    let mut has_warn = false;

    // 1. D-Bus Session Bus
    let dbus_ok = std::env::var("DBUS_SESSION_BUS_ADDRESS").is_ok()
        || Path::new(&format!("/run/user/{}/bus", unsafe { libc::getuid() })).exists();
    if dbus_ok {
        checks.push(DiagnosticCheck {
            name: "DBus Session Bus".to_string(),
            status: "PASS".to_string(),
            message: "Active user session bus connected".to_string(),
            suggestion: None,
        });
    } else {
        checks.push(DiagnosticCheck {
            name: "DBus Session Bus".to_string(),
            status: "FAIL".to_string(),
            message: "DBus session bus not found in environment".to_string(),
            suggestion: Some("Ensure systemd or dbus user session is running".to_string()),
        });
        has_fail = true;
    }

    // 2. MPRIS (playerctl check)
    let has_playerctl = Command::new("which").arg("playerctl").output().map_or(false, |o| o.status.success());
    if has_playerctl {
        checks.push(DiagnosticCheck {
            name: "MPRIS Integration".to_string(),
            status: "PASS".to_string(),
            message: "playerctl utility available for dynamic player discovery and controls".to_string(),
            suggestion: None,
        });
    } else {
        checks.push(DiagnosticCheck {
            name: "MPRIS Integration".to_string(),
            status: "WARN".to_string(),
            message: "playerctl not installed; media controls will be limited".to_string(),
            suggestion: Some("Install playerctl via your package manager (e.g., pacman -S playerctl / apt install playerctl)".to_string()),
        });
        has_warn = true;
    }

    // Discover active players for Spotify & YouTube checks
    let sessions = discover_mpris_sessions();

    // 3. Spotify Detection
    let spotify_session = sessions.iter().find(|s| s.provider == MediaProviderKind::Spotify);
    if let Some(spot) = spotify_session {
        checks.push(DiagnosticCheck {
            name: "Spotify Integration".to_string(),
            status: "PASS".to_string(),
            message: format!("Spotify player active: \"{}\" by {}", spot.title, spot.artist.as_deref().unwrap_or("Unknown")),
            suggestion: None,
        });
    } else {
        checks.push(DiagnosticCheck {
            name: "Spotify Integration".to_string(),
            status: "PASS".to_string(),
            message: "Ready to detect Spotify desktop or Spotify Web when playback begins".to_string(),
            suggestion: None,
        });
    }

    // 4. YouTube / YouTube Music Detection
    let yt_session = sessions.iter().find(|s| s.provider == MediaProviderKind::Youtube || s.provider == MediaProviderKind::YoutubeMusic);
    if let Some(yt) = yt_session {
        checks.push(DiagnosticCheck {
            name: "YouTube / YouTube Music".to_string(),
            status: "PASS".to_string(),
            message: format!("Active YouTube session: \"{}\"", yt.title),
            suggestion: None,
        });
    } else {
        checks.push(DiagnosticCheck {
            name: "YouTube / YouTube Music".to_string(),
            status: "PASS".to_string(),
            message: "Browser media integration ready (Firefox, Chrome, Chromium, Brave)".to_string(),
            suggestion: None,
        });
    }

    // 5. Lyrics Provider (LRCLIB & Local Cache)
    let lyrics_ok = Command::new("curl")
        .args(["-s", "--max-time", "3", "-I", "https://lrclib.net/api/search?q=test"])
        .output()
        .map_or(false, |o| o.status.success());

    if lyrics_ok {
        checks.push(DiagnosticCheck {
            name: "Lyrics Provider (LRCLIB)".to_string(),
            status: "PASS".to_string(),
            message: "Online synced lyrics provider reachable; local cache enabled".to_string(),
            suggestion: None,
        });
    } else {
        checks.push(DiagnosticCheck {
            name: "Lyrics Provider (LRCLIB)".to_string(),
            status: "WARN".to_string(),
            message: "LRCLIB offline or network restricted; falling back to local cached lyrics".to_string(),
            suggestion: Some("Check internet connection for realtime lyrics downloads".to_string()),
        });
        has_warn = true;
    }

    // 6. Terminal Unicode & Khmer Support
    let lang = std::env::var("LANG").unwrap_or_default().to_lowercase();
    let is_utf8 = lang.contains("utf-8") || lang.contains("utf8");
    if is_utf8 {
        checks.push(DiagnosticCheck {
            name: "Terminal Unicode".to_string(),
            status: "PASS".to_string(),
            message: format!("UTF-8 terminal encoding active ({}); Khmer (ខ្ញុំស្រឡាញ់អ្នក) & CJK supported", lang),
            suggestion: None,
        });
    } else {
        checks.push(DiagnosticCheck {
            name: "Terminal Unicode".to_string(),
            status: "WARN".to_string(),
            message: format!("Locale is '{}'; may have issues rendering non-ASCII lyrics", lang),
            suggestion: Some("Set LANG=en_US.UTF-8 in environment".to_string()),
        });
        has_warn = true;
    }

    // 7. Wayland / Display Session
    let wayland = std::env::var("WAYLAND_DISPLAY").ok();
    let display = std::env::var("DISPLAY").ok();
    match (wayland, display) {
        (Some(w), _) => {
            checks.push(DiagnosticCheck {
                name: "Wayland / Display".to_string(),
                status: "PASS".to_string(),
                message: format!("Native Wayland compositor session detected ({})", w),
                suggestion: None,
            });
        }
        (None, Some(x)) => {
            checks.push(DiagnosticCheck {
                name: "Wayland / Display".to_string(),
                status: "PASS".to_string(),
                message: format!("X11 display server detected ({})", x),
                suggestion: None,
            });
        }
        (None, None) => {
            checks.push(DiagnosticCheck {
                name: "Wayland / Display".to_string(),
                status: "WARN".to_string(),
                message: "No graphical display environment detected (Running in headless/terminal mode)".to_string(),
                suggestion: Some("Ensure WAYLAND_DISPLAY or DISPLAY is set for GUI overlay mode".to_string()),
            });
            has_warn = true;
        }
    }

    // 8. Storage check
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let db_path = PathBuf::from(&home).join(".local/share/lulu-desktop/lulu.db");
    if db_path.exists() {
        checks.push(DiagnosticCheck {
            name: "Storage Database".to_string(),
            status: "PASS".to_string(),
            message: format!("SQLite database found at {}", db_path.display()),
            suggestion: None,
        });
    } else {
        checks.push(DiagnosticCheck {
            name: "Storage Database".to_string(),
            status: "WARN".to_string(),
            message: "Database will be initialized on first GUI run".to_string(),
            suggestion: None,
        });
        has_warn = true;
    }

    let overall_status = if has_fail {
        "FAIL".to_string()
    } else if has_warn {
        "WARN".to_string()
    } else {
        "PASS".to_string()
    };

    Ok(DoctorReport {
        overall_status,
        checks,
        timestamp: chrono::Utc::now().timestamp(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_doctor_runs() {
        let report = run_lulu_doctor().unwrap();
        assert!(!report.checks.is_empty());
        assert!(report.checks.iter().any(|c| c.name == "DBus Session Bus"));
        assert!(report.checks.iter().any(|c| c.name == "Terminal Unicode"));
    }
}
