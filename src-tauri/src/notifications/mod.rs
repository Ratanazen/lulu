use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopNotificationEvent {
    pub id: String,
    pub app_name: String,
    pub app_icon: String,
    pub summary: String,
    pub body: String,
    pub timestamp: u64,
}

pub struct NotificationService;

impl NotificationService {
    /// Spawns a background listener monitoring Linux D-Bus notifications
    pub fn start_listener(app: AppHandle) {
        #[cfg(target_os = "linux")]
        {
            tokio::spawn(async move {
                Self::run_dbus_monitor(app).await;
            });
        }
    }

    #[cfg(target_os = "linux")]
    async fn run_dbus_monitor(app: AppHandle) {
        let mut child = match Command::new("dbus-monitor")
            .arg("--session")
            .arg("type='method_call',interface='org.freedesktop.Notifications',member='Notify'")
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
        {
            Ok(c) => c,
            Err(e) => {
                eprintln!("[NotificationService] Failed to spawn dbus-monitor: {}", e);
                return;
            }
        };

        if let Some(stdout) = child.stdout.take() {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();

            let mut in_notify = false;
            let mut string_idx = 0;
            let mut current_app = String::new();
            let mut current_icon = String::new();
            let mut current_summary = String::new();
            let mut current_body = String::new();

            while let Ok(Some(line)) = lines.next_line().await {
                let trimmed = line.trim();

                if trimmed.contains("member=Notify") {
                    in_notify = true;
                    string_idx = 0;
                    current_app.clear();
                    current_icon.clear();
                    current_summary.clear();
                    current_body.clear();
                    continue;
                }

                if in_notify && trimmed.starts_with("string \"") {
                    // Extract content inside string "..."
                    if let Some(first_quote) = trimmed.find('"') {
                        if let Some(last_quote) = trimmed.rfind('"') {
                            if last_quote > first_quote {
                                let val = &trimmed[first_quote + 1..last_quote];
                                match string_idx {
                                    0 => current_app = val.to_string(),
                                    1 => current_icon = val.to_string(),
                                    2 => current_summary = val.to_string(),
                                    3 => {
                                        current_body = val.to_string();
                                        in_notify = false;

                                        let now = std::time::SystemTime::now()
                                            .duration_since(std::time::UNIX_EPOCH)
                                            .unwrap_or_default()
                                            .as_millis() as u64;

                                        let event = DesktopNotificationEvent {
                                            id: format!("notif_{}", now),
                                            app_name: if current_app.is_empty() {
                                                "Desktop App".to_string()
                                            } else {
                                                current_app.clone()
                                            },
                                            app_icon: current_icon.clone(),
                                            summary: current_summary.clone(),
                                            body: current_body.clone(),
                                            timestamp: now,
                                        };

                                        let _ = app.emit("desktop-notification", event);
                                    }
                                    _ => {}
                                }
                                string_idx += 1;
                            }
                        }
                    }
                }
            }
        }
    }

    pub fn send_test_notification(app_name: &str, summary: &str, body: &str) -> Result<(), String> {
        #[cfg(target_os = "linux")]
        {
            let res = std::process::Command::new("notify-send")
                .arg(format!("[{}] {}", app_name, summary))
                .arg(body)
                .output();

            match res {
                Ok(_) => Ok(()),
                Err(e) => Err(format!("Failed to run notify-send: {}", e)),
            }
        }
        #[cfg(not(target_os = "linux"))]
        {
            Ok(())
        }
    }
}
