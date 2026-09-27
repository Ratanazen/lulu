pub mod agent;
pub mod ai;
pub mod commands;
pub mod database;
pub mod diagnostics;
pub mod filesystem;
pub mod git;
pub mod permissions;
pub mod security;
pub mod terminal;
pub mod workspace;

use commands::AppState;
use database::DatabaseManager;
use permissions::{PermissionCenter, PermissionLevel};
use std::path::PathBuf;
use std::sync::Arc;
use terminal::ProcessManager;

pub fn run() {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".into());
    let db_path = PathBuf::from(home).join(".local/share/lulu-code/lulu_code.db");

    let db = match DatabaseManager::init(&db_path) {
        Ok(d) => Arc::new(d),
        Err(e) => {
            eprintln!("Warning: Failed to init file DB ({}), using in-memory: ", e);
            Arc::new(DatabaseManager::in_memory().expect("in memory db failed"))
        }
    };

    let permissions = Arc::new(PermissionCenter::new(PermissionLevel::SafeEdit));
    let process_mgr = Arc::new(ProcessManager::new());

    let state = AppState {
        db,
        permissions,
        process_mgr: process_mgr.clone(),
    };

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::open_workspace,
            commands::detect_project,
            commands::read_file,
            commands::write_file,
            commands::apply_patch,
            commands::create_file,
            commands::create_directory,
            commands::delete_file,
            commands::list_directory,
            commands::search_text,
            commands::run_process,
            commands::stop_process,
            commands::git_status,
            commands::git_diff,
            commands::git_commit,
            commands::git_log,
            commands::get_diagnostics,
            commands::get_hardware_info,
            commands::get_performance_config,
            commands::detect_ollama,
            commands::chat_ai,
            commands::get_tasks,
            commands::save_task,
            commands::get_messages,
            commands::save_message,
            commands::get_permission_level,
            commands::set_permission_level,
            commands::test_ai_connection,
            commands::copy_to_clipboard,
        ])
        .build(tauri::generate_context!())
        .expect("error while running lulu code application")
        .run(move |_app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                process_mgr.cleanup_all();
            }
        });
}
