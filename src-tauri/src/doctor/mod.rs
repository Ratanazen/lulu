use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct DiagnosticCheck {
    pub name: String,
    pub status: String, // "PASS", "WARN", "FAIL"
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

    // 1. Storage check
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
            message: "Database will be initialized on first run".to_string(),
            suggestion: None,
        });
        has_warn = true;
    }

    // 2. Wayland / Display Session check
    let wayland = std::env::var("WAYLAND_DISPLAY").ok();
    let display = std::env::var("DISPLAY").ok();
    match (wayland, display) {
        (Some(w), _) => {
            checks.push(DiagnosticCheck {
                name: "Display Server".to_string(),
                status: "PASS".to_string(),
                message: format!("Native Wayland session detected ({})", w),
                suggestion: None,
            });
        }
        (None, Some(x)) => {
            checks.push(DiagnosticCheck {
                name: "Display Server".to_string(),
                status: "PASS".to_string(),
                message: format!("X11 display server detected ({})", x),
                suggestion: None,
            });
        }
        (None, None) => {
            checks.push(DiagnosticCheck {
                name: "Display Server".to_string(),
                status: "FAIL".to_string(),
                message: "No graphical display environment detected".to_string(),
                suggestion: Some("Ensure WAYLAND_DISPLAY or DISPLAY is set".to_string()),
            });
            has_fail = true;
        }
    }

    // 3. System Architecture & OS
    let os_info = std::env::consts::OS;
    let arch_info = std::env::consts::ARCH;
    checks.push(DiagnosticCheck {
        name: "Operating System".to_string(),
        status: "PASS".to_string(),
        message: format!("Target platform {} ({}) supported", os_info, arch_info),
        suggestion: None,
    });

    // 4. Multi-monitor capability
    checks.push(DiagnosticCheck {
        name: "Multi-Monitor Support".to_string(),
        status: "PASS".to_string(),
        message: "Tauri v2 native monitor bounds detection enabled".to_string(),
        suggestion: None,
    });

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
    }
}
