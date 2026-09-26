use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PowerState {
    pub ac_online: bool,
    pub has_battery: bool,
    pub battery_percentage: Option<u8>,
    pub battery_state: Option<String>, // "Charging", "Discharging", "Full", "Unknown"
    pub is_power_saving_active: bool,
}

pub struct PowerDetector;

impl PowerDetector {
    pub fn get_power_state(power_saving_enabled: bool) -> PowerState {
        let mut ac_online = true;
        let mut has_battery = false;
        let mut battery_percentage = None;
        let mut battery_state = None;

        let ps_path = Path::new("/sys/class/power_supply");
        if ps_path.exists() {
            if let Ok(entries) = std::fs::read_dir(ps_path) {
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
        }

        let is_power_saving_active = has_battery && !ac_online && power_saving_enabled;

        PowerState {
            ac_online,
            has_battery,
            battery_percentage,
            battery_state,
            is_power_saving_active,
        }
    }
}
