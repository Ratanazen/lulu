use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessSummary {
    pub total_processes: usize,
    pub running_processes: usize,
    pub system_load_1m: f64,
    pub system_load_5m: f64,
    pub system_load_15m: f64,
}

impl ProcessSummary {
    pub fn probe(sys: &System) -> Self {
        let total = sys.processes().len();
        let running = sys
            .processes()
            .values()
            .filter(|p| matches!(p.status(), sysinfo::ProcessStatus::Run))
            .count();

        let load = System::load_average();

        Self {
            total_processes: total,
            running_processes: running,
            system_load_1m: (load.one * 100.0).round() / 100.0,
            system_load_5m: (load.five * 100.0).round() / 100.0,
            system_load_15m: (load.fifteen * 100.0).round() / 100.0,
        }
    }
}
