use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Diagnostic {
    pub file: String,
    pub line: usize,
    pub column: usize,
    pub severity: String, // "error" | "warning" | "info"
    pub message: String,
    pub source: String,   // "rustc" | "tsc" | "pytest" | "compiler"
}

pub struct DiagnosticParser;

impl DiagnosticParser {
    pub fn parse_output(output: &str) -> Vec<Diagnostic> {
        let mut diagnostics = Vec::new();

        // 1. Rust compiler pattern:
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

                // Look backward a few lines for the error message
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

        // 2. TypeScript / tsc pattern:
        // src/app/App.tsx(12,3): error TS2322: Type 'string' is not assignable to type 'number'.
        // src/app/App.tsx:12:3 - error TS2322: ...
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

        // 3. Python traceback / pytest pattern:
        // File "src/auth.py", line 45, in test_login
        let py_re = Regex::new(r#"File "([^"]+)", line (\d+)(?:, in (.*))?"#).unwrap();
        for (i, line) in lines.iter().enumerate() {
            if let Some(caps) = py_re.captures(line) {
                let file = caps.get(1).unwrap().as_str().to_string();
                let line_num: usize = caps.get(2).unwrap().as_str().parse().unwrap_or(1);
                
                // Check next line for error message
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
        let output = r#"
error[E0308]: mismatched types
  --> src/auth.rs:42:13
   |
42 |     let x: u32 = "hello";
        "#;
        let diags = DiagnosticParser::parse_output(output);
        assert_eq!(diags.len(), 1);
        assert_eq!(diags[0].file, "src/auth.rs");
        assert_eq!(diags[0].line, 42);
        assert_eq!(diags[0].column, 13);
        assert_eq!(diags[0].source, "rustc");
        assert!(diags[0].message.contains("mismatched types"));
    }

    #[test]
    fn test_parse_tsc_error() {
        let output = "src/components/Editor.tsx:25:9 - error TS2304: Cannot find name 'foo'.";
        let diags = DiagnosticParser::parse_output(output);
        assert_eq!(diags.len(), 1);
        assert_eq!(diags[0].file, "src/components/Editor.tsx");
        assert_eq!(diags[0].line, 25);
        assert_eq!(diags[0].column, 9);
        assert_eq!(diags[0].source, "tsc");
    }
}
