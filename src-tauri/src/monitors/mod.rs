use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitorInfo {
    pub id: String,
    pub name: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub scale_factor: f64,
    pub refresh_rate: Option<u32>,
    pub primary: bool,
    pub work_area_x: i32,
    pub work_area_y: i32,
    pub work_area_width: u32,
    pub work_area_height: u32,
}

pub struct MonitorService;

impl MonitorService {
    pub fn get_all_monitors(app: &AppHandle) -> Result<Vec<MonitorInfo>, String> {
        let mut list = Vec::new();
        let main_window = app.get_webview_window("main");

        if let Some(win) = main_window {
            let primary_monitor = win.primary_monitor().map_err(|e| e.to_string())?;
            let primary_name = primary_monitor
                .as_ref()
                .and_then(|m| m.name().cloned())
                .unwrap_or_default();

            let monitors = win.available_monitors().map_err(|e| e.to_string())?;
            for (idx, m) in monitors.into_iter().enumerate() {
                let name = m.name().cloned().unwrap_or_else(|| format!("Display-{}", idx + 1));
                let pos = m.position();
                let size = m.size();
                let scale = m.scale_factor();
                let is_primary = !primary_name.is_empty() && name == primary_name;

                list.push(MonitorInfo {
                    id: format!("mon_{}", idx),
                    name,
                    x: pos.x,
                    y: pos.y,
                    width: size.width,
                    height: size.height,
                    scale_factor: scale,
                    refresh_rate: None,
                    primary: is_primary,
                    work_area_x: pos.x,
                    work_area_y: pos.y,
                    work_area_width: size.width,
                    work_area_height: size.height,
                });
            }
        }

        if list.is_empty() {
            // Fallback for headless or mock environments
            list.push(MonitorInfo {
                id: "mon_fallback".to_string(),
                name: "Primary Display".to_string(),
                x: 0,
                y: 0,
                width: 1920,
                height: 1080,
                scale_factor: 1.0,
                refresh_rate: Some(60),
                primary: true,
                work_area_x: 0,
                work_area_y: 0,
                work_area_width: 1920,
                work_area_height: 1080,
            });
        }

        Ok(list)
    }

    pub fn get_current_monitor(app: &AppHandle) -> Result<Option<MonitorInfo>, String> {
        let win = app
            .get_webview_window("main")
            .ok_or_else(|| "Main window not found".to_string())?;
        let current = win.current_monitor().map_err(|e| e.to_string())?;

        if let Some(m) = current {
            let name = m.name().cloned().unwrap_or_else(|| "Current Display".to_string());
            let pos = m.position();
            let size = m.size();
            let scale = m.scale_factor();

            Ok(Some(MonitorInfo {
                id: "current".to_string(),
                name,
                x: pos.x,
                y: pos.y,
                width: size.width,
                height: size.height,
                scale_factor: scale,
                refresh_rate: None,
                primary: true,
                work_area_x: pos.x,
                work_area_y: pos.y,
                work_area_width: size.width,
                work_area_height: size.height,
            }))
        } else {
            Ok(None)
        }
    }
}
