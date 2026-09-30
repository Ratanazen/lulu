use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

use crate::pet_storage::StorageManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationItem {
    pub id: String,
    pub app_name: String,
    pub title: String,
    pub body: Option<String>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationSettings {
    pub listener_enabled: bool,
    pub show_app_name: bool,
    pub show_title: bool,
    pub show_body: bool, // Default false for strict privacy
    pub sound: bool,
    pub privacy_mode: bool,
    pub cooldown_ms: u64,
}

impl Default for NotificationSettings {
    fn default() -> Self {
        Self {
            listener_enabled: true,
            show_app_name: true,
            show_title: true,
            show_body: false, // OFF by default per section 12 & 34
            sound: false,
            privacy_mode: true,
            cooldown_ms: 2000,
        }
    }
}

static LISTENER_RUNNING: AtomicBool = AtomicBool::new(false);

pub fn spawn_dbus_listener(app_handle: AppHandle, storage: Arc<StorageManager>) {
    if LISTENER_RUNNING.swap(true, Ordering::SeqCst) {
        return;
    }

    std::thread::spawn(move || {
        let child = Command::new("dbus-monitor")
            .args([
                "--session",
                "type='method_call',interface='org.freedesktop.Notifications',member='Notify'",
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn();

        let mut child = match child {
            Ok(c) => c,
            Err(e) => {
                eprintln!("[Lulu D-Bus Notifications] Failed to spawn dbus-monitor: {}", e);
                LISTENER_RUNNING.store(false, Ordering::SeqCst);
                return;
            }
        };

        if let Some(stdout) = child.stdout.take() {
            let reader = BufReader::new(stdout);
            let mut pending_app = String::new();
            let mut pending_title = String::new();
            let mut pending_body = String::new();
            let mut string_count = 0;
            let mut in_notify_block = false;

            for line in reader.lines() {
                let line = match line {
                    Ok(l) => l,
                    Err(_) => break,
                };

                let trimmed = line.trim();

                if trimmed.contains("member=Notify") {
                    in_notify_block = true;
                    string_count = 0;
                    pending_app.clear();
                    pending_title.clear();
                    pending_body.clear();
                    continue;
                }

                if in_notify_block && trimmed.starts_with("string \"") {
                    // Extract content inside string "..."
                    if let Some(start) = trimmed.find('"') {
                        if let Some(end) = trimmed.rfind('"') {
                            if end > start {
                                let val = &trimmed[start + 1..end];
                                match string_count {
                                    0 => pending_app = val.to_string(),
                                    1 => {} // icon
                                    2 => pending_title = val.to_string(),
                                    3 => {
                                        pending_body = val.to_string();
                                        // Once we have body, dispatch notification
                                        dispatch_notification(
                                            &app_handle,
                                            &storage,
                                            &pending_app,
                                            &pending_title,
                                            &pending_body,
                                        );
                                        in_notify_block = false;
                                    }
                                    _ => {}
                                }
                                string_count += 1;
                            }
                        }
                    }
                }
            }
        }

        LISTENER_RUNNING.store(false, Ordering::SeqCst);
    });
}

fn dispatch_notification(
    app_handle: &AppHandle,
    storage: &Arc<StorageManager>,
    app_name: &str,
    title: &str,
    body: &str,
) {
    let settings = storage.load_notification_settings().unwrap_or_default();
    if !settings.listener_enabled {
        return;
    }

    let clean_app = if app_name.is_empty() {
        "Unknown Application".to_string()
    } else {
        app_name.to_string()
    };

    let clean_title = if title.is_empty() {
        "Notification".to_string()
    } else {
        title.to_string()
    };

    let sanitized_body = if settings.show_body && !settings.privacy_mode {
        Some(body.to_string())
    } else {
        None
    };

    let item = NotificationItem {
        id: uuid::Uuid::new_v4().to_string(),
        app_name: clean_app,
        title: clean_title,
        body: sanitized_body,
        timestamp: chrono::Utc::now().timestamp(),
    };

    let _ = storage.save_notification(&item);
    let _ = app_handle.emit("notification:received", &item);
}

#[tauri::command]
pub fn get_notification_settings(
    storage: tauri::State<'_, Arc<StorageManager>>,
) -> Result<NotificationSettings, String> {
    storage.load_notification_settings()
}

#[tauri::command]
pub fn save_notification_settings(
    settings: NotificationSettings,
    storage: tauri::State<'_, Arc<StorageManager>>,
) -> Result<(), String> {
    storage.save_notification_settings(&settings)
}

#[tauri::command]
pub fn get_notification_history(
    limit: Option<usize>,
    storage: tauri::State<'_, Arc<StorageManager>>,
) -> Result<Vec<NotificationItem>, String> {
    storage.load_notification_history(limit.unwrap_or(20))
}

#[tauri::command]
pub fn clear_notification_history(
    storage: tauri::State<'_, Arc<StorageManager>>,
) -> Result<(), String> {
    storage.clear_notification_history()
}

#[tauri::command]
pub fn emit_test_notification(
    app_name: String,
    title: String,
    body: Option<String>,
    app_handle: AppHandle,
    storage: tauri::State<'_, Arc<StorageManager>>,
) -> Result<NotificationItem, String> {
    let item = NotificationItem {
        id: uuid::Uuid::new_v4().to_string(),
        app_name: if app_name.is_empty() { "TestApp".to_string() } else { app_name },
        title: if title.is_empty() { "Test Notification".to_string() } else { title },
        body,
        timestamp: chrono::Utc::now().timestamp(),
    };

    let _ = storage.save_notification(&item);
    let _ = app_handle.emit("notification:received", &item);
    Ok(item)
}
