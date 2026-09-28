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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleAccountSession {
    pub email: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub is_authenticated: bool,
    pub auth_source: String,
    pub connected_at: String,
}

fn decode_base64_url(input: &str) -> Option<Vec<u8>> {
    let mut s = input.replace('-', "+").replace('_', "/");
    while s.len() % 4 != 0 {
        s.push('=');
    }
    const T: &[u8; 128] = &{
        let mut t = [64u8; 128];
        let mut i = 0u8;
        while i < 26 {
            t[(b'A' + i) as usize] = i;
            t[(b'a' + i) as usize] = i + 26;
            if i < 10 { t[(b'0' + i) as usize] = i + 52; }
            i += 1;
        }
        t[b'+' as usize] = 62;
        t[b'/' as usize] = 63;
        t
    };
    let bytes = s.as_bytes();
    let mut out = Vec::new();
    let mut i = 0;
    while i < bytes.len() {
        if i + 3 >= bytes.len() {
            break;
        }
        let b0 = *T.get(*bytes.get(i)? as usize)? as u32;
        let b1 = *T.get(*bytes.get(i+1)? as usize)? as u32;
        let b2 = if *bytes.get(i+2)? == b'=' { 0 } else { *T.get(*bytes.get(i+2)? as usize)? as u32 };
        let b3 = if *bytes.get(i+3)? == b'=' { 0 } else { *T.get(*bytes.get(i+3)? as usize)? as u32 };
        if b0 > 63 || b1 > 63 || (*bytes.get(i+2)? != b'=' && b2 > 63) || (*bytes.get(i+3)? != b'=' && b3 > 63) {
            return None;
        }
        let triple = (b0 << 18) | (b1 << 12) | (b2 << 6) | b3;
        out.push(((triple >> 16) & 0xFF) as u8);
        if *bytes.get(i+2)? != b'=' { out.push(((triple >> 8) & 0xFF) as u8); }
        if *bytes.get(i+3)? != b'=' { out.push((triple & 0xFF) as u8); }
        i += 4;
    }
    Some(out)
}

pub struct AiCliService;

