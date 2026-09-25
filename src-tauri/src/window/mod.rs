use serde::{Deserialize, Serialize};
use tauri::{AppHandle, LogicalSize, Manager, PhysicalPosition, Position, Size};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowPosition {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowSize {
    pub width: u32,
    pub height: u32,
}

pub struct DesktopWindowService;

impl DesktopWindowService {
    pub fn get_position(app: &AppHandle, label: &str) -> Result<WindowPosition, String> {
        let win = app
            .get_webview_window(label)
            .ok_or_else(|| format!("Window {} not found", label))?;
        let pos = win.outer_position().map_err(|e| e.to_string())?;
        Ok(WindowPosition { x: pos.x, y: pos.y })
    }

    pub fn set_position(app: &AppHandle, label: &str, x: i32, y: i32) -> Result<(), String> {
        let win = app
            .get_webview_window(label)
            .ok_or_else(|| format!("Window {} not found", label))?;
        win.set_position(Position::Physical(PhysicalPosition { x, y }))
            .map_err(|e| e.to_string())
    }

    pub fn get_size(app: &AppHandle, label: &str) -> Result<WindowSize, String> {
        let win = app
            .get_webview_window(label)
            .ok_or_else(|| format!("Window {} not found", label))?;
        let sz = win.outer_size().map_err(|e| e.to_string())?;
        Ok(WindowSize {
            width: sz.width,
            height: sz.height,
        })
    }

    pub fn set_size(app: &AppHandle, label: &str, width: u32, height: u32) -> Result<(), String> {
        let win = app
            .get_webview_window(label)
            .ok_or_else(|| format!("Window {} not found", label))?;
        win.set_size(Size::Logical(LogicalSize {
            width: width as f64,
            height: height as f64,
        }))
        .map_err(|e| e.to_string())
    }

    pub fn set_always_on_top(app: &AppHandle, label: &str, on_top: bool) -> Result<(), String> {
        let win = app
            .get_webview_window(label)
            .ok_or_else(|| format!("Window {} not found", label))?;
        win.set_always_on_top(on_top).map_err(|e| e.to_string())
    }

    pub fn set_click_through(app: &AppHandle, label: &str, ignore: bool) -> Result<(), String> {
        let win = app
            .get_webview_window(label)
            .ok_or_else(|| format!("Window {} not found", label))?;
        win.set_ignore_cursor_events(ignore)
            .map_err(|e| e.to_string())
    }

    pub fn show(app: &AppHandle, label: &str) -> Result<(), String> {
        let win = app
            .get_webview_window(label)
            .ok_or_else(|| format!("Window {} not found", label))?;
        win.show().map_err(|e| e.to_string())
    }

    pub fn hide(app: &AppHandle, label: &str) -> Result<(), String> {
        let win = app
            .get_webview_window(label)
            .ok_or_else(|| format!("Window {} not found", label))?;
        win.hide().map_err(|e| e.to_string())
    }

    pub fn start_dragging(app: &AppHandle, label: &str) -> Result<(), String> {
        let win = app
            .get_webview_window(label)
            .ok_or_else(|| format!("Window {} not found", label))?;
        win.start_dragging().map_err(|e| e.to_string())
    }
}
