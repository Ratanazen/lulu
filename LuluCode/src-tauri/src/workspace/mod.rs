use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use crate::languages::c_cpp::{CCppManager, CCppProjectDetails};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMetadata {
    pub name: String,
    pub path: String,
    pub language: String,
    pub build_tool: String,
    pub test_runner: String,
    pub is_git: bool,
    pub has_lulu_spec: bool,
    pub lulu_instructions: Option<String>,
    pub c_cpp_details: Option<CCppProjectDetails>,
}

pub struct WorkspaceDetector;

impl WorkspaceDetector {
    pub fn inspect_workspace(root: &Path) -> ProjectMetadata {
        let name = root
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("project")
            .to_string();
        
        let path = root.to_string_lossy().to_string();
        let is_git = root.join(".git").exists();

        // Check for LULU.md or .lulu/instructions.md
        let mut lulu_instructions = None;
        let mut has_lulu_spec = false;

        let lulu_md = root.join("LULU.md");
        let dot_lulu_inst = root.join(".lulu").join("instructions.md");

        if lulu_md.exists() {
            has_lulu_spec = true;
            lulu_instructions = fs::read_to_string(&lulu_md).ok();
        } else if dot_lulu_inst.exists() {
            has_lulu_spec = true;
            lulu_instructions = fs::read_to_string(&dot_lulu_inst).ok();
        }

        // C/C++ Inspection
        let c_cpp_details = CCppManager::inspect_project(root);

        // Framework / language detection
        let (language, build_tool, test_runner) = Self::detect_project_type(root, &c_cpp_details);

        ProjectMetadata {
            name,
            path,
            language,
            build_tool,
            test_runner,
            is_git,
            has_lulu_spec,
            lulu_instructions,
            c_cpp_details,
        }
    }

    fn detect_project_type(root: &Path, c_cpp: &Option<CCppProjectDetails>) -> (String, String, String) {
        // Rust
        if root.join("Cargo.toml").exists() {
            return ("Rust".into(), "cargo".into(), "cargo test".into());
        }

        // Node / TypeScript
        if root.join("package.json").exists() {
            let runner = if root.join("pnpm-lock.yaml").exists() {
                "pnpm test"
            } else if root.join("yarn.lock").exists() {
                "yarn test"
            } else if root.join("bun.lockb").exists() || root.join("bun.lock").exists() {
                "bun test"
            } else {
                "npm test"
            };
            return ("TypeScript/JavaScript".into(), "npm/pnpm".into(), runner.into());
        }

        // Python
        if root.join("pyproject.toml").exists() || root.join("requirements.txt").exists() || root.join("setup.py").exists() {
            return ("Python".into(), "pip/poetry".into(), "pytest".into());
        }

        // Go
        if root.join("go.mod").exists() {
            return ("Go".into(), "go build".into(), "go test ./...".into());
        }

        // C / C++
        if let Some(details) = c_cpp {
            return ("C/C++".into(), details.build_system.clone(), details.test_command.clone());
        }
        if root.join("CMakeLists.txt").exists() {
            return ("C/C++".into(), "cmake".into(), "ctest".into());
        }
        if root.join("Makefile").exists() {
            return ("C/C++".into(), "make".into(), "make test".into());
        }

        // Java / Kotlin
        if root.join("pom.xml").exists() {
            return ("Java".into(), "maven".into(), "mvn test".into());
        }
        if root.join("build.gradle").exists() || root.join("build.gradle.kts").exists() {
            return ("Java/Kotlin".into(), "gradle".into(), "./gradlew test".into());
        }

        // C# / .NET
        if Self::has_extension(root, "csproj") || Self::has_extension(root, "sln") {
            return ("C#/.NET".into(), "dotnet".into(), "dotnet test".into());
        }

        // Dart / Flutter
        if root.join("pubspec.yaml").exists() {
            return ("Dart/Flutter".into(), "flutter".into(), "flutter test".into());
        }

        // PHP
        if root.join("composer.json").exists() {
            return ("PHP".into(), "composer".into(), "composer test".into());
        }

        // Ruby
        if root.join("Gemfile").exists() {
            return ("Ruby".into(), "bundle".into(), "bundle exec rspec".into());
        }

        ("Generic".into(), "none".into(), "NO_TEST_RUNNER_DETECTED".into())
    }

    fn has_extension(dir: &Path, ext: &str) -> bool {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                if let Some(e) = entry.path().extension().and_then(|s| s.to_str()) {
                    if e.eq_ignore_ascii_case(ext) {
                        return true;
                    }
                }
            }
        }
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;

    #[test]
    fn test_rust_detection() {
        let temp = std::env::temp_dir().join("test_detect_rust");
        let _ = fs::create_dir_all(&temp);
        let _ = File::create(temp.join("Cargo.toml"));

        let meta = WorkspaceDetector::inspect_workspace(&temp);
        assert_eq!(meta.language, "Rust");
        assert_eq!(meta.test_runner, "cargo test");

        let _ = fs::remove_dir_all(temp);
    }

    #[test]
    fn test_python_detection() {
        let temp = std::env::temp_dir().join("test_detect_py");
        let _ = fs::create_dir_all(&temp);
        let _ = File::create(temp.join("requirements.txt"));

        let meta = WorkspaceDetector::inspect_workspace(&temp);
        assert_eq!(meta.language, "Python");
        assert_eq!(meta.test_runner, "pytest");

        let _ = fs::remove_dir_all(temp);
    }

    #[test]
    fn test_cpp_detection() {
        let temp = std::env::temp_dir().join("test_detect_cpp");
        let _ = fs::create_dir_all(&temp);
        let _ = File::create(temp.join("CMakeLists.txt"));

        let meta = WorkspaceDetector::inspect_workspace(&temp);
        assert_eq!(meta.language, "C/C++");
        assert!(meta.c_cpp_details.is_some());

        let _ = fs::remove_dir_all(temp);
    }
}