impl AiCliService {
    pub fn probe_binary(name: &str) -> Option<String> {
        if let Ok(output) = Command::new("which").arg(name).output() {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    return Some(path);
                }
            }
        }
        // Direct fallback checks for standard user and system paths
        if let Ok(home) = std::env::var("HOME") {
            let user_bin = std::path::PathBuf::from(home).join(".local/bin").join(name);
            if user_bin.exists() {
                return Some(user_bin.to_string_lossy().to_string());
            }
        }
        for dir in &["/usr/local/bin", "/usr/bin", "/bin"] {
            let p = std::path::Path::new(dir).join(name);
            if p.exists() {
                return Some(p.to_string_lossy().to_string());
            }
        }
        None
    }

    pub fn get_version(name: &str) -> Option<String> {
        let bin_path = Self::probe_binary(name).unwrap_or_else(|| name.to_string());
        let mut cmd = Command::new(&bin_path);
        cmd.arg("--version");

        if let Ok(path) = std::env::var("PATH") {
            if let Ok(home) = std::env::var("HOME") {
                let local_bin = format!("{}/.local/bin", home);
                if !path.contains(&local_bin) {
                    cmd.env("PATH", format!("{}:{}", local_bin, path));
                }
            }
        }

        let output = cmd.output().ok()?;
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

    pub fn get_google_session() -> GoogleAccountSession {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        let token_path = std::path::PathBuf::from(&home).join(".gemini/antigravity-cli/antigravity-oauth-token");

        if token_path.exists() {
            if let Ok(content) = std::fs::read_to_string(&token_path) {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(id_token) = val.get("id_token").and_then(|v| v.as_str()) {
                        let parts: Vec<&str> = id_token.split('.').collect();
                        if parts.len() >= 2 {
                            if let Some(decoded_bytes) = decode_base64_url(parts[1]) {
                                if let Ok(claims) = serde_json::from_slice::<serde_json::Value>(&decoded_bytes) {
                                    let email = claims.get("email").and_then(|v| v.as_str()).unwrap_or("").to_string();
                                    let name = claims.get("name").and_then(|v| v.as_str()).unwrap_or("Google User").to_string();
                                    let picture = claims.get("picture").and_then(|v| v.as_str()).map(|s| s.to_string());

                                    if !email.is_empty() {
                                        return GoogleAccountSession {
                                            email,
                                            display_name: name,
                                            avatar_url: picture,
                                            is_authenticated: true,
                                            auth_source: "antigravity-oauth".to_string(),
                                            connected_at: chrono::Utc::now().to_rfc3339(),
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        GoogleAccountSession {
            email: String::new(),
            display_name: String::new(),
            avatar_url: None,
            is_authenticated: false,
            auth_source: "none".to_string(),
            connected_at: chrono::Utc::now().to_rfc3339(),
        }
    }

    pub fn detect_all() -> Vec<AiCliStatus> {
        let mut results = Vec::new();

        let google_oauth_exists = std::env::var("HOME")
            .ok()
            .map(|h| {
                let p1 = std::path::PathBuf::from(&h).join(".gemini/antigravity-cli/antigravity-oauth-token");
                let p2 = std::path::PathBuf::from(&h).join(".gemini/oauth_credentials.json");
                p1.exists() || p2.exists()
            })
            .unwrap_or(false);

        // 1. Gemini CLI
        let gemini_path = Self::probe_binary("gemini").or_else(|| {
            std::env::var("HOME").ok().map(|h| std::path::PathBuf::from(h).join(".local/bin/gemini")).and_then(|p| {
                if p.exists() {
                    Some(p.to_string_lossy().to_string())
                } else {
                    None
                }
            })
        });
        let gemini_ver = gemini_path.as_ref().and_then(|_| Self::get_version("gemini"));
        let gemini_installed = gemini_path.is_some();
        let gemini_auth = google_oauth_exists || std::env::var("GEMINI_API_KEY").is_ok();
        let gemini_status = if gemini_installed {
            if gemini_auth {
                "AUTHENTICATED".to_string()
            } else {
                "INSTALLED".to_string()
            }
        } else {
            "NOT_INSTALLED".to_string()
        };

        results.push(AiCliStatus {
            id: "gemini".to_string(),
            name: "Gemini CLI".to_string(),
            status: gemini_status,
            executable_path: gemini_path,
            version: gemini_ver,
            is_authenticated: gemini_auth,
            install_guidance: "Official Gemini CLI linked to Google account / Antigravity session.".to_string(),
            capabilities: vec![
                "gemini-3.8-flash".to_string(),
                "gemini-3.7-flash".to_string(),
                "gemini-2.0-flash-exp".to_string(),
                "chat".to_string(),
                "streaming".to_string(),
                "code_generation".to_string(),
                "google_oauth_session".to_string(),
            ],
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

        // 5. Antigravity CLI (AGY)
        let agy_path = Self::probe_binary("agy").or_else(|| {
            std::env::var("HOME").ok().map(|h| std::path::PathBuf::from(h).join(".local/bin/agy")).and_then(|p| {
                if p.exists() {
                    Some(p.to_string_lossy().to_string())
                } else {
                    None
                }
            })
        });
        let agy_ver = agy_path.as_ref().and_then(|_| Self::get_version("agy"));
        let agy_installed = agy_path.is_some();
        let agy_auth = std::env::var("HOME")
            .ok()
            .map(|h| std::path::PathBuf::from(h).join(".gemini/antigravity-cli/antigravity-oauth-token").exists())
            .unwrap_or(false);
        let agy_status = if agy_installed {
            if agy_auth {
                "AUTHENTICATED".to_string()
            } else {
                "INSTALLED".to_string()
            }
        } else {
            "NOT_INSTALLED".to_string()
        };
        results.push(AiCliStatus {
            id: "agy".to_string(),
            name: "Antigravity CLI (AGY)".to_string(),
            status: agy_status,
            executable_path: agy_path,
            version: agy_ver,
            is_authenticated: agy_auth,
            install_guidance: "Antigravity CLI (AGY) authenticated via active Google/Antigravity account.".to_string(),
            capabilities: vec![
                "gemini-3.8-flash".to_string(),
                "gemini-3.7-flash".to_string(),
                "claude-sonnet-4-6".to_string(),
                "gpt-oss-120b".to_string(),
                "google_oauth_session".to_string(),
                "streaming".to_string(),
            ],
        });

        results
    }

    pub fn execute_cli(
        provider: &str,
        args: &[&str],
        workspace: Option<&str>,
    ) -> Result<AiCliExecutionResult, String> {
        let binary_path = match provider {
            "gemini" => {
                Self::probe_binary("gemini").or_else(|| {
                    std::env::var("HOME").ok().map(|h| std::path::PathBuf::from(h).join(".local/bin/gemini")).and_then(|p| {
                        if p.exists() {
                            Some(p.to_string_lossy().to_string())
                        } else {
                            None
                        }
                    })
                }).unwrap_or_else(|| "gemini".to_string())
            }
            "codex" => "codex".to_string(),
            "claude" => "claude".to_string(),
            "ollama" => "ollama".to_string(),
            "agy" => {
                Self::probe_binary("agy").or_else(|| {
                    std::env::var("HOME").ok().map(|h| std::path::PathBuf::from(h).join(".local/bin/agy")).and_then(|p| {
                        if p.exists() {
                            Some(p.to_string_lossy().to_string())
                        } else {
                            None
                        }
                    })
                }).unwrap_or_else(|| "agy".to_string())
            }
            other => return Err(format!("Unsupported AI CLI provider: {}", other)),
        };

        if Self::probe_binary(&binary_path).is_none() && !std::path::Path::new(&binary_path).exists() {
            return Err(format!("Provider binary '{}' is not installed on this system.", binary_path));
        }

        let start = Instant::now();
        let mut cmd = Command::new(&binary_path);
        cmd.args(args);

        if let Ok(path) = std::env::var("PATH") {
            if let Ok(home) = std::env::var("HOME") {
                let local_bin = format!("{}/.local/bin", home);
                if !path.contains(&local_bin) {
                    cmd.env("PATH", format!("{}:{}", local_bin, path));
                }
            }
        }

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
            Err(e) => Err(format!("Failed to execute '{}': {}", binary_path, e)),
        }
    }
}
