use tauri::{AppHandle, State};

use crate::diagnostics::{DiagnosticResult, DiagnosticsService};
use crate::git::{GitRepoInfo, GitService};
use crate::monitors::{MonitorInfo, MonitorService};
use crate::movement::{ClampResult, MovementBounds};
use crate::process::{ProcessItem, ProcessService};
use crate::state::AppState;
use crate::system::SystemMetrics;
use crate::window::{DesktopWindowService, WindowPosition, WindowSize};
use crate::storage::{ConversationRecord, MessageRecord, MemoryRecord, GameHighScore, NotificationRecord, AchievementRecord};

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
pub fn get_host_hardware_info(state: State<'_, AppState>) -> Result<crate::system::HostHardwareInfo, String> {
    state.system.get_host_hardware_info()
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

#[tauri::command]
pub fn get_google_account_session() -> Result<crate::ai::GoogleAccountSession, String> {
    Ok(crate::ai::AiCliService::get_google_session())
}

#[tauri::command]
pub fn detect_ai_cli_providers() -> Result<Vec<crate::ai::AiCliStatus>, String> {
    Ok(crate::ai::AiCliService::detect_all())
}

#[tauri::command]
pub fn execute_ai_cli(
    provider: String,
    prompt: String,
    workspace: Option<String>,
) -> Result<crate::ai::AiCliExecutionResult, String> {
    crate::ai::AiCliService::execute_cli(&provider, &[&prompt], workspace.as_deref())
}

#[tauri::command]
pub fn get_extended_system_info() -> Result<crate::system::ExtendedSystemInfo, String> {
    Ok(crate::system::SystemService::get_extended_info())
}#[tauri::command]
pub fn storage_get_all_settings(state: State<'_, AppState>) -> Result<Vec<(String, String)>, String> {
    state.storage.get_all_settings()
}

#[tauri::command]
pub fn storage_set_setting(key: String, value: String, state: State<'_, AppState>) -> Result<(), String> {
    state.storage.set_setting(&key, &value)
}

#[tauri::command]
pub fn storage_get_setting(key: String, state: State<'_, AppState>) -> Result<Option<String>, String> {
    state.storage.get_setting(&key)
}

#[tauri::command]
pub fn storage_set_settings_bulk(settings: Vec<(String, String)>, state: State<'_, AppState>) -> Result<(), String> {
    state.storage.set_settings_bulk(&settings)
}

#[tauri::command]
pub fn storage_get_conversations(limit: usize, offset: usize, state: State<'_, AppState>) -> Result<Vec<ConversationRecord>, String> {
    state.storage.get_conversations(limit, offset)
}

#[tauri::command]
pub fn storage_create_conversation(id: String, title: String, provider_id: String, model: String, state: State<'_, AppState>) -> Result<(), String> {
    state.storage.create_conversation(&id, &title, &provider_id, &model)
}

#[tauri::command]
pub fn storage_delete_conversation(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.storage.delete_conversation(&id)
}

#[tauri::command]
pub fn storage_get_messages(conversation_id: String, limit: usize, state: State<'_, AppState>) -> Result<Vec<MessageRecord>, String> {
    state.storage.get_messages(&conversation_id, limit)
}

#[tauri::command]
pub fn storage_save_message(id: String, conversation_id: String, role: String, content: String, tool_calls_json: String, state: State<'_, AppState>) -> Result<(), String> {
    state.storage.save_message(&id, &conversation_id, &role, &content, &tool_calls_json)
}

#[tauri::command]
pub fn storage_get_memories(search: Option<String>, category: Option<String>, state: State<'_, AppState>) -> Result<Vec<MemoryRecord>, String> {
    state.storage.get_memories(search.as_deref(), category.as_deref())
}

#[tauri::command]
pub fn storage_save_memory(id: String, title: String, content: String, category: String, importance: i32, user_defined: bool, state: State<'_, AppState>) -> Result<(), String> {
    state.storage.save_memory(&id, &title, &content, &category, importance, user_defined)
}

#[tauri::command]
pub fn storage_delete_memory(id: String, state: State<'_, AppState>) -> Result<(), String> {
    state.storage.delete_memory(&id)
}

#[tauri::command]
pub fn storage_get_game_scores(state: State<'_, AppState>) -> Result<Vec<GameHighScore>, String> {
    state.storage.get_game_high_scores()
}

#[tauri::command]
pub fn storage_save_game_record(game_id: String, score: i64, state: State<'_, AppState>) -> Result<(), String> {
    state.storage.save_game_record(&game_id, score)
}

#[tauri::command]
pub fn storage_get_notifications(limit: usize, state: State<'_, AppState>) -> Result<Vec<NotificationRecord>, String> {
    state.storage.get_recent_notifications(limit)
}

#[tauri::command]
pub fn storage_save_notification(id: String, app_name: String, title: String, body: String, icon: String, state: State<'_, AppState>) -> Result<(), String> {
    state.storage.save_notification(&id, &app_name, &title, &body, &icon)
}

#[tauri::command]
pub fn storage_get_achievements(state: State<'_, AppState>) -> Result<Vec<AchievementRecord>, String> {
    state.storage.get_achievements()
}

#[tauri::command]
pub fn storage_unlock_achievement(id: String, progress: i64, state: State<'_, AppState>) -> Result<(), String> {
    state.storage.unlock_achievement(&id, progress)
}

#[tauri::command]
pub fn speak_native_text(
    text: String,
    rate: Option<u32>,
    pitch: Option<u32>,
    volume: Option<u32>,
) -> Result<bool, String> {
    let binary = if std::path::Path::new("/usr/bin/espeak-ng").exists() {
        "/usr/bin/espeak-ng"
    } else if std::path::Path::new("/usr/bin/espeak").exists() {
        "/usr/bin/espeak"
    } else {
        return Ok(false);
    };

    let mut cmd = std::process::Command::new(binary);
    if let Some(r) = rate {
        cmd.arg("-s").arg(r.to_string());
    }
    if let Some(p) = pitch {
        cmd.arg("-p").arg(p.to_string());
    }
    if let Some(v) = volume {
        cmd.arg("-a").arg(v.to_string());
    }
    cmd.arg(&text);

    std::thread::spawn(move || {
        let _ = cmd.output();
    });

    Ok(true)
}

#[tauri::command]
pub fn stop_native_speech() -> Result<(), String> {
    let _ = std::process::Command::new("killall")
        .arg("-q")
        .arg("espeak-ng")
        .output();
    let _ = std::process::Command::new("killall")
        .arg("-q")
        .arg("espeak")
        .output();
    Ok(())
}

#[tauri::command]
pub fn get_hardware_info(state: State<'_, AppState>) -> Result<crate::performance::HardwareInfo, String> {
    Ok(state.performance.get_hardware_info())
}

#[tauri::command]
pub fn get_performance_config(state: State<'_, AppState>) -> Result<crate::performance::PerformanceConfig, String> {
    Ok(state.performance.get_performance_config())
}

#[tauri::command]
pub fn set_performance_config(
    app: AppHandle,
    state: State<'_, AppState>,
    config: crate::performance::PerformanceConfig,
) -> Result<(), String> {
    state.performance.set_performance_config(config, Some(&app))
}

#[tauri::command]
pub fn get_performance_profile(
    state: State<'_, AppState>,
    mode: String,
) -> Result<crate::performance::PerformanceConfig, String> {
    Ok(state.performance.get_performance_profile(&mode))
}

#[tauri::command]
pub fn apply_performance_profile(
    app: AppHandle,
    state: State<'_, AppState>,
    mode: String,
) -> Result<crate::performance::PerformanceConfig, String> {
    state.performance.apply_performance_profile(&mode, Some(&app))
}

#[tauri::command]
pub fn get_runtime_performance(
    state: State<'_, AppState>,
) -> Result<crate::performance::RuntimePerformance, String> {
    Ok(state.performance.get_runtime_performance())
}

#[tauri::command]
pub fn reset_performance_config(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<crate::performance::PerformanceConfig, String> {
    state.performance.reset_performance_config(Some(&app))
}

#[tauri::command]
pub fn detect_display_environment(
    state: State<'_, AppState>,
) -> Result<crate::performance::detector::DetectedDisplayInfo, String> {
    Ok(state.performance.get_hardware_info().display)
}

#[tauri::command]
pub fn get_power_state(
    state: State<'_, AppState>,
) -> Result<crate::performance::PowerState, String> {
    Ok(state.performance.get_power_state())
}

#[tauri::command]
pub fn check_for_updates(path: Option<String>) -> Result<crate::git::UpdateCheckResult, String> {
    let p = path.unwrap_or_else(|| ".".to_string());
    crate::git::GitService::check_for_updates(&p)
}

#[tauri::command]
pub fn run_update_task(path: Option<String>, full: Option<bool>) -> Result<crate::git::UpdateTaskResult, String> {
    let p = path.unwrap_or_else(|| ".".to_string());
    crate::git::GitService::run_update_task(&p, full.unwrap_or(false))
}



