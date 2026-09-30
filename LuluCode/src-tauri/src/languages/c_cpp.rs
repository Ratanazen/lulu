use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolItem {
    pub name: String,
    pub path: Option<String>,
    pub version: Option<String>,
    pub is_available: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CCppToolchainInfo {
    pub c_compiler: ToolItem,
    pub cpp_compiler: ToolItem,
    pub alt_c_compiler: ToolItem,
    pub alt_cpp_compiler: ToolItem,
    pub build_cmake: ToolItem,
    pub build_make: ToolItem,
    pub build_ninja: ToolItem,
    pub build_meson: ToolItem,
    pub debugger_gdb: ToolItem,
    pub debugger_lldb: ToolItem,
    pub formatter_clang_format: ToolItem,
    pub linter_clang_tidy: ToolItem,
    pub linter_cppcheck: ToolItem,
    pub default_standard: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CCppProjectDetails {
    pub is_cpp: bool,
    pub is_c: bool,
    pub build_system: String, // "CMake" | "Make" | "Meson" | "Ninja" | "CompileCommands" | "None"
    pub detected_standard: String, // "C++20", "C++17", "C++14", "C++11", "C99", "C11", "Unknown"
    pub build_command: String,
    pub test_command: String,
    pub has_clang_format: bool,
    pub has_compile_commands: bool,
}

pub struct CCppManager;

impl CCppManager {
    fn query_tool(binary_name: &str, version_arg: &str) -> ToolItem {
        let which_out = Command::new("which").arg(binary_name).output();
        let path = which_out.ok().and_then(|out| {
            if out.status.success() {
                Some(String::from_utf8_lossy(&out.stdout).trim().to_string())
            } else {
                None
            }
        });

        if let Some(p) = path {
            let ver_out = Command::new(&p).arg(version_arg).output();
            let version = ver_out.ok().and_then(|out| {
                if out.status.success() {
                    let text = String::from_utf8_lossy(&out.stdout);
                    text.lines().next().map(|l| l.trim().to_string())
                } else {
                    None
                }
            });

            ToolItem {
                name: binary_name.to_string(),
                path: Some(p),
                version,
                is_available: true,
            }
        } else {
            ToolItem {
                name: binary_name.to_string(),
                path: None,
                version: None,
                is_available: false,
            }
        }
    }

    pub fn probe_toolchain() -> CCppToolchainInfo {
        let gcc = Self::query_tool("gcc", "--version");
        let gpp = Self::query_tool("g++", "--version");
        let clang = Self::query_tool("clang", "--version");
        let clangpp = Self::query_tool("clang++", "--version");

        let cmake = Self::query_tool("cmake", "--version");
        let make = Self::query_tool("make", "--version");
        let ninja = Self::query_tool("ninja", "--version");
        let meson = Self::query_tool("meson", "--version");

        let gdb = Self::query_tool("gdb", "--version");
        let lldb = Self::query_tool("lldb", "--version");

        let clang_format = Self::query_tool("clang-format", "--version");
        let clang_tidy = Self::query_tool("clang-tidy", "--version");
        let cppcheck = Self::query_tool("cppcheck", "--version");

        // Primary vs Alt
        let (c_comp, alt_c) = if gcc.is_available { (gcc, clang) } else { (clang, gcc) };
        let (cpp_comp, alt_cpp) = if gpp.is_available { (gpp, clangpp) } else { (clangpp, gpp) };

        CCppToolchainInfo {
            c_compiler: c_comp,
            cpp_compiler: cpp_comp,
            alt_c_compiler: alt_c,
            alt_cpp_compiler: alt_cpp,
            build_cmake: cmake,
            build_make: make,
            build_ninja: ninja,
            build_meson: meson,
            debugger_gdb: gdb,
            debugger_lldb: lldb,
            formatter_clang_format: clang_format,
            linter_clang_tidy: clang_tidy,
            linter_cppcheck: cppcheck,
            default_standard: "C++20".to_string(),
        }
    }

    pub fn inspect_project(root: &Path) -> Option<CCppProjectDetails> {
        let mut has_cpp = false;
        let mut has_c = false;

        // Check root files and subdirectories for source files
        if let Ok(entries) = fs::read_dir(root) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.ends_with(".cpp") || name.ends_with(".cc") || name.ends_with(".cxx") || name.ends_with(".hpp") {
                    has_cpp = true;
                } else if name.ends_with(".c") || name.ends_with(".h") {
                    has_c = true;
                }
            }
        }

        let src_dir = root.join("src");
        if src_dir.exists() && src_dir.is_dir() {
            if let Ok(entries) = fs::read_dir(src_dir) {
                for entry in entries.flatten() {
                    let name = entry.file_name().to_string_lossy().to_string();
                    if name.ends_with(".cpp") || name.ends_with(".cc") || name.ends_with(".cxx") || name.ends_with(".hpp") {
                        has_cpp = true;
                    } else if name.ends_with(".c") || name.ends_with(".h") {
                        has_c = true;
                    }
                }
            }
        }

        let cmake_lists = root.join("CMakeLists.txt");
        let makefile = root.join("Makefile");
        let meson_build = root.join("meson.build");
        let compile_commands = root.join("compile_commands.json");
        let build_ninja = root.join("build.ninja");

        if !has_cpp && !has_c && !cmake_lists.exists() && !makefile.exists() && !meson_build.exists() && !compile_commands.exists() {
            return None;
        }

        let mut build_system = "None".to_string();
        let mut build_command = "make".to_string();
        let mut test_command = "make test".to_string();
        let mut detected_standard = if has_cpp { "C++17" } else { "C11" }.to_string();

        if compile_commands.exists() {
            build_system = "CompileCommands".to_string();
            build_command = "ninja -C build".to_string();
            test_command = "ctest --test-dir build".to_string();
        } else if cmake_lists.exists() {
            build_system = "CMake".to_string();
            build_command = "cmake -B build -S . && cmake --build build".to_string();
            test_command = "ctest --test-dir build --output-on-failure".to_string();

            // Detect standard from CMakeLists.txt
            if let Ok(content) = fs::read_to_string(&cmake_lists) {
                if content.contains("CMAKE_CXX_STANDARD 23") || content.contains("c++23") {
                    detected_standard = "C++23".to_string();
                } else if content.contains("CMAKE_CXX_STANDARD 20") || content.contains("c++20") {
                    detected_standard = "C++20".to_string();
                } else if content.contains("CMAKE_CXX_STANDARD 17") || content.contains("c++17") {
                    detected_standard = "C++17".to_string();
                } else if content.contains("CMAKE_CXX_STANDARD 14") || content.contains("c++14") {
                    detected_standard = "C++14".to_string();
                } else if content.contains("CMAKE_CXX_STANDARD 11") || content.contains("c++11") {
                    detected_standard = "C++11".to_string();
                }
            }
        } else if makefile.exists() {
            build_system = "Make".to_string();
            build_command = "make".to_string();
            test_command = "make test".to_string();

            if let Ok(content) = fs::read_to_string(&makefile) {
                if content.contains("-std=c++23") {
                    detected_standard = "C++23".to_string();
                } else if content.contains("-std=c++20") {
                    detected_standard = "C++20".to_string();
                } else if content.contains("-std=c++17") {
                    detected_standard = "C++17".to_string();
                }
            }
        } else if meson_build.exists() {
            build_system = "Meson".to_string();
            build_command = "meson setup build && ninja -C build".to_string();
            test_command = "meson test -C build".to_string();
        } else if build_ninja.exists() {
            build_system = "Ninja".to_string();
            build_command = "ninja".to_string();
            test_command = "ninja test".to_string();
        }

        Some(CCppProjectDetails {
            is_cpp: has_cpp || cmake_lists.exists(),
            is_c: has_c,
            build_system,
            detected_standard,
            build_command,
            test_command,
            has_clang_format: root.join(".clang-format").exists() || root.join("_clang-format").exists(),
            has_compile_commands: compile_commands.exists() || root.join("build/compile_commands.json").exists(),
        })
    }

    pub fn format_file(file_path: &Path) -> Result<String, String> {
        let which_out = Command::new("which").arg("clang-format").output();
        if which_out.map(|o| o.status.success()).unwrap_or(false) {
            let out = Command::new("clang-format")
                .arg(file_path)
                .output()
                .map_err(|e| format!("clang-format failed: {}", e))?;

            if out.status.success() {
                Ok(String::from_utf8_lossy(&out.stdout).to_string())
            } else {
                Err(String::from_utf8_lossy(&out.stderr).to_string())
            }
        } else {
            Err("clang-format is not installed on this system".to_string())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_toolchain_probe() {
        let tc = CCppManager::probe_toolchain();
        // Since test is running on host with gcc/g++/cmake, test should detect them
        assert!(tc.build_cmake.is_available);
        assert!(!tc.default_standard.is_empty());
    }

    #[test]
    fn test_inspect_non_c_project() {
        let temp = std::env::temp_dir();
        let res = CCppManager::inspect_project(&temp);
        // temp dir is likely not a C project
        if let Some(details) = res {
            assert!(!details.build_system.is_empty());
        }
    }
}
