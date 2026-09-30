use std::path::Path;
use tauri::State;
use serde::{Deserialize, Serialize};

use crate::ai::{AiChatRequest, AiChatResponse, AiProviderManager, OllamaStatus};
use crate::config::{ConfigManager, LuluAppConfig};
use crate::database::{DbMessage, DbProject, DbTask, SharedDatabaseManager};
use crate::diagnostics::{Diagnostic, DiagnosticParser};
use crate::filesystem::{FileNode, FilesystemManager, SearchMatch};
use crate::git::{GitCommitInfo, GitManager, GitStatus};
use crate::languages::c_cpp::{CCppManager, CCppProjectDetails, CCppToolchainInfo};
use crate::permissions::{PermissionLevel, SharedPermissionCenter};
use crate::system::{ComprehensiveSystemInfo, SystemEngine};
use crate::terminal::{CommandResult, SharedProcessManager};
use crate::workspace::{ProjectMetadata, WorkspaceDetector};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareInfo {
    pub cpu_count: usize,
    pub total_memory_mb: u64,
    pub os: String,
    pub is_low_spec: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceSummary {
    pub mode: String,
    pub target_fps: u32,
    pub power_saving: bool,
}

pub struct AppState {
    pub db: SharedDatabaseManager,
    pub permissions: SharedPermissionCenter,
    pub process_mgr: SharedProcessManager,
}

#[tauri::command]
pub async fn open_workspace(path: String, state: State<'_, AppState>) -> Result<ProjectMetadata, String> {
    let root = Path::new(&path);
    if !root.exists() || !root.is_dir() {
        return Err(format!("Directory does not exist: {}", path));
    }

    let meta = WorkspaceDetector::inspect_workspace(root);
    let p = DbProject {
        id: uuid::Uuid::new_v4().to_string(),
        name: meta.name.clone(),
        path: meta.path.clone(),
        detected_type: meta.language.clone(),
        build_tool: Some(meta.build_tool.clone()),
        test_runner: Some(meta.test_runner.clone()),
        last_opened_at: "".into(),
    };
    let _ = state.db.save_project(&p);

    Ok(meta)
}

#[tauri::command]
pub fn detect_project(path: String) -> Result<ProjectMetadata, String> {
    let root = Path::new(&path);
    if !root.exists() {
        return Err("Path does not exist".to_string());
    }
    Ok(WorkspaceDetector::inspect_workspace(root))
}

#[tauri::command]
pub fn read_file(
    workspace: String,
    path: String,
    start_line: Option<usize>,
    end_line: Option<usize>,
) -> Result<String, String> {
    FilesystemManager::read_file(Path::new(&workspace), Path::new(&path), start_line, end_line)
}

#[tauri::command]
pub fn write_file(workspace: String, path: String, content: String) -> Result<(), String> {
    FilesystemManager::write_file(Path::new(&workspace), Path::new(&path), &content)
}

#[tauri::command]
pub fn apply_patch(
    workspace: String,
    path: String,
    target_content: String,
    replacement_content: String,
) -> Result<String, String> {
    FilesystemManager::apply_patch(
        Path::new(&workspace),
        Path::new(&path),
        &target_content,
        &replacement_content,
    )
}

#[tauri::command]
pub fn create_file(workspace: String, path: String, content: Option<String>) -> Result<(), String> {
    FilesystemManager::create_file(Path::new(&workspace), Path::new(&path), content.as_deref())
}

#[tauri::command]
pub fn create_directory(workspace: String, path: String) -> Result<(), String> {
    FilesystemManager::create_dir(Path::new(&workspace), Path::new(&path))
}

#[tauri::command]
pub fn delete_file(workspace: String, path: String) -> Result<(), String> {
    FilesystemManager::delete_file(Path::new(&workspace), Path::new(&path))
}

#[tauri::command]
pub fn list_directory(
    workspace: String,
    path: Option<String>,
    max_depth: Option<usize>,
) -> Result<Vec<FileNode>, String> {
    let rel = path.as_deref().map(Path::new);
    FilesystemManager::list_directory(Path::new(&workspace), rel, max_depth.unwrap_or(4))
}

#[tauri::command]
pub fn search_text(
    workspace: String,
    query: String,
    is_regex: Option<bool>,
) -> Result<Vec<SearchMatch>, String> {
    FilesystemManager::search_text(Path::new(&workspace), &query, is_regex.unwrap_or(false))
}

#[tauri::command]
pub async fn run_process(
    command_id: String,
    command: String,
    cwd: String,
    timeout_secs: Option<u64>,
    state: State<'_, AppState>,
) -> Result<CommandResult, String> {
    state
        .process_mgr
        .execute_command(&command_id, &command, Path::new(&cwd), timeout_secs)
        .await
}

#[tauri::command]
pub fn stop_process(command_id: String, state: State<'_, AppState>) -> Result<bool, String> {
    Ok(state.process_mgr.kill_process(&command_id))
}

#[tauri::command]
pub fn git_status(repo_path: String) -> Result<GitStatus, String> {
    GitManager::get_status(Path::new(&repo_path))
}

#[tauri::command]
pub fn git_diff(
    repo_path: String,
    file_path: Option<String>,
    staged: Option<bool>,
) -> Result<String, String> {
    GitManager::get_diff(Path::new(&repo_path), file_path.as_deref(), staged.unwrap_or(false))
}

#[tauri::command]
pub fn git_commit(
    repo_path: String,
    message: String,
    files: Option<Vec<String>>,
) -> Result<String, String> {
    GitManager::commit(Path::new(&repo_path), &message, files)
}

#[tauri::command]
pub fn git_log(repo_path: String, count: Option<usize>) -> Result<Vec<GitCommitInfo>, String> {
    GitManager::get_log(Path::new(&repo_path), count.unwrap_or(20))
}

#[tauri::command]
pub fn get_diagnostics(output: String) -> Result<Vec<Diagnostic>, String> {
    Ok(DiagnosticParser::parse_output(&output))
}

#[tauri::command]
pub fn get_hardware_info() -> Result<HardwareInfo, String> {
    let mut sys = sysinfo::System::new_all();
    sys.refresh_all();

    let cpu_count = sys.cpus().len();
    let total_memory_mb = sys.total_memory() / 1024 / 1024;
    let is_low_spec = total_memory_mb <= 8192 || cpu_count <= 4;

    Ok(HardwareInfo {
        cpu_count,
        total_memory_mb,
        os: "Linux".into(),
        is_low_spec,
    })
}

#[tauri::command]
pub fn get_performance_config() -> Result<PerformanceSummary, String> {
    Ok(PerformanceSummary {
        mode: "AUTO".into(),
        target_fps: 30,
        power_saving: false,
    })
}

#[tauri::command]
pub async fn detect_ollama(endpoint: Option<String>) -> Result<OllamaStatus, String> {
    Ok(AiProviderManager::detect_ollama(endpoint.as_deref()).await)
}

#[tauri::command]
pub async fn chat_ai(request: AiChatRequest) -> Result<AiChatResponse, String> {
    AiProviderManager::chat(request).await
}

#[tauri::command]
pub fn get_tasks(project_id: Option<String>, state: State<'_, AppState>) -> Result<Vec<DbTask>, String> {
    state.db.list_tasks(project_id.as_deref())
}

#[tauri::command]
pub fn save_task(task: DbTask, state: State<'_, AppState>) -> Result<(), String> {
    state.db.save_task(&task)
}

#[tauri::command]
pub fn get_messages(task_id: String, state: State<'_, AppState>) -> Result<Vec<DbMessage>, String> {
    state.db.list_messages(&task_id)
}

#[tauri::command]
pub fn save_message(message: DbMessage, state: State<'_, AppState>) -> Result<(), String> {
    state.db.save_message(&message)
}

#[tauri::command]
pub fn get_permission_level(state: State<'_, AppState>) -> Result<PermissionLevel, String> {
    Ok(state.permissions.get_level())
}

#[tauri::command]
pub fn set_permission_level(level: PermissionLevel, state: State<'_, AppState>) -> Result<(), String> {
    state.permissions.set_level(level);
    Ok(())
}

#[tauri::command]
pub async fn test_ai_connection(request: AiChatRequest) -> Result<String, String> {
    AiProviderManager::test_connection(request).await
}

#[tauri::command]
pub fn copy_to_clipboard(text: String) -> Result<(), String> {
    // 1. Wayland wl-copy (ideal for Sway / Wayland)
    if std::env::var("WAYLAND_DISPLAY").is_ok() || std::path::Path::new("/usr/bin/wl-copy").exists() {
        if let Ok(mut child) = std::process::Command::new("wl-copy")
            .stdin(std::process::Stdio::piped())
            .spawn()
        {
            use std::io::Write;
            if let Some(mut stdin) = child.stdin.take() {
                let _ = stdin.write_all(text.as_bytes());
            }
            if let Ok(status) = child.wait() {
                if status.success() {
                    return Ok(());
                }
            }
        }
    }

    // 2. X11 xclip
    if std::path::Path::new("/usr/bin/xclip").exists() {
        if let Ok(mut child) = std::process::Command::new("xclip")
            .args(["-selection", "clipboard"])
            .stdin(std::process::Stdio::piped())
            .spawn()
        {
            use std::io::Write;
            if let Some(mut stdin) = child.stdin.take() {
                let _ = stdin.write_all(text.as_bytes());
            }
            if let Ok(status) = child.wait() {
                if status.success() {
                    return Ok(());
                }
            }
        }
    }

    // 3. X11 xsel
    if std::path::Path::new("/usr/bin/xsel").exists() {
        if let Ok(mut child) = std::process::Command::new("xsel")
            .args(["--clipboard", "--input"])
            .stdin(std::process::Stdio::piped())
            .spawn()
        {
            use std::io::Write;
            if let Some(mut stdin) = child.stdin.take() {
                let _ = stdin.write_all(text.as_bytes());
            }
            if let Ok(status) = child.wait() {
                if status.success() {
                    return Ok(());
                }
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_system_info() -> Result<ComprehensiveSystemInfo, String> {
    Ok(SystemEngine::probe_full())
}

#[tauri::command]
pub fn get_system_report() -> Result<String, String> {
    let info = SystemEngine::probe_full();
    Ok(SystemEngine::generate_report(&info))
}

#[tauri::command]
pub fn get_c_cpp_toolchain() -> Result<CCppToolchainInfo, String> {
    Ok(CCppManager::probe_toolchain())
}

#[tauri::command]
pub fn detect_c_cpp_project(path: String) -> Result<Option<CCppProjectDetails>, String> {
    Ok(CCppManager::inspect_project(Path::new(&path)))
}

#[tauri::command]
pub fn format_c_cpp_file(path: String) -> Result<String, String> {
    CCppManager::format_file(Path::new(&path))
}

#[tauri::command]
pub fn get_app_config() -> Result<LuluAppConfig, String> {
    Ok(ConfigManager::load_or_default())
}

#[tauri::command]
pub fn save_app_config(config: LuluAppConfig) -> Result<(), String> {
    ConfigManager::save(&config)
}

