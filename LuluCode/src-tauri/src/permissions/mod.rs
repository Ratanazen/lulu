use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PermissionLevel {
    ReadOnly,
    SafeEdit,
    FullEdit,
    CommandConfirm,
    Autonomous,
}

impl Default for PermissionLevel {
    fn default() -> Self {
        PermissionLevel::SafeEdit
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PermissionAction {
    AllowOnce,
    AllowForTask,
    AllowForProject,
    Deny,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionRule {
    pub id: String,
    pub scope: String, // e.g. "run_command:cargo test", "write_file:src/auth.rs"
    pub level: PermissionLevel,
    pub action: PermissionAction,
    pub task_id: Option<String>,
    pub project_id: Option<String>,
}

pub struct PermissionCenter {
    default_level: Mutex<PermissionLevel>,
    project_rules: Mutex<HashMap<String, Vec<PermissionRule>>>, // project_id -> rules
    task_rules: Mutex<HashMap<String, Vec<PermissionRule>>>,    // task_id -> rules
}

impl PermissionCenter {
    pub fn new(default_level: PermissionLevel) -> Self {
        Self {
            default_level: Mutex::new(default_level),
            project_rules: Mutex::new(HashMap::new()),
            task_rules: Mutex::new(HashMap::new()),
        }
    }

    pub fn get_level(&self) -> PermissionLevel {
        *self.default_level.lock().unwrap()
    }

    pub fn set_level(&self, level: PermissionLevel) {
        let mut l = self.default_level.lock().unwrap();
        *l = level;
    }

    pub fn grant_rule(&self, rule: PermissionRule) {
        if let Some(ref proj_id) = rule.project_id {
            let mut p_rules = self.project_rules.lock().unwrap();
            p_rules.entry(proj_id.clone()).or_default().push(rule.clone());
        }
        if let Some(ref task_id) = rule.task_id {
            let mut t_rules = self.task_rules.lock().unwrap();
            t_rules.entry(task_id.clone()).or_default().push(rule);
        }
    }

    /// Evaluates if an operation requires user confirmation or is allowed.
    pub fn check_permission(
        &self,
        tool_name: &str,
        operation_target: &str,
        project_id: Option<&str>,
        task_id: Option<&str>,
    ) -> Result<bool, String> {
        let level = self.get_level();

        // 1. Check task-specific whitelist
        if let Some(tid) = task_id {
            let t_rules = self.task_rules.lock().unwrap();
            if let Some(rules) = t_rules.get(tid) {
                for r in rules {
                    if r.scope == format!("{}:{}", tool_name, operation_target) || r.scope == tool_name {
                        if r.action == PermissionAction::Deny {
                            return Err(format!("Operation '{}:{}' explicitly denied for this task", tool_name, operation_target));
                        }
                        return Ok(true);
                    }
                }
            }
        }

        // 2. Check project-specific whitelist
        if let Some(pid) = project_id {
            let p_rules = self.project_rules.lock().unwrap();
            if let Some(rules) = p_rules.get(pid) {
                for r in rules {
                    if r.scope == format!("{}:{}", tool_name, operation_target) || r.scope == tool_name {
                        if r.action == PermissionAction::Deny {
                            return Err(format!("Operation '{}:{}' explicitly denied for this project", tool_name, operation_target));
                        }
                        return Ok(true);
                    }
                }
            }
        }

        // 3. Fallback to global permission level
        match level {
            PermissionLevel::ReadOnly => {
                let read_tools = ["read_file", "list_directory", "search_files", "search_text", "git_status", "git_diff", "git_log", "git_branch"];
                if read_tools.contains(&tool_name) {
                    Ok(true)
                } else {
                    Err(format!("Permission denied: System is in READ_ONLY mode. Tool '{}' is blocked.", tool_name))
                }
            }
            PermissionLevel::SafeEdit => {
                let safe_tools = [
                    "read_file", "list_directory", "search_files", "search_text",
                    "git_status", "git_diff", "git_log", "git_branch",
                    "edit_file", "write_file", "create_file", "run_tests",
                ];
                if safe_tools.contains(&tool_name) {
                    Ok(true)
                } else {
                    // run_command, delete_file, git_commit require confirmation
                    Ok(false)
                }
            }
            PermissionLevel::FullEdit => {
                if tool_name == "delete_file" || tool_name == "run_command" {
                    Ok(false) // Still confirm destructive commands
                } else {
                    Ok(true)
                }
            }
            PermissionLevel::CommandConfirm => {
                if tool_name == "run_command" {
                    Ok(false)
                } else {
                    Ok(true)
                }
            }
            PermissionLevel::Autonomous => {
                // Allows safe tools and non-forbidden commands
                Ok(true)
            }
        }
    }
}

pub type SharedPermissionCenter = Arc<PermissionCenter>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_read_only_level() {
        let center = PermissionCenter::new(PermissionLevel::ReadOnly);
        assert_eq!(center.check_permission("read_file", "src/main.rs", None, None), Ok(true));
        assert!(center.check_permission("write_file", "src/main.rs", None, None).is_err());
        assert!(center.check_permission("run_command", "cargo test", None, None).is_err());
    }

    #[test]
    fn test_safe_edit_level() {
        let center = PermissionCenter::new(PermissionLevel::SafeEdit);
        assert_eq!(center.check_permission("read_file", "src/main.rs", None, None), Ok(true));
        assert_eq!(center.check_permission("edit_file", "src/main.rs", None, None), Ok(true));
        // run_command requires confirmation
        assert_eq!(center.check_permission("run_command", "cargo build", None, None), Ok(false));
    }

    #[test]
    fn test_task_whitelist_override() {
        let center = PermissionCenter::new(PermissionLevel::SafeEdit);
        center.grant_rule(PermissionRule {
            id: "1".into(),
            scope: "run_command:cargo test".into(),
            level: PermissionLevel::SafeEdit,
            action: PermissionAction::AllowForTask,
            task_id: Some("task_123".into()),
            project_id: None,
        });

        // Now for task_123, run_command with cargo test is allowed without confirmation
        assert_eq!(
            center.check_permission("run_command", "cargo test", None, Some("task_123")),
            Ok(true)
        );
        // Another command for task_123 still needs confirmation
        assert_eq!(
            center.check_permission("run_command", "npm install", None, Some("task_123")),
            Ok(false)
        );
    }
}
