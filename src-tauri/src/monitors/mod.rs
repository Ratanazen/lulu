use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeMonitorInfo {
    pub name: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub scale_factor: f64,
    pub is_primary: bool,
    pub work_area_x: i32,
    pub work_area_y: i32,
    pub work_area_width: u32,
    pub work_area_height: u32,
}

#[derive(Debug, Clone, Deserialize)]
struct SwayRect {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

#[derive(Debug, Clone, Deserialize)]
struct SwayOutput {
    name: String,
    active: Option<bool>,
    power: Option<bool>,
    rect: SwayRect,
    scale: Option<f64>,
    focused: Option<bool>,
    primary: Option<bool>,
}

pub fn parse_sway_outputs_json(json_str: &str) -> Option<Vec<NativeMonitorInfo>> {
    let sway_outputs: Vec<SwayOutput> = serde_json::from_str(json_str).ok()?;
    if sway_outputs.is_empty() {
        return None;
    }

    let mut result = Vec::new();
    let has_any_focused = sway_outputs.iter().any(|o| o.focused == Some(true));

    for (idx, so) in sway_outputs.into_iter().enumerate() {
        if so.active == Some(false) || so.power == Some(false) {
            continue;
        }

        let is_primary = if has_any_focused {
            so.focused.unwrap_or(false) || so.primary.unwrap_or(false)
        } else {
            so.primary.unwrap_or(false) || idx == 0
        };

        result.push(NativeMonitorInfo {
            name: so.name,
            x: so.rect.x,
            y: so.rect.y,
            width: so.rect.width,
            height: so.rect.height,
            scale_factor: so.scale.unwrap_or(1.0),
            is_primary,
            work_area_x: so.rect.x,
            work_area_y: so.rect.y,
            work_area_width: so.rect.width,
            work_area_height: so.rect.height,
        });
    }

    if result.is_empty() {
        None
    } else {
        Some(result)
    }
}

pub fn get_sway_outputs() -> Option<Vec<NativeMonitorInfo>> {
    let output = std::process::Command::new("swaymsg")
        .args(["-t", "get_outputs", "-r"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8(output.stdout).ok()?;
    parse_sway_outputs_json(&stdout)
}

#[tauri::command]
pub fn get_monitors(app: AppHandle) -> Result<Vec<NativeMonitorInfo>, String> {
    // 1. Try native Sway IPC query on Wayland first
    if let Some(sway_monitors) = get_sway_outputs() {
        if !sway_monitors.is_empty() {
            return Ok(sway_monitors);
        }
    }

    // 2. Fallback to Tauri / Winit monitor enumeration
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    let primary = window.primary_monitor().ok().flatten();
    let primary_pos = primary.as_ref().map(|p| p.position());

    let monitors = window.available_monitors().map_err(|e| e.to_string())?;
    let mut result = Vec::new();

    for m in monitors {
        let pos = m.position();
        let size = m.size();
        let is_primary = match (primary_pos, pos) {
            (Some(p), cur) => p.x == cur.x && p.y == cur.y,
            _ => false,
        };

        result.push(NativeMonitorInfo {
            name: m.name().cloned().unwrap_or_else(|| "Display".to_string()),
            x: pos.x,
            y: pos.y,
            width: size.width,
            height: size.height,
            scale_factor: m.scale_factor(),
            is_primary,
            work_area_x: pos.x,
            work_area_y: pos.y,
            work_area_width: size.width,
            work_area_height: size.height,
        });
    }

    if result.is_empty() {
        // Fallback default safe screen if headless/sandbox probe
        result.push(NativeMonitorInfo {
            name: "Default Screen".to_string(),
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            scale_factor: 1.0,
            is_primary: true,
            work_area_x: 0,
            work_area_y: 0,
            work_area_width: 1920,
            work_area_height: 1080,
        });
    }

    Ok(result)
}

#[tauri::command]
pub fn get_primary_monitor(app: AppHandle) -> Result<NativeMonitorInfo, String> {
    let monitors = get_monitors(app)?;
    for m in &monitors {
        if m.is_primary {
            return Ok(m.clone());
        }
    }
    monitors
        .into_iter()
        .next()
        .ok_or_else(|| "No monitor detected".to_string())
}

#[tauri::command]
pub fn move_to_monitor(name: String) -> Result<(), String> {
    let status = std::process::Command::new("swaymsg")
        .args([
            "[app_id=\"^lulu$\" floating]",
            "move",
            "output",
            &name,
        ])
        .status();

    match status {
        Ok(s) if s.success() => Ok(()),
        _ => Err(format!("Failed to move to monitor output {}", name)),
    }
}

#[tauri::command]
pub fn move_to_workspace(workspace: String) -> Result<(), String> {
    let status = std::process::Command::new("swaymsg")
        .args([
            "[app_id=\"^lulu$\" floating]",
            "move",
            "to",
            "workspace",
            &workspace,
        ])
        .status();

    match status {
        Ok(s) if s.success() => Ok(()),
        _ => Err(format!("Failed to move to workspace {}", workspace)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_monitor_serialization() {
        let m = NativeMonitorInfo {
            name: "HDMI-1".to_string(),
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            scale_factor: 1.0,
            is_primary: true,
            work_area_x: 0,
            work_area_y: 0,
            work_area_width: 1920,
            work_area_height: 1080,
        };
        let json = serde_json::to_string(&m).unwrap();
        assert!(json.contains("HDMI-1"));
        assert!(json.contains("1920"));
    }

    #[test]
    fn test_parse_sway_outputs_json() {
        let sample_json = r#"[
            {
                "id": 3,
                "name": "eDP-1",
                "active": true,
                "power": true,
                "scale": 1.0,
                "focused": true,
                "rect": { "x": 0, "y": 0, "width": 1920, "height": 1080 }
            },
            {
                "id": 4,
                "name": "HDMI-A-1",
                "active": true,
                "power": true,
                "scale": 1.0,
                "focused": false,
                "rect": { "x": 1920, "y": 0, "width": 2560, "height": 1440 }
            },
            {
                "id": 5,
                "name": "DP-1",
                "active": false,
                "power": false,
                "scale": 1.0,
                "rect": { "x": 0, "y": 0, "width": 1920, "height": 1080 }
            }
        ]"#;

        let parsed = parse_sway_outputs_json(sample_json).expect("should parse sway outputs");
        assert_eq!(parsed.len(), 2, "Inactive DP-1 output should be filtered out");

        assert_eq!(parsed[0].name, "eDP-1");
        assert_eq!(parsed[0].width, 1920);
        assert_eq!(parsed[0].height, 1080);
        assert!(parsed[0].is_primary);

        assert_eq!(parsed[1].name, "HDMI-A-1");
        assert_eq!(parsed[1].x, 1920);
        assert_eq!(parsed[1].width, 2560);
        assert_eq!(parsed[1].height, 1440);
        assert!(!parsed[1].is_primary);
    }
}
