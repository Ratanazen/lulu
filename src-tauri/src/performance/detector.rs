use serde::{Deserialize, Serialize};
use sysinfo::System;
use std::path::Path;

use super::profile::PerformanceTier;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedCpuInfo {
    pub vendor: String,
    pub model: String,
    pub physical_cores: usize,
    pub logical_cores: usize,
    pub frequency_mhz: u64,
    pub performance_tier: PerformanceTier,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedRamInfo {
    pub total_mb: u64,
    pub available_mb: u64,
    pub swap_total_mb: u64,
    pub swap_used_mb: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedGpuInfo {
    pub vendor: String,
    pub model: String,
    pub driver: String,
    pub is_discrete: bool,
    pub vram_total_mb: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedDisplayInfo {
    pub monitor_count: usize,
    pub resolution: String,
    pub refresh_rate_hz: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedOsInfo {
    pub distro: String,
    pub kernel: String,
    pub session_type: String, // "wayland", "x11", "unknown"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedDesktopInfo {
    pub desktop_environment: String, // "Sway", "Hyprland", "Niri", "KDE", "GNOME", "X11", "Unknown"
    pub window_manager: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedPowerInfo {
    pub ac_online: bool,
    pub has_battery: bool,
    pub battery_percentage: Option<u8>,
    pub battery_state: Option<String>, // "Charging", "Discharging", "Full", etc.
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedThermalInfo {
    pub cpu_temp_celsius: Option<f32>,
    pub thermal_state: String, // "COOL", "NORMAL", "WARM", "HOT", "UNKNOWN"
    pub is_thermal_throttling: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HardwareInfo {
    pub cpu: DetectedCpuInfo,
    pub ram: DetectedRamInfo,
    pub gpu: DetectedGpuInfo,
    pub display: DetectedDisplayInfo,
    pub os: DetectedOsInfo,
    pub desktop: DetectedDesktopInfo,
    pub power: DetectedPowerInfo,
    pub thermal: DetectedThermalInfo,
    pub overall_tier: PerformanceTier,
}

pub struct HardwareDetector;

impl HardwareDetector {
    pub fn detect() -> HardwareInfo {
        let mut sys = System::new();
        sys.refresh_cpu_all();
        sys.refresh_memory();

        // 1. CPU Detection
        let mut cpu_model = sys.cpus().first().map(|c| c.brand().trim().to_string()).unwrap_or_default();
        if cpu_model.is_empty() {
            if let Ok(content) = std::fs::read_to_string("/proc/cpuinfo") {
                for line in content.lines() {
                    if line.starts_with("model name") {
                        if let Some((_, val)) = line.split_once(':') {
                            cpu_model = val.trim().to_string();
                            break;
                        }
                    }
                }
            }
        }
        if cpu_model.is_empty() {
            cpu_model = "UNKNOWN".to_string();
        }

        let cpu_vendor = if cpu_model.contains("AMD") || cpu_model.contains("Ryzen") {
            "AMD".to_string()
        } else if cpu_model.contains("Intel") || cpu_model.contains("Core") || cpu_model.contains("Celeron") {
            "Intel".to_string()
        } else if cpu_model.contains("Apple") || cpu_model.contains("M1") || cpu_model.contains("M2") {
            "Apple".to_string()
        } else if cpu_model.contains("ARM") || cpu_model.contains("aarch64") {
            "ARM".to_string()
        } else {
            "UNKNOWN".to_string()
        };

        let logical_cores = sys.cpus().len();
        let physical_cores = sys.physical_core_count().unwrap_or(if logical_cores > 0 { logical_cores / 2 } else { 1 });

        let mut frequency_mhz = sys.cpus().first().map(|c| c.frequency()).unwrap_or(0);
        if frequency_mhz == 0 {
            if let Ok(freq_str) = std::fs::read_to_string("/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq") {
                if let Ok(khz) = freq_str.trim().parse::<u64>() {
                    frequency_mhz = khz / 1000;
                }
            }
        }

        // 2. RAM Detection
        let mut total_mb = sys.total_memory() / (1024 * 1024);
        let mut available_mb = sys.available_memory() / (1024 * 1024);
        let mut swap_total_mb = sys.total_swap() / (1024 * 1024);
        let mut swap_used_mb = sys.used_swap() / (1024 * 1024);

        if let Ok(meminfo) = std::fs::read_to_string("/proc/meminfo") {
            for line in meminfo.lines() {
                if let Some((k, v)) = line.split_once(':') {
                    if let Some(num_str) = v.trim().split_whitespace().next() {
                        if let Ok(num) = num_str.parse::<u64>() {
                            match k.trim() {
                                "MemTotal" => total_mb = num / 1024,
                                "MemAvailable" => available_mb = num / 1024,
                                "SwapTotal" => swap_total_mb = num / 1024,
                                "SwapFree" => swap_used_mb = swap_total_mb.saturating_sub(num / 1024),
                                _ => {}
                            }
                        }
                    }
                }
            }
        }

        // 3. GPU Detection via sysfs DRM nodes and lspci
        let mut gpu_vendor = "UNKNOWN".to_string();
        let mut gpu_model = "UNKNOWN".to_string();
        let mut gpu_driver = "UNKNOWN".to_string();
        let mut is_discrete = false;
        let mut vram_total_mb = 0u64;

        for card_idx in 0..8 {
            let card_path = format!("/sys/class/drm/card{}/device", card_idx);
            let p = Path::new(&card_path);
            if p.exists() {
                if let Ok(vt) = std::fs::read_to_string(p.join("mem_info_vram_total")) {
                    if let Ok(v) = vt.trim().parse::<u64>() {
                        vram_total_mb = v / (1024 * 1024);
                    }
                }
                break;
            }
        }

        // Read lspci safely if available
        if let Ok(out) = std::process::Command::new("lspci").output() {
            let s = String::from_utf8_lossy(&out.stdout);
            for line in s.lines() {
                if line.contains("VGA compatible controller") || line.contains("3D controller") {
                    if let Some(pos) = line.find(": ") {
                        gpu_model = line[pos + 2..].to_string();
                    }
                    if line.contains("NVIDIA") {
                        gpu_vendor = "NVIDIA".to_string();
                        gpu_driver = "nvidia".to_string();
                        is_discrete = true;
                    } else if line.contains("AMD") || line.contains("Radeon") {
                        gpu_vendor = "AMD".to_string();
                        gpu_driver = "amdgpu".to_string();
                        is_discrete = !line.contains("Mendocino") && !line.contains("APU") && !line.contains("Integrated");
                    } else if line.contains("Intel") {
                        gpu_vendor = "Intel".to_string();
                        gpu_driver = "i915".to_string();
                        is_discrete = line.contains("Arc");
                    }
                    break;
                }
            }
        }

        if vram_total_mb == 0 && total_mb > 0 {
            // Older/integrated fallback estimation
            vram_total_mb = (total_mb / 8).clamp(128, 512);
        }

        // 4. OS & Desktop
        let mut distro = "UNKNOWN".to_string();
        if let Ok(os_rel) = std::fs::read_to_string("/etc/os-release") {
            for line in os_rel.lines() {
                if line.starts_with("PRETTY_NAME=") {
                    distro = line.trim_start_matches("PRETTY_NAME=").trim_matches('"').to_string();
                    break;
                }
            }
        }
        if distro == "UNKNOWN" {
            distro = System::name().unwrap_or_else(|| "Linux".to_string());
        }

        let kernel = System::kernel_version().unwrap_or_else(|| "UNKNOWN".to_string());
        let session_type = std::env::var("XDG_SESSION_TYPE").unwrap_or_else(|_| {
            if std::env::var_os("WAYLAND_DISPLAY").is_some() {
                "wayland".to_string()
            } else if std::env::var_os("DISPLAY").is_some() {
                "x11".to_string()
            } else {
                "unknown".to_string()
            }
        });

        let xdg_current = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_default();
        let is_sway = std::env::var_os("SWAYSOCK").is_some() || xdg_current.to_lowercase().contains("sway");
        let is_hyprland = std::env::var_os("HYPRLAND_INSTANCE_SIGNATURE").is_some() || xdg_current.to_lowercase().contains("hyprland");
        let is_niri = std::env::var_os("NIRI_SOCKET").is_some() || xdg_current.to_lowercase().contains("niri");
        let is_kde = xdg_current.to_lowercase().contains("kde");
        let is_gnome = xdg_current.to_lowercase().contains("gnome");

        let desktop_env = if is_sway {
            "Sway".to_string()
        } else if is_hyprland {
            "Hyprland".to_string()
        } else if is_niri {
            "Niri".to_string()
        } else if is_kde {
            "KDE".to_string()
        } else if is_gnome {
            "GNOME".to_string()
        } else if session_type == "x11" {
            "X11".to_string()
        } else if !xdg_current.is_empty() {
            xdg_current.clone()
        } else {
            "UNKNOWN".to_string()
        };

        // 5. Display environment
        let mut monitor_count = 1;
        let mut resolution = "1920x1080".to_string();
        let mut refresh_rate_hz = 60u32;

        if is_sway {
            if let Ok(out) = std::process::Command::new("swaymsg")
                .arg("-t")
                .arg("get_outputs")
                .output()
            {
                if let Ok(json_str) = String::from_utf8(out.stdout) {
                    if let Ok(parsed) = serde_json::from_str::<Vec<serde_json::Value>>(&json_str) {
                        monitor_count = parsed.len().max(1);
                        if let Some(first) = parsed.first() {
                            if let Some(rect) = first.get("rect") {
                                let w = rect.get("width").and_then(|v| v.as_u64()).unwrap_or(1920);
                                let h = rect.get("height").and_then(|v| v.as_u64()).unwrap_or(1080);
                                resolution = format!("{}x{}", w, h);
                            }
                            if let Some(rr) = first.get("current_mode").and_then(|m| m.get("refresh")).and_then(|v| v.as_u64()) {
                                refresh_rate_hz = (rr / 1000) as u32;
                            }
                        }
                    }
                }
            }
        }

        // 6. Power State
        let mut ac_online = true;
        let mut has_battery = false;
        let mut battery_percentage = None;
        let mut battery_state = None;

        if let Ok(entries) = std::fs::read_dir("/sys/class/power_supply") {
            for entry in entries.flatten() {
                let ep = entry.path();
                let name = ep.file_name().unwrap_or_default().to_string_lossy();
                if name.starts_with("AC") || name.starts_with("ADP") {
                    if let Ok(s) = std::fs::read_to_string(ep.join("online")) {
                        ac_online = s.trim() == "1";
                    }
                } else if name.starts_with("BAT") {
                    has_battery = true;
                    if let Ok(cap) = std::fs::read_to_string(ep.join("capacity")) {
                        if let Ok(pct) = cap.trim().parse::<u8>() {
                            battery_percentage = Some(pct);
                        }
                    }
                    if let Ok(st) = std::fs::read_to_string(ep.join("status")) {
                        battery_state = Some(st.trim().to_string());
                    }
                }
            }
        }

        // 7. Thermal State Probing
        let cpu_temp_celsius = Self::probe_cpu_temp();
        let (thermal_state, is_thermal_throttling) = Self::evaluate_thermal_state(cpu_temp_celsius);

        // 8. Calculate Hardware Performance Class (PerformanceTier)
        let overall_tier = Self::classify_tier(physical_cores, logical_cores, total_mb, is_discrete, vram_total_mb);

        HardwareInfo {
            cpu: DetectedCpuInfo {
                vendor: cpu_vendor,
                model: cpu_model,
                physical_cores,
                logical_cores,
                frequency_mhz,
                performance_tier: overall_tier,
            },
            ram: DetectedRamInfo {
                total_mb,
                available_mb,
                swap_total_mb,
                swap_used_mb,
            },
            gpu: DetectedGpuInfo {
                vendor: gpu_vendor,
                model: gpu_model,
                driver: gpu_driver,
                is_discrete,
                vram_total_mb,
            },
            display: DetectedDisplayInfo {
                monitor_count,
                resolution,
                refresh_rate_hz,
            },
            os: DetectedOsInfo {
                distro,
                kernel,
                session_type,
            },
            desktop: DetectedDesktopInfo {
                desktop_environment: desktop_env.clone(),
                window_manager: desktop_env,
            },
            power: DetectedPowerInfo {
                ac_online,
                has_battery,
                battery_percentage,
                battery_state,
            },
            thermal: DetectedThermalInfo {
                cpu_temp_celsius,
                thermal_state,
                is_thermal_throttling,
            },
            overall_tier,
        }
    }

    pub fn probe_cpu_temp() -> Option<f32> {
        // 1. Try hwmon sensors (prefer k10temp, coretemp, zenpower, cpu)
        if let Ok(entries) = std::fs::read_dir("/sys/class/hwmon") {
            let mut fallback_temp: Option<f32> = None;
            for entry in entries.flatten() {
                let p = entry.path();
                let name = std::fs::read_to_string(p.join("name")).unwrap_or_default().to_lowercase();
                let is_cpu = name.contains("k10temp")
                    || name.contains("coretemp")
                    || name.contains("zenpower")
                    || name.contains("cpu");

                if let Ok(temp_str) = std::fs::read_to_string(p.join("temp1_input")) {
                    if let Ok(milli) = temp_str.trim().parse::<f32>() {
                        let c = milli / 1000.0;
                        if is_cpu {
                            return Some(c);
                        } else if fallback_temp.is_none() {
                            fallback_temp = Some(c);
                        }
                    }
                }
            }
            if let Some(t) = fallback_temp {
                return Some(t);
            }
        }

        // 2. Try thermal_zone*
        if let Ok(entries) = std::fs::read_dir("/sys/class/thermal") {
            for entry in entries.flatten() {
                let p = entry.path();
                let fname = p.file_name().unwrap_or_default().to_string_lossy();
                if fname.starts_with("thermal_zone") {
                    if let Ok(temp_str) = std::fs::read_to_string(p.join("temp")) {
                        if let Ok(milli) = temp_str.trim().parse::<f32>() {
                            return Some(milli / 1000.0);
                        }
                    }
                }
            }
        }

        None
    }

    pub fn evaluate_thermal_state(temp: Option<f32>) -> (String, bool) {
        match temp {
            Some(t) if t >= 74.0 => ("HOT".to_string(), true),
            Some(t) if t >= 68.0 => ("WARM".to_string(), true),
            Some(t) if t >= 55.0 => ("NORMAL".to_string(), false),
            Some(_) => ("COOL".to_string(), false),
            None => ("UNKNOWN".to_string(), false),
        }
    }

    pub fn classify_tier(
        physical_cores: usize,
        logical_cores: usize,
        ram_total_mb: u64,
        is_discrete_gpu: bool,
        vram_mb: u64,
    ) -> PerformanceTier {
        if ram_total_mb == 0 || logical_cores == 0 {
            return PerformanceTier::Unknown;
        }

        // VERY_LOW: <= 4GB RAM or <= 2 logical cores
        if ram_total_mb <= 4096 || logical_cores <= 2 {
            return PerformanceTier::VeryLow;
        }

        // LOW: <= 8GB RAM or <= 4 logical cores without discrete GPU
        if ram_total_mb <= 8192 || (logical_cores <= 4 && !is_discrete_gpu) {
            return PerformanceTier::Low;
        }

        // HIGH: > 16GB RAM and (>= 8 physical cores or (>= 6 cores with discrete GPU and > 2GB VRAM))
        if ram_total_mb > 16384 && (physical_cores >= 8 || (is_discrete_gpu && vram_mb >= 2048)) {
            return PerformanceTier::High;
        }

        // MEDIUM: default for modern mid-range systems (e.g. 8-16GB RAM, 4-8 cores APU like Ryzen 5 7520U)
        PerformanceTier::Medium
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tier_classification() {
        // Very low: <= 4GB RAM or <= 2 cores
        assert_eq!(
            HardwareDetector::classify_tier(1, 2, 3800, false, 0),
            PerformanceTier::VeryLow
        );
        assert_eq!(
            HardwareDetector::classify_tier(2, 4, 4000, false, 128),
            PerformanceTier::VeryLow
        );

        // Low: 4-8GB RAM, older CPU
        assert_eq!(
            HardwareDetector::classify_tier(2, 4, 7800, false, 256),
            PerformanceTier::Low
        );

        // Medium: 8-16GB RAM, 4-8 cores APU (e.g. AMD Ryzen 5 7520U)
        assert_eq!(
            HardwareDetector::classify_tier(4, 8, 15500, false, 512),
            PerformanceTier::Medium
        );

        // High: > 16GB RAM with 8+ physical cores or discrete GPU
        assert_eq!(
            HardwareDetector::classify_tier(8, 16, 32000, true, 8192),
            PerformanceTier::High
        );

        // Missing data -> Unknown
        assert_eq!(
            HardwareDetector::classify_tier(0, 0, 0, false, 0),
            PerformanceTier::Unknown
        );
    }
}

