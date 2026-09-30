use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuInfo {
    pub vendor: String,
    pub model: String,
    pub architecture: String,
    pub logical_cores: usize,
    pub physical_cores: usize,
    pub frequency_mhz: u64,
    pub usage_percent: f32,
}

impl CpuInfo {
    pub fn probe(sys: &System) -> Self {
        let cpus = sys.cpus();
        let logical_cores = cpus.len();
        let physical_cores = sys.physical_core_count().unwrap_or(logical_cores);

        let (vendor, model, freq) = if let Some(cpu) = cpus.first() {
            (
                cpu.vendor_id().to_string(),
                cpu.brand().trim().to_string(),
                cpu.frequency(),
            )
        } else {
            ("UNKNOWN".into(), "UNKNOWN".into(), 0)
        };

        let usage_percent = sys.global_cpu_usage();
        let architecture = std::env::consts::ARCH.to_string();

        Self {
            vendor: if vendor.is_empty() { "UNKNOWN".into() } else { vendor },
            model: if model.is_empty() { "UNKNOWN".into() } else { model },
            architecture,
            logical_cores,
            physical_cores,
            frequency_mhz: freq,
            usage_percent,
        }
    }
}
