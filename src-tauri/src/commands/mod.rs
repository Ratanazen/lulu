use tauri::{AppHandle, State};

use crate::diagnostics::{DiagnosticResult, DiagnosticsService};
use crate::git::{GitRepoInfo, GitService};
use crate::monitors::{MonitorInfo, MonitorService};
use crate::movement::{ClampResult, MovementBounds};
use crate::process::{ProcessItem, ProcessService};
use crate::state::AppState;
use crate::system::SystemMetrics;
use crate::window::{DesktopWindowService, WindowPosition, WindowSize};

#[tauri::command]
pub fn get_monitors(app: AppHandle) -> Result<Vec<MonitorInfo>, String> {
    MonitorService::get_all_monitors(&app)
}

#[tauri::command]
pub fn get_current_monitor(app: AppHandle) -> Result<Option<MonitorInfo>, String> {
    MonitorService::get_current_monitor(&app)
}

#[tauri::command]
pub fn get_window_position(app: AppHandle, label: String) -> Result<WindowPosition, String> {
    DesktopWindowService::get_position(&app, &label)
}

#[tauri::command]
pub fn set_window_position(app: AppHandle, label: String, x: i32, y: i32) -> Result<(), String> {
    DesktopWindowService::set_position(&app, &label, x, y)
}

#[tauri::command]
pub fn get_window_size(app: AppHandle, label: String) -> Result<WindowSize, String> {
    DesktopWindowService::get_size(&app, &label)
}

#[tauri::command]
pub fn set_window_size(app: AppHandle, label: String, width: u32, height: u32) -> Result<(), String> {
    DesktopWindowService::set_size(&app, &label, width, height)
}

#[tauri::command]
pub fn set_always_on_top(app: AppHandle, label: String, on_top: bool) -> Result<(), String> {
    DesktopWindowService::set_always_on_top(&app, &label, on_top)
}

#[tauri::command]
pub fn set_click_through(app: AppHandle, label: String, ignore: bool) -> Result<(), String> {
    DesktopWindowService::set_click_through(&app, &label, ignore)
}

#[tauri::command]
pub fn show_window(app: AppHandle, label: String) -> Result<(), String> {
    DesktopWindowService::show(&app, &label)
}

#[tauri::command]
pub fn hide_window(app: AppHandle, label: String) -> Result<(), String> {
    DesktopWindowService::hide(&app, &label)
}

#[tauri::command]
pub fn start_dragging(app: AppHandle, label: String) -> Result<(), String> {
    DesktopWindowService::start_dragging(&app, &label)
}

#[tauri::command]
pub fn clamp_movement_target(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    monitors: Vec<MonitorInfo>,
) -> Result<ClampResult, String> {
    Ok(MovementBounds::clamp_to_monitors(x, y, width, height, &monitors))
}

#[tauri::command]
pub fn get_system_metrics(state: State<'_, AppState>) -> Result<SystemMetrics, String> {
    state.system.get_metrics()
}

#[tauri::command]
pub fn get_process_list(limit: Option<usize>) -> Result<Vec<ProcessItem>, String> {
    ProcessService::list_top_processes(limit.unwrap_or(20))
}

#[tauri::command]
pub fn get_git_info(path: Option<String>) -> Result<GitRepoInfo, String> {
    let p = path.unwrap_or_else(|| ".".to_string());
    GitService::get_info(&p)
}

#[tauri::command]
pub fn run_diagnostics(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<Vec<DiagnosticResult>, String> {
    Ok(DiagnosticsService::run_all(
        &app,
        &state.storage,
        &state.system,
    ))
}

#[tauri::command]
pub fn storage_get(key: String, state: State<'_, AppState>) -> Result<Option<String>, String> {
    state.storage.get_kv(&key)
}

#[tauri::command]
pub fn storage_set(
    key: String,
    value: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.storage.set_kv(&key, &value)
}

#[tauri::command]
pub fn storage_export(state: State<'_, AppState>) -> Result<String, String> {
    state.storage.export_backup()
}

#[tauri::command]
pub fn storage_import(json: String, state: State<'_, AppState>) -> Result<(), String> {
    state.storage.import_backup(&json)
}

#[tauri::command]
pub fn is_autostart_enabled() -> Result<bool, String> {
    Ok(crate::system::SystemService::is_autostart_enabled())
}

#[tauri::command]
pub fn set_autostart_enabled(enabled: bool) -> Result<(), String> {
    crate::system::SystemService::set_autostart_enabled(enabled)
}

#[tauri::command]
pub fn exit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub fn get_media_status() -> Result<crate::music::MediaStatus, String> {
    Ok(crate::music::MusicService::get_media_status())
}

#[tauri::command]
pub fn media_control(action: String) -> Result<(), String> {
    crate::music::MusicService::media_control(&action)
}

#[tauri::command]
pub fn list_local_lyrics() -> Result<Vec<crate::lyrics::LyricsFileInfo>, String> {
    crate::lyrics::LyricsService::list_local_lyrics()
}

#[tauri::command]
pub fn load_lrc_content(path: String) -> Result<String, String> {
    crate::lyrics::LyricsService::load_lrc_content(&path)
}

#[tauri::command]
pub fn send_test_notification(app_name: String, summary: String, body: String) -> Result<(), String> {
    crate::notifications::NotificationService::send_test_notification(&app_name, &summary, &body)
}

#[tauri::command]
pub fn get_linux_desktop_info() -> Result<crate::system::LinuxDesktopInfo, String> {
    Ok(crate::system::SystemService::get_linux_desktop_info())
}

#[tauri::command]
pub fn get_capabilities(app: AppHandle) -> Result<Vec<crate::capabilities::RuntimeCapability>, String> {
    Ok(crate::capabilities::CapabilityManager::detect_capabilities(&app))
}

#[tauri::command]
pub fn get_capability_by_id(app: AppHandle, id: String) -> Result<Option<crate::capabilities::RuntimeCapability>, String> {
    Ok(crate::capabilities::CapabilityManager::get_capability(&id, &app))
}

#[tauri::command]
pub fn get_capability_diagnostics(app: AppHandle) -> Result<crate::capabilities::CapabilityDiagnosticsReport, String> {
    Ok(crate::capabilities::CapabilityManager::get_diagnostics(&app))
}


