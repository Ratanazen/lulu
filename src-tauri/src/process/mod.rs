use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessItem {
    pub pid: u32,
    pub ppid: Option<u32>,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_mb: u64,
}

pub struct ProcessService;

impl ProcessService {
    pub fn list_top_processes(limit: usize) -> Result<Vec<ProcessItem>, String> {
        let mut sys = System::new();
        sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

        let mut list: Vec<ProcessItem> = sys
            .processes()
            .iter()
            .map(|(pid, proc_info)| ProcessItem {
                pid: pid.as_u32(),
                ppid: proc_info.parent().map(|p| p.as_u32()),
                name: proc_info.name().to_string_lossy().to_string(),
                cpu_usage: proc_info.cpu_usage(),
                memory_mb: proc_info.memory() / (1024 * 1024),
            })
            .collect();

        // Sort by memory usage descending
        list.sort_by(|a, b| b.memory_mb.cmp(&a.memory_mb));
        list.truncate(limit);

        Ok(list)
    }
}
