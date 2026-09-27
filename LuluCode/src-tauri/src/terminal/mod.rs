use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tokio::io::AsyncReadExt;
use tokio::process::Command;
use crate::security::{CommandSafety, SecurityManager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResult {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
    pub duration_ms: u64,
    pub timed_out: bool,
}

pub struct ProcessManager {
    running_processes: Arc<Mutex<HashMap<String, u32>>>, // process_id -> os_pid
}

impl ProcessManager {
    pub fn new() -> Self {
        Self {
            running_processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Execute a command in a given workspace with timeout and security screening.
    pub async fn execute_command(
        &self,
        command_id: &str,
        raw_cmd: &str,
        cwd: &Path,
        timeout_secs: Option<u64>,
    ) -> Result<CommandResult, String> {
        // 1. Security screening
        match SecurityManager::evaluate_command(raw_cmd) {
            CommandSafety::Forbidden(reason) => {
                return Err(format!("Command prohibited: {}", reason));
            }
            CommandSafety::NeedsConfirmation(reason) => {
                // Must have been explicitly approved by caller before invoking
                tracing::info!("Executing confirmed command: {} (Reason: {})", raw_cmd, reason);
            }
            CommandSafety::Safe => {}
        }

        let timeout_duration = Duration::from_secs(timeout_secs.unwrap_or(120));
        let start_time = Instant::now();

        // Detect shell
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string());

        let mut child = Command::new(&shell)
            .arg("-c")
            .arg(raw_cmd)
            .current_dir(cwd)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn process '{}': {}", raw_cmd, e))?;

        if let Some(pid) = child.id() {
            let mut procs = self.running_processes.lock().unwrap();
            procs.insert(command_id.to_string(), pid);
        }

        let stdout_pipe = child.stdout.take();
        let stderr_pipe = child.stderr.take();

        let running_procs = self.running_processes.clone();
        let cid = command_id.to_string();

        let execution = async move {
            let mut stdout_buf = Vec::new();
            let mut stderr_buf = Vec::new();

            if let Some(mut out) = stdout_pipe {
                let _ = out.read_to_end(&mut stdout_buf).await;
            }
            if let Some(mut err) = stderr_pipe {
                let _ = err.read_to_end(&mut stderr_buf).await;
            }

            let status = child.wait().await;
            (status, stdout_buf, stderr_buf)
        };

        match tokio::time::timeout(timeout_duration, execution).await {
            Ok((status, out_bytes, err_bytes)) => {
                let mut procs = running_procs.lock().unwrap();
                procs.remove(&cid);

                let duration_ms = start_time.elapsed().as_millis() as u64;
                let exit_code = status.map(|s| s.code().unwrap_or(-1)).unwrap_or(-1);
                let stdout = String::from_utf8_lossy(&out_bytes).to_string();
                let stderr = String::from_utf8_lossy(&err_bytes).to_string();

                Ok(CommandResult {
                    exit_code,
                    stdout: SecurityManager::redact_secrets(&stdout),
                    stderr: SecurityManager::redact_secrets(&stderr),
                    duration_ms,
                    timed_out: false,
                })
            }
            Err(_) => {
                // Timeout hit, kill process to prevent zombies
                self.kill_process(command_id);

                let duration_ms = start_time.elapsed().as_millis() as u64;
                Ok(CommandResult {
                    exit_code: -1,
                    stdout: String::new(),
                    stderr: format!("Command timed out after {} seconds.", timeout_duration.as_secs()),
                    duration_ms,
                    timed_out: true,
                })
            }
        }
    }

    /// Terminates a running child process by its command_id.
    pub fn kill_process(&self, command_id: &str) -> bool {
        let mut procs = self.running_processes.lock().unwrap();
        if let Some(pid) = procs.remove(command_id) {
            unsafe {
                libc::kill(pid as i32, libc::SIGTERM);
                // Give small grace period then SIGKILL if needed
                tokio::spawn(async move {
                    tokio::time::sleep(Duration::from_millis(500)).await;
                    libc::kill(pid as i32, libc::SIGKILL);
                });
            }
            return true;
        }
        false
    }

    /// Kills all remaining child processes during app shutdown.
    pub fn cleanup_all(&self) {
        let mut procs = self.running_processes.lock().unwrap();
        for (_cid, pid) in procs.drain() {
            unsafe {
                libc::kill(pid as i32, libc::SIGKILL);
            }
        }
    }
}

pub type SharedProcessManager = Arc<ProcessManager>;

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_execute_echo_command() {
        let mgr = ProcessManager::new();
        let cwd = std::env::current_dir().unwrap();
        let res = mgr.execute_command("cmd_1", "echo 'Hello Lulu'", &cwd, Some(5)).await.unwrap();

        assert_eq!(res.exit_code, 0);
        assert!(res.stdout.contains("Hello Lulu"));
        assert!(!res.timed_out);
    }

    #[tokio::test]
    async fn test_forbidden_command_blocked() {
        let mgr = ProcessManager::new();
        let cwd = std::env::current_dir().unwrap();
        let res = mgr.execute_command("cmd_bad", "rm -rf /", &cwd, Some(5)).await;

        assert!(res.is_err());
        assert!(res.unwrap_err().contains("Command prohibited"));
    }
}
