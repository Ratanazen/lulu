use serde::{Deserialize, Serialize};
use std::fs;
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OsInfo {
    pub distro_name: String,
    pub kernel_version: String,
    pub os_name: String,
    pub host_name: String,
    pub arch: String,
}

impl OsInfo {
    pub fn probe() -> Self {
        let kernel_version = System::kernel_version().unwrap_or_else(|| "Unknown".to_string());
        let host_name = System::host_name().unwrap_or_else(|| "localhost".to_string());
        let os_name = System::name().unwrap_or_else(|| "Linux".to_string());

        let mut distro_name = os_name.clone();
        if let Ok(content) = fs::read_to_string("/etc/os-release") {
            for line in content.lines() {
                if let Some(val) = line.strip_prefix("PRETTY_NAME=") {
                    distro_name = val.trim_matches('"').to_string();
                    break;
                }
            }
        }

        Self {
            distro_name,
            kernel_version,
            os_name,
            host_name,
            arch: std::env::consts::ARCH.to_string(),
        }
    }
}
