use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use crate::security::SecurityManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: Option<u64>,
    pub children: Option<Vec<FileNode>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchMatch {
    pub file_path: String,
    pub line_number: usize,
    pub line_content: String,
}

pub struct FilesystemManager;

impl FilesystemManager {
    /// Read file contents with optional line slice.
    pub fn read_file(workspace: &Path, rel_path: &Path, start_line: Option<usize>, end_line: Option<usize>) -> Result<String, String> {
        let canonical = SecurityManager::validate_path(workspace, rel_path)?;
        let content = fs::read_to_string(&canonical).map_err(|e| format!("Failed to read file '{:?}': {}", canonical, e))?;

        if start_line.is_none() && end_line.is_none() {
            return Ok(content);
        }

        let lines: Vec<&str> = content.lines().collect();
        let total_lines = lines.len();

        let start = start_line.unwrap_or(1).saturating_sub(1);
        let end = end_line.unwrap_or(total_lines).min(total_lines);

        if start >= total_lines {
            return Ok(String::new());
        }

        let selected = lines[start..end].join("\n");
        Ok(selected)
    }

    /// Write file contents safely.
    pub fn write_file(workspace: &Path, rel_path: &Path, content: &str) -> Result<(), String> {
        let canonical = SecurityManager::validate_path(workspace, rel_path)?;
        if let Some(parent) = canonical.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("Cannot create parent directory: {}", e))?;
        }
        fs::write(&canonical, content).map_err(|e| format!("Failed to write file: {}", e))
    }

    /// Creates a new file.
    pub fn create_file(workspace: &Path, rel_path: &Path, initial_content: Option<&str>) -> Result<(), String> {
        let canonical = SecurityManager::validate_path(workspace, rel_path)?;
        if canonical.exists() {
            return Err("File already exists".to_string());
        }
        if let Some(parent) = canonical.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("Cannot create parent directories: {}", e))?;
        }
        fs::write(&canonical, initial_content.unwrap_or("")).map_err(|e| format!("Failed to create file: {}", e))
    }

    /// Creates a directory.
    pub fn create_dir(workspace: &Path, rel_path: &Path) -> Result<(), String> {
        let canonical = SecurityManager::validate_path(workspace, rel_path)?;
        fs::create_dir_all(&canonical).map_err(|e| format!("Failed to create directory: {}", e))
    }

    /// Deletes a file safely.
    pub fn delete_file(workspace: &Path, rel_path: &Path) -> Result<(), String> {
        let canonical = SecurityManager::validate_path(workspace, rel_path)?;
        
        // Never allow deleting root workspace directory
        let abs_workspace = workspace.canonicalize().map_err(|e| e.to_string())?;
        if canonical == abs_workspace {
            return Err("Cannot delete root workspace directory".to_string());
        }

        if canonical.is_dir() {
            fs::remove_dir_all(&canonical).map_err(|e| format!("Failed to delete directory: {}", e))
        } else {
            fs::remove_file(&canonical).map_err(|e| format!("Failed to delete file: {}", e))
        }
    }

    /// Applies patch after verifying target_content matches.
    pub fn apply_patch(
        workspace: &Path,
        rel_path: &Path,
        target_content: &str,
        replacement_content: &str,
    ) -> Result<String, String> {
        let canonical = SecurityManager::validate_path(workspace, rel_path)?;
        let current_content = fs::read_to_string(&canonical).map_err(|e| format!("Failed to read file for patching: {}", e))?;

        if !current_content.contains(target_content) {
            return Err("FILE_CHANGED_EXTERNALLY: Target content does not match current file contents.".to_string());
        }

        let occurrences = current_content.matches(target_content).count();
        if occurrences > 1 {
            return Err(format!("Ambiguous match: Target content found {} times in file. Provide more surrounding context.", occurrences));
        }

        let new_content = current_content.replace(target_content, replacement_content);
        fs::write(&canonical, &new_content).map_err(|e| format!("Failed to write patched file: {}", e))?;

        Ok(new_content)
    }

    /// Lists directory hierarchy for explorer view.
    pub fn list_directory(workspace: &Path, rel_path: Option<&Path>, max_depth: usize) -> Result<Vec<FileNode>, String> {
        let target_dir = match rel_path {
            Some(p) => SecurityManager::validate_path(workspace, p)?,
            None => workspace.to_path_buf(),
        };

        Self::walk_dir(&target_dir, workspace, 0, max_depth)
    }

    fn walk_dir(dir: &Path, root: &Path, current_depth: usize, max_depth: usize) -> Result<Vec<FileNode>, String> {
        let mut nodes = Vec::new();
        let entries = fs::read_dir(dir).map_err(|e| format!("Cannot read directory '{:?}': {}", dir, e))?;

        let ignored_dirs = [".git", "node_modules", "target", "dist", "build", ".venv", "__pycache__", ".turbo"];

        let mut sorted_entries: Vec<_> = entries.flatten().collect();
        sorted_entries.sort_by_key(|e| (
            !e.file_type().map(|ft| ft.is_dir()).unwrap_or(false),
            e.file_name(),
        ));

        for entry in sorted_entries {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            let is_dir = entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false);

            if is_dir && ignored_dirs.contains(&name.as_str()) {
                continue;
            }

            let rel_path = path.strip_prefix(root).unwrap_or(&path).to_string_lossy().to_string();

            if is_dir {
                let children = if current_depth < max_depth {
                    Some(Self::walk_dir(&path, root, current_depth + 1, max_depth)?)
                } else {
                    None
                };

                nodes.push(FileNode {
                    name,
                    path: rel_path,
                    is_dir: true,
                    size: None,
                    children,
                });
            } else {
                let size = entry.metadata().ok().map(|m| m.len());
                nodes.push(FileNode {
                    name,
                    path: rel_path,
                    is_dir: false,
                    size,
                    children: None,
                });
            }
        }

        Ok(nodes)
    }

    /// Search for text across files in workspace.
    pub fn search_text(workspace: &Path, query: &str, is_regex: bool) -> Result<Vec<SearchMatch>, String> {
        let mut results = Vec::new();
        let regex = if is_regex {
            Some(regex::Regex::new(query).map_err(|e| format!("Invalid regex: {}", e))?)
        } else {
            None
        };

        Self::search_dir_text(workspace, workspace, query, &regex, &mut results, 50)?;
        Ok(results)
    }

    fn search_dir_text(
        current_dir: &Path,
        root: &Path,
        query: &str,
        regex: &Option<regex::Regex>,
        results: &mut Vec<SearchMatch>,
        limit: usize,
    ) -> Result<(), String> {
        if results.len() >= limit {
            return Ok(());
        }

        let ignored_dirs = [".git", "node_modules", "target", "dist", "build", ".venv", "__pycache__"];
        let entries = match fs::read_dir(current_dir) {
            Ok(e) => e,
            Err(_) => return Ok(()),
        };

        for entry in entries.flatten() {
            if results.len() >= limit {
                break;
            }

            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            let is_dir = entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false);

            if is_dir {
                if !ignored_dirs.contains(&name.as_str()) {
                    let _ = Self::search_dir_text(&path, root, query, regex, results, limit);
                }
            } else {
                // Ignore large or binary files
                if let Ok(meta) = entry.metadata() {
                    if meta.len() > 1_000_000 {
                        continue;
                    }
                }

                if let Ok(content) = fs::read_to_string(&path) {
                    let rel_path = path.strip_prefix(root).unwrap_or(&path).to_string_lossy().to_string();
                    for (line_idx, line) in content.lines().enumerate() {
                        let is_match = match regex {
                            Some(re) => re.is_match(line),
                            None => line.contains(query),
                        };

                        if is_match {
                            results.push(SearchMatch {
                                file_path: rel_path.clone(),
                                line_number: line_idx + 1,
                                line_content: line.trim().to_string(),
                            });

                            if results.len() >= limit {
                                break;
                            }
                        }
                    }
                }
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_safe_read_write_patch() {
        let temp = std::env::temp_dir().join("test_fs_manager");
        let _ = fs::create_dir_all(&temp);

        let file_path = Path::new("test.txt");
        assert!(FilesystemManager::write_file(&temp, file_path, "Hello World\nLine 2").is_ok());

        let read = FilesystemManager::read_file(&temp, file_path, None, None).unwrap();
        assert_eq!(read, "Hello World\nLine 2");

        // Test safe patch
        let patched = FilesystemManager::apply_patch(&temp, file_path, "Hello World", "Hello Lulu").unwrap();
        assert_eq!(patched, "Hello Lulu\nLine 2");

        // Test external change mismatch
        let err = FilesystemManager::apply_patch(&temp, file_path, "Old Nonexistent String", "Replacement");
        assert!(err.is_err());
        assert!(err.unwrap_err().contains("FILE_CHANGED_EXTERNALLY"));

        let _ = fs::remove_dir_all(temp);
    }
}
