pub mod ai;
pub mod capabilities;
pub mod commands;
pub mod diagnostics;
pub mod git;
pub mod lyrics;
pub mod monitors;
pub mod movement;
pub mod music;
pub mod notifications;
pub mod process;
pub mod state;
pub mod storage;
pub mod system;
pub mod window;

use std::sync::Arc;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager};

use crate::commands::*;
use crate::state::AppState;
use crate::storage::StorageService;
use crate::system::SystemService;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));

            std::fs::create_dir_all(&app_data_dir).ok();
            let db_path = app_data_dir.join("lulu.db");

            let storage = Arc::new(
                StorageService::new(&db_path).unwrap_or_else(|e| {
                    eprintln!("Failed to initialize SQLite storage: {}", e);
                    // Fallback to in-memory db
                    StorageService::new(std::path::Path::new(":memory:")).expect("In-memory SQLite failed")
                }),
            );

            let system = Arc::new(SystemService::default());

            app.manage(AppState { storage, system });

            // Setup System Tray
            let show_i = MenuItem::with_id(app, "show", "Show Lulu", true, None::<&str>)?;
            let hide_i = MenuItem::with_id(app, "hide", "Hide Lulu", true, None::<&str>)?;
            let chat_i = MenuItem::with_id(app, "chat", "Open Chat", true, None::<&str>)?;
            let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit Lulu", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &hide_i, &chat_i, &settings_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.hide();
                        }
                    }
                    "chat" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                            let _ = win.emit("open-chat", ());
                        }
                    }
                    "settings" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                            let _ = win.emit("open-settings", ());
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Start background desktop notification listener
            crate::notifications::NotificationService::start_listener(app.handle().clone());

            // Auto-apply SwayFX window rules for 100% desktop transparency
            #[cfg(target_os = "linux")]
            {
                if std::env::var_os("SWAYSOCK").is_some() {
                    std::thread::spawn(|| {
                        std::thread::sleep(std::time::Duration::from_millis(150));
                        let _ = std::process::Command::new("swaymsg")
                            .arg("[app_id=\"lulu\"] blur disable, shadows disable, corner_radius 0")
                            .output();
                    });
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_monitors,
            get_current_monitor,
            get_window_position,
            set_window_position,
            get_window_size,
            set_window_size,
            set_always_on_top,
            set_click_through,
            show_window,
            hide_window,
            start_dragging,
            clamp_movement_target,
            get_system_metrics,
            get_host_hardware_info,
            get_process_list,
            get_git_info,
            run_diagnostics,
            storage_get,
            storage_set,
            storage_export,
            storage_import,
            is_autostart_enabled,
            set_autostart_enabled,
            exit_app,
            get_media_status,
            media_control,
            list_local_lyrics,
            load_lrc_content,
            send_test_notification,
            get_linux_desktop_info,
            get_capabilities,
            get_capability_by_id,
            get_capability_diagnostics,
            detect_ai_cli_providers,
            get_google_account_session,
            execute_ai_cli,
            get_extended_system_info,
            storage_get_all_settings,
            storage_set_setting,
            storage_get_setting,
            storage_set_settings_bulk,
            storage_get_conversations,
            storage_create_conversation,
            storage_delete_conversation,
            storage_get_messages,
            storage_save_message,
            storage_get_memories,
            storage_save_memory,
            storage_delete_memory,
            storage_get_game_scores,
            storage_save_game_record,
            storage_get_notifications,
            storage_save_notification,
            storage_get_achievements,
            storage_unlock_achievement,
            speak_native_text,
            stop_native_speech,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Lulu application");
}
