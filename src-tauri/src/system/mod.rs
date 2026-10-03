pub mod cpu;
pub mod memory;
pub mod gpu;
pub mod disk;
pub mod display;
pub mod power;
pub mod os;
pub mod session;
pub mod network;
pub mod processes;

use cpu::CpuInfo;
use memory::MemoryInfo;
use gpu::GpuInfo;
use disk::DiskInfo;
use display::DisplayInfo;
use power::PowerInfo;
use os::OsInfo;
use session::SessionInfo;
use network::NetworkInfo;
use processes::ProcessSummary;

use serde::{Deserialize, Serialize};
use sysinfo::System;
use std::sync::{Mutex, OnceLock};

struct SystemState {
    sys: System,
    prev_cpu_times: Option<(u64, u64)>,
}

static SYSTEM_STATE: OnceLock<Mutex<SystemState>> = OnceLock::new();

fn read_proc_stat() -> Option<(u64, u64)> {
    let stat = std::fs::read_to_string("/proc/stat").ok()?;
    let line = stat.lines().next()?;
    if !line.starts_with("cpu ") {
        return None;
    }
    let parts: Vec<u64> = line
        .split_whitespace()
        .skip(1)
        .filter_map(|s| s.parse().ok())
        .collect();
    if parts.len() >= 4 {
        let user = parts[0];
        let nice = parts[1];
        let system = parts[2];
        let idle = parts[3];
        let iowait = *parts.get(4).unwrap_or(&0);
        let irq = *parts.get(5).unwrap_or(&0);
        let softirq = *parts.get(6).unwrap_or(&0);
        let steal = *parts.get(7).unwrap_or(&0);

        let idle_all = idle + iowait;
        let total = user + nice + system + idle_all + irq + softirq + steal;
        Some((total, idle_all))
    } else {
        None
    }
}

