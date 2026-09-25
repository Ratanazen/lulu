# Security Policy & Safeguards

## 1. Principles

- **Zero Remote Code Execution**: Lulu never downloads or evaluates untrusted remote scripts (`curl | bash` patterns are forbidden).
- **Strict Tauri IPC Allowlist**: Every IPC command is strongly typed, validated in Rust, and restricted by Tauri 2 capabilities.
- **Path Sanitization**: All file operations prevent path traversal (`../`) and operate strictly within `$APP_DATA_DIR`.
- **Process Protection**: Process listing is strictly read-only and never terminates arbitrary processes without explicit interactive confirmation.

## 2. Capability Boundaries

In `src-tauri/capabilities/default.json`, window permissions are scoped strictly to the declared labels (`main` and `control_center`). Arbitrary window spawning is blocked.
