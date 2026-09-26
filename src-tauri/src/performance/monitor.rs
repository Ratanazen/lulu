use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimePerformance {
    pub current_fps: u32,
    pub target_fps: u32,
    pub cpu_usage: f32,
    pub memory_rss_mb: u64,
    pub mode: String,
    pub tier: String,
    pub animation_quality: String,
    pub renderer_state: String, // "ACTIVE", "IDLE", "HIDDEN", "BACKGROUND"
    pub dbus_state: String,     // "CONNECTED", "DISCONNECTED", "UNSUPPORTED"
    pub mpris_state: String,    // "PLAYING", "PAUSED", "STOPPED", "UNAVAILABLE"
    pub lyrics_state: String,   // "ACTIVE", "IDLE", "NONE"
    pub database_writes_count: u64,
    pub is_power_saving: bool,
    pub is_adaptive_downgraded: bool,
}

static DB_WRITE_COUNTER: AtomicU64 = AtomicU64::new(0);

pub struct PerformanceMonitor;

impl PerformanceMonitor {
    pub fn increment_db_write() {
        DB_WRITE_COUNTER.fetch_add(1, Ordering::Relaxed);
    }

    pub fn get_db_writes() -> u64 {
        DB_WRITE_COUNTER.load(Ordering::Relaxed)
    }

    pub fn get_process_memory_mb() -> u64 {
        if let Ok(status) = std::fs::read_to_string("/proc/self/status") {
            for line in status.lines() {
                if line.starts_with("VmRSS:") {
                    if let Some(val_str) = line.split_whitespace().nth(1) {
                        if let Ok(kb) = val_str.parse::<u64>() {
                            return kb / 1024;
                        }
                    }
                }
            }
        }
        0
    }
}