fn get_system_state() -> &'static Mutex<SystemState> {
    SYSTEM_STATE.get_or_init(|| {
        let mut sys = System::new_all();
        sys.refresh_all();
        let cpu_times = read_proc_stat();
        Mutex::new(SystemState {
            sys,
            prev_cpu_times: cpu_times,
        })
    })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PerformanceProfile {
    Auto,
    PowerSaver,
    VeryLow,
    Low,
    Balanced,
    High,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComprehensiveSystemInfo {
    pub cpu: CpuInfo,
    pub memory: MemoryInfo,
    pub gpu: GpuInfo,
    pub disk: DiskInfo,
    pub display: DisplayInfo,
    pub power: PowerInfo,
    pub os: OsInfo,
    pub session: SessionInfo,
    pub network: NetworkInfo,
    pub processes: ProcessSummary,
    pub recommended_profile: PerformanceProfile,
    pub active_profile: PerformanceProfile,
    pub is_low_spec: bool,
}

pub struct SystemEngine;

impl SystemEngine {
    pub fn probe_full() -> ComprehensiveSystemInfo {
        let mut state = get_system_state().lock().unwrap();
        state.sys.refresh_cpu_usage();
        state.sys.refresh_memory();
        state.sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

        let current_cpu_times = read_proc_stat();
        let mut usage_percent = state.sys.global_cpu_usage();

        if let (Some(curr), Some(prev)) = (current_cpu_times, state.prev_cpu_times) {
            let delta_total = curr.0.saturating_sub(prev.0);
            let delta_idle = curr.1.saturating_sub(prev.1);
            if delta_total > 0 {
                let calculated = ((delta_total.saturating_sub(delta_idle)) as f64 / delta_total as f64 * 100.0) as f32;
                usage_percent = calculated.clamp(0.0, 100.0);
            }
        } else if usage_percent <= 0.0 {
            // First run sampling delay for instant live telemetry
            std::thread::sleep(std::time::Duration::from_millis(60));
            state.sys.refresh_cpu_usage();
            let next_cpu_times = read_proc_stat();
            if let (Some(curr), Some(prev)) = (next_cpu_times, current_cpu_times) {
                let delta_total = curr.0.saturating_sub(prev.0);
                let delta_idle = curr.1.saturating_sub(prev.1);
                if delta_total > 0 {
                    let calculated = ((delta_total.saturating_sub(delta_idle)) as f64 / delta_total as f64 * 100.0) as f32;
                    usage_percent = calculated.clamp(0.0, 100.0);
                }
            }
            if usage_percent <= 0.0 {
                usage_percent = state.sys.global_cpu_usage();
            }
        }

        state.prev_cpu_times = current_cpu_times.or(state.prev_cpu_times);

        let cpu_info = CpuInfo::probe_with_usage(&state.sys, usage_percent);
        let mem_info = MemoryInfo::probe(&state.sys);
        let gpu_info = GpuInfo::probe();
        let disk_info = DiskInfo::probe();
        let display_info = DisplayInfo::probe();
        let power_info = PowerInfo::probe();
        let os_info = OsInfo::probe();
        let session_info = SessionInfo::probe();
        let network_info = NetworkInfo::probe();
        let process_info = ProcessSummary::probe(&state.sys);

        let is_low_spec = mem_info.total_mb <= 8192 || cpu_info.logical_cores <= 4 || !gpu_info.is_discrete;

        let recommended_profile = if power_info.auto_power_save_recommended {
            PerformanceProfile::PowerSaver
        } else if mem_info.total_mb <= 4096 {
            PerformanceProfile::VeryLow
        } else if is_low_spec {
            PerformanceProfile::Low
        } else if mem_info.total_mb >= 16384 && gpu_info.is_discrete {
            PerformanceProfile::High
        } else {
            PerformanceProfile::Balanced
        };

        ComprehensiveSystemInfo {
            cpu: cpu_info,
            memory: mem_info,
            gpu: gpu_info,
            disk: disk_info,
            display: display_info,
            power: power_info,
            os: os_info,
            session: session_info,
            network: network_info,
            processes: process_info,
            recommended_profile,
            active_profile: recommended_profile,
            is_low_spec,
        }
    }

    pub fn generate_report(info: &ComprehensiveSystemInfo) -> String {
        format!(
r#"============================================================
LULU DESKTOP — SYSTEM & HARDWARE REPORT
============================================================
OS:           {} (Kernel {})
Host:         {} [{}]
Session:      {} ({})
Compositor:   {}

CPU:          {}
Architecture: {}
Cores:        {} logical / {} physical
Frequency:    {} MHz
Usage:        {:.1}%

RAM:          {} MB total ({} MB available)
Swap:         {} MB total ({} MB used)

GPU:          {}
Vendor:       {}
Renderer:     {}
Type:         {}
VRAM:         {}

Display:      {} ({} Hz, scale {:.1})
Monitors:     {} detected

Power:        {} [{}]
Battery:      {}

Disk Root:    {} GB free / {} GB total ({})

Network:      Online: {} (Primary: {})
Processes:    {} active, load: {:.2}, {:.2}, {:.2}

Recommended:  {:?}
Active:       {:?}
Low-Spec Mode: {}
============================================================"#,
            info.os.distro_name, info.os.kernel_version,
            info.os.host_name, info.os.arch,
            info.session.session_type, info.session.desktop_environment,
            info.session.compositor,
            info.cpu.model,
            info.cpu.architecture,
            info.cpu.logical_cores, info.cpu.physical_cores,
            info.cpu.frequency_mhz,
            info.cpu.usage_percent,
            info.memory.total_mb, info.memory.available_mb,
            info.memory.swap_total_mb, info.memory.swap_used_mb,
            info.gpu.name,
            info.gpu.vendor,
            info.gpu.renderer,
            if info.gpu.is_discrete { "Discrete" } else { "Integrated / Virtual" },
            info.gpu.vram_mb.map(|v| format!("{} MB", v)).unwrap_or_else(|| "N/A / Shared".to_string()),
            info.display.primary_resolution, info.display.refresh_rate_hz, info.display.scale_factor,
            info.display.monitor_count,
            info.power.source, info.power.status_text,
            info.power.battery_percentage.map(|p| format!("{}%", p)).unwrap_or_else(|| "N/A".to_string()),
            info.disk.root.as_ref().map(|r| r.available_space_gb.to_string()).unwrap_or_else(|| "0".to_string()),
            info.disk.root.as_ref().map(|r| r.total_space_gb.to_string()).unwrap_or_else(|| "0".to_string()),
            info.disk.root.as_ref().map(|r| r.filesystem.as_str()).unwrap_or("Unknown"),
            info.network.is_online, info.network.primary_interface,
            info.processes.total_processes, info.processes.system_load_1m, info.processes.system_load_5m, info.processes.system_load_15m,
            info.recommended_profile,
            info.active_profile,
            if info.is_low_spec { "ENABLED (Low CPU/GPU overhead)" } else { "DISABLED" }
        )
    }
}

#[tauri::command]
pub fn get_system_info() -> ComprehensiveSystemInfo {
    SystemEngine::probe_full()
}

#[tauri::command]
pub fn get_system_report() -> String {
    let info = SystemEngine::probe_full();
    SystemEngine::generate_report(&info)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_engine_probes() {
        let info = SystemEngine::probe_full();
        assert!(info.cpu.logical_cores > 0);
        assert!(info.memory.total_mb > 0);
        assert!(!info.os.os_name.is_empty());

        let report = SystemEngine::generate_report(&info);
        assert!(report.contains("LULU DESKTOP — SYSTEM & HARDWARE REPORT"));
    }
}

