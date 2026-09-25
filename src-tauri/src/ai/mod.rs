use serde::{Deserialize, Serialize};
use std::process::Command;
use std::net::{SocketAddr, TcpStream};
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiCliStatus {
    pub id: String,
    pub name: String,
    pub status: String, // INSTALLED, NOT_INSTALLED, AUTHENTICATED, NOT_AUTHENTICATED, RUNNING, ERROR
    pub executable_path: Option<String>,
    pub version: Option<String>,
    pub is_authenticated: bool,
    pub install_guidance: String,
    pub capabilities: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiCliExecutionResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
    pub execution_time_ms: u64,
}

pub struct AiCliService;

impl AiCliService {
    pub fn probe_binary(name: &str) -> Option<String> {
        let output = Command::new("which").arg(name).output().ok()?;
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return Some(path);
            }
        }
        None
    }

    pub fn get_version(name: &str) -> Option<String> {
        let output = Command::new(name).arg("--version").output().ok()?;
        if output.status.success() {
            let ver = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !ver.is_empty() {
                return Some(ver);
            }
            let err = String::from_utf8_lossy(&output.stderr).trim().to_string();
            if !err.is_empty() {
                return Some(err);
            }
        }
        None
    }

    pub fn probe_ollama_server() -> bool {
        let addr: Result<SocketAddr, _> = "127.0.0.1:11434".parse();
        match addr {
            Ok(sa) => TcpStream::connect_timeout(&sa, Duration::from_millis(250)).is_ok(),
            Err(_) => false,
        }
    }

    pub fn detect_all() -> Vec<AiCliStatus> {
        let mut results = Vec::new();

        // 1. Gemini CLI
        let gemini_path = Self::probe_binary("gemini");
        let gemini_ver = gemini_path.as_ref().and_then(|_| Self::get_version("gemini"));
        let gemini_installed = gemini_path.is_some();
        results.push(AiCliStatus {
            id: "gemini".to_string(),
            name: "Gemini CLI".to_string(),
            status: if gemini_installed { "INSTALLED".to_string() } else { "NOT_INSTALLED".to_string() },
            executable_path: gemini_path,
            version: gemini_ver,
            is_authenticated: false,
            install_guidance: "Install official Gemini CLI via `npm install -g @google/gemini-cli` or Google Cloud SDK.".to_string(),
            capabilities: vec!["chat".to_string(), "streaming".to_string(), "code_generation".to_string()],
        });

        // 2. Codex CLI
        let codex_path = Self::probe_binary("codex");
        let codex_ver = codex_path.as_ref().and_then(|_| Self::get_version("codex"));
        let codex_installed = codex_path.is_some();
        results.push(AiCliStatus {
            id: "codex".to_string(),
            name: "Codex CLI".to_string(),
            status: if codex_installed { "INSTALLED".to_string() } else { "NOT_INSTALLED".to_string() },
            executable_path: codex_path,
            version: codex_ver,
            is_authenticated: false,
            install_guidance: "Install OpenAI Codex CLI tool via official package manager or binary download.".to_string(),
            capabilities: vec!["code_generation".to_string(), "refactoring".to_string(), "terminal_tasks".to_string()],
        });

        // 3. Claude CLI
        let claude_path = Self::probe_binary("claude");
        let claude_ver = claude_path.as_ref().and_then(|_| Self::get_version("claude"));
        let claude_installed = claude_path.is_some();
        results.push(AiCliStatus {
            id: "claude".to_string(),
            name: "Claude CLI".to_string(),
            status: if claude_installed { "INSTALLED".to_string() } else { "NOT_INSTALLED".to_string() },
            executable_path: claude_path,
            version: claude_ver,
            is_authenticated: false,
            install_guidance: "Install Claude Code CLI via `npm install -g @anthropic-ai/claude-code`.".to_string(),
            capabilities: vec!["chat".to_string(), "code_editing".to_string(), "planning".to_string()],
        });

        // 4. Ollama
        let ollama_path = Self::probe_binary("ollama");
        let ollama_ver = ollama_path.as_ref().and_then(|_| Self::get_version("ollama"));
        let ollama_running = Self::probe_ollama_server();
        let ollama_status = if ollama_running {
            "RUNNING"
        } else if ollama_path.is_some() {
            "NOT_RUNNING"
        } else {
            "NOT_INSTALLED"
        };
        results.push(AiCliStatus {
            id: "ollama".to_string(),
            name: "Ollama (Local AI)".to_string(),
            status: ollama_status.to_string(),
            executable_path: ollama_path,
            version: ollama_ver,
            is_authenticated: true,
            install_guidance: "Install local Ollama runner via `curl -fsSL https://ollama.com/install.sh | sh`.".to_string(),
            capabilities: vec!["offline".to_string(), "local_models".to_string(), "streaming".to_string(), "zero_telemetry".to_string()],
        });

        results
    }

    pub fn execute_cli(
        provider: &str,
        args: &[&str],
        workspace: Option<&str>,
    ) -> Result<AiCliExecutionResult, String> {
        let binary = match provider {
            "gemini" => "gemini",
            "codex" => "codex",
            "claude" => "claude",
            "ollama" => "ollama",
            other => return Err(format!("Unsupported AI CLI provider: {}", other)),
        };

        if Self::probe_binary(binary).is_none() {
            return Err(format!("Provider binary '{}' is not installed on this system.", binary));
        }

        let start = Instant::now();
        let mut cmd = Command::new(binary);
        cmd.args(args);

        if let Some(ws) = workspace {
            // Validate workspace exists and is a directory
            let path = std::path::Path::new(ws);
            if path.is_dir() {
                cmd.current_dir(path);
            }
        }

        match cmd.output() {
            Ok(output) => {
                let duration = start.elapsed().as_millis() as u64;
                Ok(AiCliExecutionResult {
                    success: output.status.success(),
                    stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                    stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                    exit_code: output.status.code(),
                    execution_time_ms: duration,
                })
            }
            Err(e) => Err(format!("Failed to execute '{}': {}", binary, e)),
        }
    }
}
