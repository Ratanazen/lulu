pub mod cache;
pub mod capabilities;
pub mod commands;
pub mod config;
pub mod diagnostics;
pub mod doctor;
pub mod lyrics;
pub mod media;
pub mod monitors;
pub mod music;
pub mod notifications;
pub mod pet_storage;
pub mod system;
pub mod terminal;
pub mod window;

use pet_storage::StorageManager;
use std::sync::Arc;

pub fn run() {
    let storage = match StorageManager::new() {
        Ok(s) => Arc::new(s),
        Err(e) => {
            eprintln!("Fatal error: Failed to init SQLite storage: {}", e);
            panic!("Cannot run Lulu without SQLite database: {}", e);
        }
    };

    let storage_for_setup = storage.clone();

    tauri::Builder::default()
        .manage(storage)
        .setup(move |app| {
            // Spawn native Linux D-Bus notification monitor
            notifications::spawn_dbus_listener(app.handle().clone(), storage_for_setup);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Window Native Controls
            window::get_window_position,
            window::set_window_position,
            window::get_cursor_position,
            window::get_window_size,
            window::set_window_size,
            window::set_always_on_top,
            window::set_ignore_cursor_events,
            window::show_window,
            window::focus_window,
            window::start_dragging,
            window::hide_window,
            window::exit_app,

            // Monitors Native Probes
            monitors::get_monitors,
            monitors::get_primary_monitor,
            monitors::move_to_monitor,
            monitors::move_to_workspace,

            // Pet Persistence & State
            pet_storage::get_pet_preferences,
            pet_storage::save_pet_preferences,
            pet_storage::get_pet_needs_mood,
            pet_storage::save_pet_needs_mood,
            pet_storage::get_pet_position,
            pet_storage::save_pet_position,
            pet_storage::export_user_data,
            pet_storage::import_user_data,

            // Linux Notifications (D-Bus)
            notifications::get_notification_settings,
            notifications::save_notification_settings,
            notifications::get_notification_history,
            notifications::clear_notification_history,
            notifications::emit_test_notification,

            // Media & Streaming Sessions
            media::get_media_session,
            media::list_media_providers,

            // Music / MPRIS
            music::get_music_status,
            music::music_play_pause,
            music::music_next,
            music::music_previous,

            // Local & Remote LRC Lyrics
            lyrics::list_local_lyrics,
            lyrics::read_lyrics_file,
            lyrics::save_lyrics_file,
            lyrics::delete_lyrics_file,
            lyrics::fetch_remote_lyrics,

            // Cache Management
            cache::get_cache_status,
            cache::clear_cache,

            // Diagnostics & Capability Matrix
            capabilities::get_capabilities,
            doctor::run_lulu_doctor,

            // Lightweight System Probes
            commands::get_hardware_info,
            commands::get_performance_config,
            commands::copy_to_clipboard,
            system::get_system_info,
            system::get_system_report,
        ])
        .build(tauri::generate_context!())
        .expect("error while running lulu companion")
        .run(|_app_handle, _event| {});
}
