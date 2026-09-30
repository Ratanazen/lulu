use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuInfo {
    pub name: String,
    pub vendor: String,
    pub renderer: String,
    pub is_discrete: bool,
    pub vram_mb: Option<u64>,
    pub driver: String,
    pub status: String, // "DETECTED" | "UNSUPPORTED"
}

impl GpuInfo {
    pub fn probe() -> Self {
        // Safe probing via /sys/class/drm
        let drm_path = Path::new("/sys/class/drm");
        if !drm_path.exists() {
            return Self::unsupported("DRM subsystem not found");
        }

        // Iterate cards: card0, card1, etc.
        let mut candidate: Option<GpuInfo> = None;

        if let Ok(entries) = fs::read_dir(drm_path) {
            for entry in entries.flatten() {
                let fname = entry.file_name().to_string_lossy().to_string();
                if fname.starts_with("card") && !fname.contains('-') {
                    let dev_path = entry.path().join("device");
                    if dev_path.exists() {
                        let vendor_hex = fs::read_to_string(dev_path.join("vendor"))
                            .unwrap_or_default()
                            .trim()
                            .to_lowercase();
                        let driver_link = fs::read_link(dev_path.join("driver"))
                            .map(|p| p.file_name().unwrap_or_default().to_string_lossy().to_string())
                            .unwrap_or_else(|_| "unknown".into());

                        let vendor_name = match vendor_hex.as_str() {
                            "0x10de" => "NVIDIA",
                            "0x1002" => "AMD",
                            "0x8086" => "Intel",
                            _ => "Unknown GPU Vendor",
                        };

                        let is_discrete = vendor_hex == "0x10de"; // NVIDIA is typically discrete; AMD/Intel can be iGPU

                        let vram_mb = fs::read_to_string(dev_path.join("mem_info_vram_total"))
                            .ok()
                            .and_then(|s| s.trim().parse::<u64>().ok())
                            .map(|bytes| bytes / 1024 / 1024);

                        let info = GpuInfo {
                            name: format!("{} Graphics ({})", vendor_name, driver_link),
                            vendor: vendor_name.to_string(),
                            renderer: driver_link.clone(),
                            is_discrete,
                            vram_mb,
                            driver: driver_link,
                            status: "DETECTED".to_string(),
                        };

                        if is_discrete || candidate.is_none() {
                            candidate = Some(info);
                        }
                    }
                }
            }
        }

        candidate.unwrap_or_else(|| Self::unsupported("No DRM card found"))
    }

    fn unsupported(reason: &str) -> Self {
        Self {
            name: "UNSUPPORTED".to_string(),
            vendor: "UNSUPPORTED".to_string(),
            renderer: reason.to_string(),
            is_discrete: false,
            vram_mb: None,
            driver: "UNSUPPORTED".to_string(),
            status: "UNSUPPORTED".to_string(),
        }
    }
}
