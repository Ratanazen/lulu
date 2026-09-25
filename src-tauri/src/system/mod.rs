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
}
