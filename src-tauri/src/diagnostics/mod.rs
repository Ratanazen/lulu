use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Diagnostic {
    pub file: String,
    pub line: usize,
    pub column: usize,
    pub severity: String, // "error" | "warning" | "info"
    pub message: String,
    pub source: String,   // "rustc" | "tsc" | "pytest" | "gcc" | "clang" | "cmake" | "make" | "linker"
}

pub struct DiagnosticParser;

impl DiagnosticParser {
    pub fn parse_output(output: &str) -> Vec<Diagnostic> {
        let mut diagnostics = Vec::new();

        // 1. GCC / Clang / Clang++ errors and warnings:
        // src/main.cpp:42:15: error: 'vector' was not declared in this scope
        // include/player.hpp:10:5: warning: unused variable 'hp' [-Wunused-variable]
        let gcc_re = Regex::new(r"^([^\s:(]+):(\d+):(\d+):\s*(fatal error|error|warning|note):\s*(.*)").unwrap();
        for line in output.lines() {
            let trimmed = line.trim();
            if let Some(caps) = gcc_re.captures(trimmed) {
                let file = caps.get(1).unwrap().as_str().to_string();
                let line_num: usize = caps.get(2).unwrap().as_str().parse().unwrap_or(1);
                let col_num: usize = caps.get(3).unwrap().as_str().parse().unwrap_or(1);
                let sev_str = caps.get(4).unwrap().as_str();
                let severity = if sev_str.contains("error") {
                    "error".to_string()
                } else if sev_str == "warning" {
                    "warning".to_string()
                } else {
                    "info".to_string()
                };
                let message = caps.get(5).unwrap().as_str().to_string();

                diagnostics.push(Diagnostic {
                    file,
                    line: line_num,
                    column: col_num,
                    severity,
                    message,
                    source: "gcc/clang".to_string(),
                });
            }
        }

        // 2. CMake error pattern:
        // CMake Error at CMakeLists.txt:24 (add_executable):
        let cmake_re = Regex::new(r"CMake Error at ([^\s:]+):(\d+)\s*\(([^)]+)\):\s*(.*)").unwrap();
        let cmake_simple_re = Regex::new(r"CMake Error at ([^\s:]+):(\d+)").unwrap();
        for (i, line) in output.lines().enumerate() {
            let trimmed = line.trim();
            if let Some(caps) = cmake_re.captures(trimmed) {
                let file = caps.get(1).unwrap().as_str().to_string();
                let line_num: usize = caps.get(2).unwrap().as_str().parse().unwrap_or(1);
                let msg = format!("{}: {}", caps.get(3).unwrap().as_str(), caps.get(4).unwrap().as_str());

                diagnostics.push(Diagnostic {
                    file,
                    line: line_num,
                    column: 1,
                    severity: "error".to_string(),
                    message: msg,
                    source: "cmake".to_string(),
                });
            } else if let Some(caps) = cmake_simple_re.captures(trimmed) {
                let file = caps.get(1).unwrap().as_str().to_string();
                let line_num: usize = caps.get(2).unwrap().as_str().parse().unwrap_or(1);
                let next_msg = output.lines().nth(i + 1).unwrap_or("CMake configuration failed").trim();

                diagnostics.push(Diagnostic {
                    file,
                    line: line_num,
                    column: 1,
                    severity: "error".to_string(),
                    message: next_msg.to_string(),
                    source: "cmake".to_string(),
                });
            }
        }

        // 3. Make error pattern:
        // Makefile:14: *** missing separator.  Stop.
        let make_re = Regex::new(r"^([^\s:]*(?:Makefile|[^\s:]+\.mk)):(\d+):\s*\*\*\*\s*(.*)").unwrap();
        for line in output.lines() {
            if let Some(caps) = make_re.captures(line.trim()) {
                diagnostics.push(Diagnostic {
                    file: caps.get(1).unwrap().as_str().to_string(),
                    line: caps.get(2).unwrap().as_str().parse().unwrap_or(1),
                    column: 1,
                    severity: "error".to_string(),
                    message: caps.get(3).unwrap().as_str().to_string(),
                    source: "make".to_string(),
                });
            }
        }

        // 4. Linker error pattern:
        // undefined reference to `Player::takeDamage(int)'
        // /usr/bin/ld: cannot find -lboost_system: No such file or directory
        let ld_re = Regex::new(r"(?:/usr/bin/ld|lld|mold|collect2):\s*(error:\s*)?(.*)").unwrap();
        let undef_re = Regex::new(r"undefined reference to `([^']+)'").unwrap();
        for line in output.lines() {
            let trimmed = line.trim();
            if let Some(caps) = undef_re.captures(trimmed) {
                diagnostics.push(Diagnostic {
                    file: "linker".to_string(),
                    line: 1,
                    column: 1,
                    severity: "error".to_string(),
                    message: format!("Undefined reference to '{}'", caps.get(1).unwrap().as_str()),
                    source: "linker".to_string(),
                });
            } else if let Some(caps) = ld_re.captures(trimmed) {
                diagnostics.push(Diagnostic {
                    file: "linker".to_string(),
                    line: 1,
                    column: 1,
                    severity: "error".to_string(),
                    message: caps.get(2).unwrap().as_str().to_string(),
                    source: "linker".to_string(),
                });
            }
        }

        // 5. Rust compiler pattern:
        // error[E0308]: mismatched types
        //   --> src/main.rs:14:5
        let rust_loc_re = Regex::new(r"-->\s+([^\s:]+):(\d+):(\d+)").unwrap();
        let rust_err_re = Regex::new(r"^(error|warning)(\[[A-Za-z0-9]+\])?:\s+(.*)").unwrap();

        let lines: Vec<&str> = output.lines().collect();
        for (i, line) in lines.iter().enumerate() {
            if let Some(loc_caps) = rust_loc_re.captures(line) {
                let file = loc_caps.get(1).unwrap().as_str().to_string();
                let line_num: usize = loc_caps.get(2).unwrap().as_str().parse().unwrap_or(1);
                let col_num: usize = loc_caps.get(3).unwrap().as_str().parse().unwrap_or(1);

                let mut message = "Compilation issue".to_string();
                let mut severity = "error".to_string();
                for prev in lines[..i].iter().rev().take(3) {
                    if let Some(err_caps) = rust_err_re.captures(prev.trim()) {
                        severity = err_caps.get(1).unwrap().as_str().to_string();
                        message = err_caps.get(3).unwrap().as_str().to_string();
                        break;
                    }
                }

                diagnostics.push(Diagnostic {
                    file,
                    line: line_num,
                    column: col_num,
                    severity,
                    message,
                    source: "rustc".to_string(),
                });
            }
        }

        // 6. TypeScript / tsc pattern:
        let ts_re = Regex::new(r"([^\s:(]+)[:\(](\d+)[:,](\d+)\)?\s*-\s*(error|warning)\s+([A-Z0-9]+):\s+(.*)").unwrap();
        for line in &lines {
            if let Some(caps) = ts_re.captures(line) {
                diagnostics.push(Diagnostic {
                    file: caps.get(1).unwrap().as_str().to_string(),
                    line: caps.get(2).unwrap().as_str().parse().unwrap_or(1),
                    column: caps.get(3).unwrap().as_str().parse().unwrap_or(1),
                    severity: caps.get(4).unwrap().as_str().to_string(),
                    message: format!("{}: {}", caps.get(5).unwrap().as_str(), caps.get(6).unwrap().as_str()),
                    source: "tsc".to_string(),
                });
            }
        }

        // 7. Python traceback / pytest pattern:
        let py_re = Regex::new(r#"File "([^"]+)", line (\d+)(?:, in (.*))?"#).unwrap();
        for (i, line) in lines.iter().enumerate() {
            if let Some(caps) = py_re.captures(line) {
                let file = caps.get(1).unwrap().as_str().to_string();
                let line_num: usize = caps.get(2).unwrap().as_str().parse().unwrap_or(1);
                let next_msg = lines.get(i + 2).or_else(|| lines.get(i + 1)).map(|s| s.trim()).unwrap_or("Test failure");

                diagnostics.push(Diagnostic {
                    file,
                    line: line_num,
                    column: 1,
                    severity: "error".to_string(),
                    message: next_msg.to_string(),
                    source: "pytest".to_string(),
                });
            }
        }

        diagnostics
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_rust_error() {
        let sample = r#"
error[E0308]: mismatched types
  --> src/main.rs:14:5
   |
14 |     true
   |     ^^^^ expected `()`, found `bool`
"#;
        let diags = DiagnosticParser::parse_output(sample);
        assert_eq!(diags.len(), 1);
        assert_eq!(diags[0].file, "src/main.rs");
        assert_eq!(diags[0].line, 14);
        assert_eq!(diags[0].column, 5);
        assert_eq!(diags[0].severity, "error");
        assert_eq!(diags[0].source, "rustc");
    }

    #[test]
    fn test_parse_tsc_error() {
        let sample = "src/app/App.tsx:12:3 - error TS2322: Type 'string' is not assignable to type 'number'.";
        let diags = DiagnosticParser::parse_output(sample);
        assert_eq!(diags.len(), 1);
        assert_eq!(diags[0].file, "src/app/App.tsx");
        assert_eq!(diags[0].line, 12);
        assert_eq!(diags[0].source, "tsc");
    }

    #[test]
    fn test_parse_gcc_cpp_error() {
        let sample = "src/main.cpp:42:15: error: 'vector' was not declared in this scope\ninclude/player.hpp:10:5: warning: unused variable 'hp' [-Wunused-variable]";
        let diags = DiagnosticParser::parse_output(sample);
        assert_eq!(diags.len(), 2);
        assert_eq!(diags[0].file, "src/main.cpp");
        assert_eq!(diags[0].line, 42);
        assert_eq!(diags[0].column, 15);
        assert_eq!(diags[0].severity, "error");
        assert!(diags[0].message.contains("vector"));

        assert_eq!(diags[1].file, "include/player.hpp");
        assert_eq!(diags[1].line, 10);
        assert_eq!(diags[1].severity, "warning");
    }

    #[test]
    fn test_parse_cmake_error() {
        let sample = "CMake Error at CMakeLists.txt:24 (add_executable): Cannot find source file: main.cpp";
        let diags = DiagnosticParser::parse_output(sample);
        assert_eq!(diags.len(), 1);
        assert_eq!(diags[0].file, "CMakeLists.txt");
        assert_eq!(diags[0].line, 24);
        assert_eq!(diags[0].source, "cmake");
    }

    #[test]
    fn test_parse_make_error() {
        let sample = "Makefile:14: *** missing separator. Stop.";
        let diags = DiagnosticParser::parse_output(sample);
        assert_eq!(diags.len(), 1);
        assert_eq!(diags[0].file, "Makefile");
        assert_eq!(diags[0].line, 14);
        assert_eq!(diags[0].source, "make");
    }

    #[test]
    fn test_parse_linker_error() {
        let sample = "/usr/bin/ld: undefined reference to `Player::takeDamage(int)'";
        let diags = DiagnosticParser::parse_output(sample);
        assert_eq!(diags.len(), 1);
        assert_eq!(diags[0].source, "linker");
        assert!(diags[0].message.contains("takeDamage"));
    }
}
