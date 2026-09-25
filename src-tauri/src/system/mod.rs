use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemMetrics {
    pub cpu_usage: f32,
    pub memory_used_mb: u64,
    pub memory_total_mb: u64,
    pub memory_percentage: f32,
    pub process_count: usize,
    pub uptime_seconds: u64,
    pub os_name: String,
    pub os_version: String,
    pub hostname: String,
}

pub struct SystemService {
    sys: Mutex<System>,
}

impl Default for SystemService {
    fn default() -> Self {
        let mut sys = System::new();
        sys.refresh_cpu_all();
        sys.refresh_memory();
        sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
        Self {
            sys: Mutex::new(sys),
        }
    }
}

impl SystemService {
    pub fn get_metrics(&self) -> Result<SystemMetrics, String> {
        let mut sys = self.sys.lock().map_err(|e| e.to_string())?;
        sys.refresh_cpu_all();
        sys.refresh_memory();
        sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

        let cpus = sys.cpus();
        let cpu_usage = if !cpus.is_empty() {
            let sum: f32 = cpus.iter().map(|c| c.cpu_usage()).sum();
            sum / (cpus.len() as f32)
        } else {
            sys.global_cpu_usage()
        };

        let total_mem = sys.total_memory();
        let used_mem = sys.used_memory();
        let total_mb = total_mem / (1024 * 1024);
        let used_mb = used_mem / (1024 * 1024);
        let mem_pct = if total_mem > 0 {
            (used_mem as f32 / total_mem as f32) * 100.0
        } else {
            0.0
        };

        let proc_count = sys.processes().len();
        let uptime = System::uptime();
        let os_name = System::name().unwrap_or_else(|| "Linux".to_string());
        let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());
        let hostname = System::host_name().unwrap_or_else(|| "localhost".to_string());

        Ok(SystemMetrics {
            cpu_usage,
            memory_used_mb: used_mb,
            memory_total_mb: total_mb,
            memory_percentage: mem_pct,
            process_count: proc_count,
            uptime_seconds: uptime,
            os_name,
            os_version,
            hostname,
        })
    }

    pub fn is_autostart_enabled() -> bool {
        #[cfg(target_os = "linux")]
        {
            if let Some(home) = std::env::var_os("HOME") {
                let autostart_path = std::path::PathBuf::from(home)
                    .join(".config")
                    .join("autostart")
                    .join("lulu.desktop");
                return autostart_path.exists();
            }
        }
        false
    }

    pub fn set_autostart_enabled(enabled: bool) -> Result<(), String> {
        #[cfg(target_os = "linux")]
        {
            if let Some(home) = std::env::var_os("HOME") {
                let autostart_dir = std::path::PathBuf::from(home)
                    .join(".config")
                    .join("autostart");
                let autostart_file = autostart_dir.join("lulu.desktop");

                if enabled {
                    std::fs::create_dir_all(&autostart_dir).map_err(|e| e.to_string())?;
                    let exe_path = std::env::current_exe()
                        .map(|p| p.to_string_lossy().to_string())
                        .unwrap_or_else(|_| "lulu".to_string());

                    let desktop_entry = format!(
                        "[Desktop Entry]\nType=Application\nVersion=1.0\nName=Lulu\nComment=AI Desktop Companion\nExec={}\nIcon=lulu\nTerminal=false\nCategories=Utility;\n",
                        exe_path
                    );
                    std::fs::write(&autostart_file, desktop_entry).map_err(|e| e.to_string())?;
                } else if autostart_file.exists() {
                    std::fs::remove_file(&autostart_file).map_err(|e| e.to_string())?;
                }
                return Ok(());
            }
        }
        Ok(())
    }

    pub fn get_linux_desktop_info() -> LinuxDesktopInfo {
        let de = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_else(|_| "Unknown".to_string());
        let session_type = std::env::var("XDG_SESSION_TYPE")
            .unwrap_or_else(|_| {
                if std::env::var_os("WAYLAND_DISPLAY").is_some() {
                    "wayland".to_string()
                } else {
                    "x11".to_string()
                }
            });

        let is_sway = std::env::var_os("SWAYSOCK").is_some() || de.to_lowercase().contains("sway");
        let is_hyprland = std::env::var_os("HYPRLAND_INSTANCE_SIGNATURE").is_some() || de.to_lowercase().contains("hyprland");

        let wm = if is_sway {
            "Sway".to_string()
        } else if is_hyprland {
            "Hyprland".to_string()
        } else {
            de.clone()
        };

        let mut active_workspaces = Vec::new();
        if is_sway {
            if let Ok(out) = std::process::Command::new("swaymsg")
                .arg("-t")
                .arg("get_workspaces")
                .output()
            {
                if let Ok(json_str) = String::from_utf8(out.stdout) {
                    if let Ok(parsed) = serde_json::from_str::<Vec<serde_json::Value>>(&json_str) {
                        for ws in parsed {
                            if let Some(name) = ws.get("name").and_then(|n| n.as_str()) {
                                active_workspaces.push(name.to_string());
                            }
                        }
                    }
                }
            }
        }

        LinuxDesktopInfo {
            desktop_environment: de,
            window_manager: wm,
            session_type,
            is_sway,
            is_hyprland,
            active_workspaces,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LinuxDesktopInfo {
    pub desktop_environment: String,
    pub window_manager: String,
    pub session_type: String,
    pub is_sway: bool,
    pub is_hyprland: bool,
    pub active_workspaces: Vec<String>,
}


