use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, Position, Size};

#[derive(Debug, Serialize, Deserialize)]
pub struct WindowCoordinates {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WindowDimensions {
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
pub fn get_window_position(app: AppHandle, label: Option<String>) -> Result<WindowCoordinates, String> {
    let window_label = label.unwrap_or_else(|| "main".to_string());
    let window = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Window '{}' not found", window_label))?;

    let pos = window.outer_position().map_err(|e| e.to_string())?;
    Ok(WindowCoordinates { x: pos.x, y: pos.y })
}

#[tauri::command]
pub fn set_window_position(app: AppHandle, x: i32, y: i32, label: Option<String>) -> Result<(), String> {
    let window_label = label.unwrap_or_else(|| "main".to_string());
    let window = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Window '{}' not found", window_label))?;

    let _ = window.set_position(Position::Physical(PhysicalPosition { x, y }));

    // Native Wayland Compositor movement for Sway/SwayFX and Hyprland
    let session = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_default().to_lowercase();
    if session.contains("sway") || std::env::var("SWAYSOCK").is_ok() {
        let _ = std::process::Command::new("swaymsg")
            .arg(format!("[title=\"Lulu\"] move position {} {}", x, y))
            .output();
        let _ = std::process::Command::new("swaymsg")
            .arg(format!("[app_id=\"com.ratana.lulu\"] move position {} {}", x, y))
            .output();
        let _ = std::process::Command::new("swaymsg")
            .arg(format!("[app_id=\"lulu\"] move position {} {}", x, y))
            .output();
    } else if session.contains("hypr") || std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok() {
        let _ = std::process::Command::new("hyprctl")
            .args(["dispatch", "movewindowpixel", &format!("exact {} {},title:Lulu", x, y)])
            .output();
        let _ = std::process::Command::new("hyprctl")
            .args(["dispatch", "movewindowpixel", &format!("exact {} {},class:com.ratana.lulu", x, y)])
            .output();
    }

    Ok(())
}

#[tauri::command]
pub fn get_cursor_position() -> Result<WindowCoordinates, String> {
    if let Ok(output) = std::process::Command::new("xdotool").arg("getmouselocation").output() {
        let text = String::from_utf8_lossy(&output.stdout);
        let mut x = 0;
        let mut y = 0;
        for part in text.split_whitespace() {
            if let Some(val) = part.strip_prefix("x:") {
                x = val.parse().unwrap_or(0);
            } else if let Some(val) = part.strip_prefix("y:") {
                y = val.parse().unwrap_or(0);
            }
        }
        return Ok(WindowCoordinates { x, y });
    }
    Ok(WindowCoordinates { x: 960, y: 540 })
}

#[tauri::command]
pub fn get_window_size(app: AppHandle, label: Option<String>) -> Result<WindowDimensions, String> {
    let window_label = label.unwrap_or_else(|| "main".to_string());
    let window = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Window '{}' not found", window_label))?;

    let size = window.outer_size().map_err(|e| e.to_string())?;
    Ok(WindowDimensions {
        width: size.width,
        height: size.height,
    })
}

#[tauri::command]
pub fn set_window_size(app: AppHandle, width: u32, height: u32, label: Option<String>) -> Result<(), String> {
    let window_label = label.unwrap_or_else(|| "main".to_string());
    let window = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Window '{}' not found", window_label))?;

    let _ = window.set_size(Size::Physical(PhysicalSize { width, height }));

    // Native Wayland Compositor resizing for Sway/SwayFX and Hyprland
    let session = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_default().to_lowercase();
    if session.contains("sway") || std::env::var("SWAYSOCK").is_ok() {
        let _ = std::process::Command::new("swaymsg")
            .arg(format!("[title=\"Lulu\"] resize set {} px {} px", width, height))
            .output();
        let _ = std::process::Command::new("swaymsg")
            .arg(format!("[app_id=\"com.ratana.lulu\"] resize set {} px {} px", width, height))
            .output();
        let _ = std::process::Command::new("swaymsg")
            .arg(format!("[app_id=\"lulu\"] resize set {} px {} px", width, height))
            .output();
    } else if session.contains("hypr") || std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok() {
        let _ = std::process::Command::new("hyprctl")
            .args(["dispatch", "resizewindowpixel", &format!("exact {} {},title:Lulu", width, height)])
            .output();
        let _ = std::process::Command::new("hyprctl")
            .args(["dispatch", "resizewindowpixel", &format!("exact {} {},class:com.ratana.lulu", width, height)])
            .output();
    }

    Ok(())
}

#[tauri::command]
pub fn set_always_on_top(app: AppHandle, always_on_top: bool, label: Option<String>) -> Result<(), String> {
    let window_label = label.unwrap_or_else(|| "main".to_string());
    let window = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Window '{}' not found", window_label))?;

    window.set_always_on_top(always_on_top).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn set_ignore_cursor_events(app: AppHandle, ignore: bool, label: Option<String>) -> Result<(), String> {
    let window_label = label.unwrap_or_else(|| "main".to_string());
    let window = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Window '{}' not found", window_label))?;

    window.set_ignore_cursor_events(ignore).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn show_window(app: AppHandle, label: Option<String>) -> Result<(), String> {
    let window_label = label.unwrap_or_else(|| "main".to_string());
    let window = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Window '{}' not found", window_label))?;

    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn hide_window(app: AppHandle, label: Option<String>) -> Result<(), String> {
    let window_label = label.unwrap_or_else(|| "main".to_string());
    let window = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Window '{}' not found", window_label))?;

    window.hide().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn exit_app(app: AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_window_coords_serialization() {
        let coords = WindowCoordinates { x: 500, y: -200 };
        let json = serde_json::to_string(&coords).unwrap();
        assert!(json.contains("\"x\":500"));
        assert!(json.contains("\"y\":-200"));
    }
}
