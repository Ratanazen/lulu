use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryInfo {
    pub total_bytes: u64,
    pub available_bytes: u64,
    pub used_bytes: u64,
    pub swap_total_bytes: u64,
    pub swap_used_bytes: u64,
    pub total_mb: u64,
    pub available_mb: u64,
    pub used_mb: u64,
    pub swap_total_mb: u64,
    pub swap_used_mb: u64,
}

impl MemoryInfo {
    pub fn probe(sys: &System) -> Self {
        let total = sys.total_memory();
        let available = sys.available_memory();
        let used = sys.used_memory();
        let swap_total = sys.total_swap();
        let swap_used = sys.used_swap();

        Self {
            total_bytes: total,
            available_bytes: available,
            used_bytes: used,
            swap_total_bytes: swap_total,
            swap_used_bytes: swap_used,
            total_mb: total / 1024 / 1024,
            available_mb: available / 1024 / 1024,
            used_mb: used / 1024 / 1024,
            swap_total_mb: swap_total / 1024 / 1024,
            swap_used_mb: swap_used / 1024 / 1024,
        }
    }
}
