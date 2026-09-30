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

#[tauri::command]
pub fn get_monitors(app: AppHandle) -> Result<Vec<NativeMonitorInfo>, String> {
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
}
