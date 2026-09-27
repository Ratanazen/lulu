use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitRepoInfo {
    pub is_repo: bool,
    pub branch: String,
    pub is_clean: bool,
    pub last_commit_hash: String,
    pub last_commit_msg: String,
}

pub struct GitService;

impl GitService {
    pub fn get_info(path: &str) -> Result<GitRepoInfo, String> {
        let is_repo_check = Command::new("git")
            .args(["-C", path, "rev-parse", "--is-inside-work-tree"])
            .output();

        match is_repo_check {
            Ok(out) if out.status.success() => {
                // Get branch
                let branch_out = Command::new("git")
                    .args(["-C", path, "rev-parse", "--abbrev-ref", "HEAD"])
                    .output()
                    .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                    .unwrap_or_else(|_| "HEAD".to_string());

                // Check dirty
                let status_out = Command::new("git")
                    .args(["-C", path, "status", "--porcelain"])
                    .output()
                    .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                    .unwrap_or_default();
                let is_clean = status_out.is_empty();

                // Get last commit
                let log_out = Command::new("git")
                    .args(["-C", path, "log", "-1", "--format=%h||%s"])
                    .output()
                    .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                    .unwrap_or_default();

                let (hash, msg) = if let Some((h, m)) = log_out.split_once("||") {
                    (h.to_string(), m.to_string())
                } else {
                    ("none".to_string(), "No commits yet".to_string())
                };

                Ok(GitRepoInfo {
                    is_repo: true,
                    branch: branch_out,
                    is_clean,
                    last_commit_hash: hash,
                    last_commit_msg: msg,
                })
            }
            _ => Ok(GitRepoInfo {
                is_repo: false,
                branch: String::new(),
                is_clean: true,
                last_commit_hash: String::new(),
                last_commit_msg: String::new(),
            }),
        }
    }

    pub fn check_for_updates(path: &str) -> Result<UpdateCheckResult, String> {
        let repo_info = Self::get_info(path)?;
        if !repo_info.is_repo {
            return Ok(UpdateCheckResult {
                has_update: false,
                current_version: "0.1.0".to_string(),
                current_commit: "unknown".to_string(),
                remote_commit: "unknown".to_string(),
                commits_behind: 0,
                is_clean: true,
                status_message: "Not a git repository".to_string(),
            });
        }

        // Try git fetch with timeout
        let _ = Command::new("git")
            .args(["-C", path, "fetch", "--dry-run"])
            .output();

        let count_out = Command::new("git")
            .args(["-C", path, "rev-list", "--count", "HEAD..@{u}"])
            .output();

        let (behind, remote_hash) = match count_out {
            Ok(out) if out.status.success() => {
                let cnt_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
                let cnt: usize = cnt_str.parse().unwrap_or(0);

                let remote_rev = Command::new("git")
                    .args(["-C", path, "rev-parse", "--short", "@{u}"])
                    .output()
                    .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                    .unwrap_or_else(|_| "unknown".to_string());

                (cnt, remote_rev)
            }
            _ => (0, repo_info.last_commit_hash.clone()),
        };

        let has_update = behind > 0;
        let status_message = if has_update {
            format!("Update available: {} new commit(s) found upstream", behind)
        } else {
            "Lulu is up to date".to_string()
        };

        Ok(UpdateCheckResult {
            has_update,
            current_version: "0.1.0".to_string(),
            current_commit: repo_info.last_commit_hash,
            remote_commit: remote_hash,
            commits_behind: behind,
            is_clean: repo_info.is_clean,
            status_message,
        })
    }

    pub fn run_update_task(path: &str) -> Result<UpdateTaskResult, String> {
        let update_script = std::path::Path::new(path).join("scripts").join("update-app.mjs");
        if update_script.exists() {
            let out = Command::new("node")
                .arg(&update_script)
                .output()
                .map_err(|e| format!("Failed to spawn update script: {}", e))?;

            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let success = out.status.success();

            Ok(UpdateTaskResult {
                success,
                message: if success {
                    "Lulu successfully updated and reinstalled".to_string()
                } else {
                    format!("Update failed: {}", stderr)
                },
                output_log: format!("{}\n{}", stdout, stderr),
            })
        } else {
            let install_script = std::path::Path::new(path).join("scripts").join("install-desktop.mjs");
            let out = Command::new("node")
                .arg(&install_script)
                .output()
                .map_err(|e| format!("Failed to run install script: {}", e))?;

            Ok(UpdateTaskResult {
                success: out.status.success(),
                message: "Lulu desktop installed".to_string(),
                output_log: String::from_utf8_lossy(&out.stdout).to_string(),
            })
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResult {
    pub has_update: bool,
    pub current_version: String,
    pub current_commit: String,
    pub remote_commit: String,
    pub commits_behind: usize,
    pub is_clean: bool,
    pub status_message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskResult {
    pub success: bool,
    pub message: String,
    pub output_log: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_check_for_updates_non_repo() {
        let res = GitService::check_for_updates("/tmp");
        assert!(res.is_ok());
        let info = res.unwrap();
        assert_eq!(info.current_version, "0.1.0");
        assert_eq!(info.commits_behind, 0);
    }

    #[test]
    fn test_check_for_updates_current_repo() {
        let res = GitService::check_for_updates(".");
        assert!(res.is_ok());
        let info = res.unwrap();
        assert_eq!(info.current_version, "0.1.0");
        // We know we are inside a git repo
        assert!(!info.current_commit.is_empty());
    }
}

