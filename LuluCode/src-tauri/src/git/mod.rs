use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStatus {
    pub branch: String,
    pub staged_files: Vec<String>,
    pub unstaged_files: Vec<String>,
    pub untracked_files: Vec<String>,
    pub is_clean: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommitInfo {
    pub hash: String,
    pub message: String,
    pub author: String,
    pub timestamp: String,
}

pub struct GitManager;

impl GitManager {
    /// Get current branch and status of files.
    pub fn get_status(repo_path: &Path) -> Result<GitStatus, String> {
        let branch = Self::run_git(repo_path, &["rev-parse", "--abbrev-ref", "HEAD"])
            .unwrap_or_else(|_| "HEAD".to_string())
            .trim()
            .to_string();

        let status_out = Self::run_git(repo_path, &["status", "--porcelain"])?;

        let mut staged_files = Vec::new();
        let mut unstaged_files = Vec::new();
        let mut untracked_files = Vec::new();

        for line in status_out.lines() {
            if line.len() < 3 {
                continue;
            }
            let index_status = line.chars().next().unwrap_or(' ');
            let worktree_status = line.chars().nth(1).unwrap_or(' ');
            let file_name = line[3..].trim().to_string();

            if index_status == '?' && worktree_status == '?' {
                untracked_files.push(file_name);
            } else {
                if index_status != ' ' && index_status != '?' {
                    staged_files.push(file_name.clone());
                }
                if worktree_status != ' ' && worktree_status != '?' {
                    unstaged_files.push(file_name);
                }
            }
        }

        let is_clean = staged_files.is_empty() && unstaged_files.is_empty() && untracked_files.is_empty();

        Ok(GitStatus {
            branch,
            staged_files,
            unstaged_files,
            untracked_files,
            is_clean,
        })
    }

    /// Generate unified diff for git workspace.
    pub fn get_diff(repo_path: &Path, file_path: Option<&str>, staged: bool) -> Result<String, String> {
        let mut args = vec!["diff"];
        if staged {
            args.push("--cached");
        }
        if let Some(fp) = file_path {
            args.push("--");
            args.push(fp);
        }

        Self::run_git(repo_path, &args)
    }

    /// Create a git commit.
    pub fn commit(repo_path: &Path, message: &str, files_to_stage: Option<Vec<String>>) -> Result<String, String> {
        if let Some(files) = files_to_stage {
            for f in files {
                let _ = Self::run_git(repo_path, &["add", &f]);
            }
        }

        let out = Self::run_git(repo_path, &["commit", "-m", message])?;
        Ok(out)
    }

    /// Retrieve commit history.
    pub fn get_log(repo_path: &Path, count: usize) -> Result<Vec<GitCommitInfo>, String> {
        let count_str = format!("-n{}", count);
        let out = Self::run_git(repo_path, &["log", &count_str, "--pretty=format:%H|%s|%an|%cr"])?;

        let mut commits = Vec::new();
        for line in out.lines() {
            let parts: Vec<&str> = line.split('|').collect();
            if parts.len() >= 4 {
                commits.push(GitCommitInfo {
                    hash: parts[0].to_string(),
                    message: parts[1].to_string(),
                    author: parts[2].to_string(),
                    timestamp: parts[3].to_string(),
                });
            }
        }

        Ok(commits)
    }

    fn run_git(repo_path: &Path, args: &[&str]) -> Result<String, String> {
        let output = Command::new("git")
            .args(args)
            .current_dir(repo_path)
            .output()
            .map_err(|e| format!("Failed to execute git command: {}", e))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr).to_string();
            return Err(err);
        }

        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_git_status_current_repo() {
        let cwd = std::env::current_dir().unwrap();
        let status = GitManager::get_status(&cwd);
        assert!(status.is_ok());
    }
}
