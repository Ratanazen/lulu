use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PowerInfo {
    pub source: String, // "AC" | "Battery" | "Unknown"
    pub is_charging: bool,
    pub battery_percentage: Option<u8>,
    pub status_text: String,
    pub auto_power_save_recommended: bool,
}

impl PowerInfo {
    pub fn probe() -> Self {
        let ps_path = Path::new("/sys/class/power_supply");
        if !ps_path.exists() {
            return Self {
                source: "Unknown".to_string(),
                is_charging: false,
                battery_percentage: None,
                status_text: "Power supply interface unavailable".to_string(),
                auto_power_save_recommended: false,
            };
        }

        let mut ac_online = false;
        let mut bat_capacity: Option<u8> = None;
        let mut bat_status: Option<String> = None;

        if let Ok(entries) = fs::read_dir(ps_path) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                let path = entry.path();

                // Check AC adapter
                if name.starts_with("AC") || name.starts_with("ADP") || name.starts_with("Mains") {
                    if let Ok(online) = fs::read_to_string(path.join("online")) {
                        if online.trim() == "1" {
                            ac_online = true;
                        }
                    }
                }

                // Check Battery
                if name.starts_with("BAT") {
                    if let Ok(cap_str) = fs::read_to_string(path.join("capacity")) {
                        if let Ok(cap) = cap_str.trim().parse::<u8>() {
                            bat_capacity = Some(cap);
                        }
                    }
                    if let Ok(stat) = fs::read_to_string(path.join("status")) {
                        bat_status = Some(stat.trim().to_string());
                    }
                }
            }
        }

        let is_charging = bat_status.as_deref() == Some("Charging");
        let source = if ac_online {
            "AC".to_string()
        } else if bat_capacity.is_some() {
            "Battery".to_string()
        } else {
            "Unknown".to_string()
        };

        // If on battery and <= 25%, auto power save is recommended
        let auto_power_save_recommended = !ac_online && bat_capacity.map(|c| c <= 30).unwrap_or(false);

        let status_text = match (ac_online, bat_capacity, &bat_status) {
            (true, Some(c), Some(s)) => format!("AC Connected (Battery {}% • {})", c, s),
            (true, _, _) => "AC Power Connected".to_string(),
            (false, Some(c), Some(s)) => format!("On Battery ({}% • {})", c, s),
            (false, Some(c), None) => format!("On Battery ({}%)", c),
            _ => "Power Status Unknown".to_string(),
        };

        Self {
            source,
            is_charging,
            battery_percentage: bat_capacity,
            status_text,
            auto_power_save_recommended,
        }
    }
}
