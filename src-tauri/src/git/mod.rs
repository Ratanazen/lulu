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
}
