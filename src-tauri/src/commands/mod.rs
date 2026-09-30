use serde::{Deserialize, Serialize};
use sysinfo::System;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareInfo {
    pub cpu_count: usize,
    pub total_memory_mb: u64,
    pub os: String,
    pub is_low_spec: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceSummary {
    pub mode: String,
    pub target_fps: u32,
    pub power_saving: bool,
}

#[tauri::command]
pub fn get_hardware_info() -> HardwareInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu_count = sys.cpus().len();
    let total_memory_mb = sys.total_memory() / (1024 * 1024);
    let os = System::name().unwrap_or_else(|| "Linux".into());
    let is_low_spec = total_memory_mb < 4096 || cpu_count <= 2;

    HardwareInfo {
        cpu_count,
        total_memory_mb,
        os,
        is_low_spec,
    }
}

#[tauri::command]
pub fn get_performance_config() -> PerformanceSummary {
    let hw = get_hardware_info();
    if hw.is_low_spec {
        PerformanceSummary {
            mode: "PowerSaver".into(),
            target_fps: 30,
            power_saving: true,
        }
    } else {
        PerformanceSummary {
            mode: "Standard".into(),
            target_fps: 60,
            power_saving: false,
        }
    }
}

#[tauri::command]
pub fn copy_to_clipboard(text: String) -> Result<(), String> {
    // Try wl-copy or xclip
    if let Ok(mut child) = Command::new("wl-copy").stdin(std::process::Stdio::piped()).spawn() {
        if let Some(mut stdin) = child.stdin.take() {
            use std::io::Write;
            let _ = stdin.write_all(text.as_bytes());
        }
        let _ = child.wait();
        return Ok(());
    }

    if let Ok(mut child) = Command::new("xclip").args(["-selection", "clipboard"]).stdin(std::process::Stdio::piped()).spawn() {
        if let Some(mut stdin) = child.stdin.take() {
            use std::io::Write;
            let _ = stdin.write_all(text.as_bytes());
        }
        let _ = child.wait();
        return Ok(());
    }

    Ok(())
}
