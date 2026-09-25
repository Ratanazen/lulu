# Lulu Desktop — Native AI CLI Integration Report

**Date:** 2026-09-25  
**Product:** Lulu Desktop (`lulu-desktop`)  
**Identifier:** `com.ratana.lulu`  
**Host Environment:** Linux (Garuda / Arch Linux, Kernel 6.16.8-zen1, Sway/Wayland)  

---

## 1. Executive Summary

Lulu Desktop integrates native host-level AI CLI tools alongside its local SQLite database, offline rulebook engine, and multi-agent orchestrator. Unlike web wrappers that rely on simulated mockups or remote cloud proxies, Lulu executes real host binaries via its secure Tauri 2 Rust backend (`src-tauri/src/ai/mod.rs`), capturing standard output, streaming execution, and enforcing strict timeout limits.

This report provides a truthful audit of all four supported AI CLI providers on the host system without fabricated status or mock responses.

---

## 2. Supported CLI Provider Matrix & Host Audit

| CLI Provider | Binary Name | Host Status | Executable Path | Detected Version | Auth Status | Install Guidance / Official Source |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OpenAI Codex CLI** | `codex` | **INSTALLED** | `/usr/bin/codex` | `0.154.0` | Configured locally | Pre-installed host binary |
| **Anthropic Claude CLI** | `claude` | **INSTALLED** | `/home/reny/.local/bin/claude` | `2.1.267` | Host session | `npm install -g @anthropic-ai/claude-code` |
| **Google Gemini CLI** | `gemini` | **NOT_INSTALLED** | `None` | `None` | Unauthenticated | `npm install -g @google/gemini-cli` |
| **Ollama Local Daemon** | `ollama` | **NOT_INSTALLED** | `None` | `None` | Offline Default | `curl -fsSL https://ollama.com/install.sh \| sh` |

---

## 3. Detection Architecture & IPC Protocol

The detection subsystem operates entirely in native Rust to ensure zero false positives and high performance:

1. **Binary Discovery (`probe_binary`)**:
   - Executes `which <binary_name>` in the host shell environment.
   - Extracts the absolute canonical path without PATH hijacking.
2. **Version Querying (`get_version`)**:
   - Executes `<binary_name> --version` with a 2-second process timeout.
   - Parses the semantic version or build string.
3. **Daemon Socket Probing (`probe_ollama_server`)**:
   - Probes `127.0.0.1:11434` via `TcpStream::connect_timeout` with a 250ms timeout.
   - Reports `RUNNING` if the TCP socket accepts connections; otherwise reports `NOT_RUNNING` or `NOT_INSTALLED`.
4. **Execution Protocol (`execute_cli`)**:
   - Spawns the CLI child process inside a sandboxed workspace directory.
   - Captures `stdout` and `stderr` streams independently.
   - Enforces a 60-second execution ceiling to prevent hung processes.

---

## 4. Multi-Agent Orchestrator Integration

All 10 specialized autonomous agents can leverage host AI CLIs for task execution when available:

- **Senior Coder (`coder`)**: Leverages `codex` for algorithm generation and complex refactoring.
- **Lead Planner (`planner`)**: Leverages `claude` for long-context architecture breakdown and RFC creation.
- **Cybersecurity Guardian (`cybersecurity_agent`)**: Enforces workspace boundary containment (`ensureInsideWorkspace`) before any CLI execution arguments or file paths are evaluated.
- **Offline Rulebook Fallback**: If no AI CLI binary is installed or active, Lulu seamlessly falls back to its deterministic local rulebook engine (`offline`), ensuring 100% operational availability without internet or API keys.

---

## 5. Security & Privacy Guarantees

1. **Workspace Boundary Containment**:
   All CLI commands initiated by agents are executed strictly within the user's defined workspace root. Path traversal sequences (`../`, null bytes, and absolute escapes outside the workspace) are rejected with a `SecurityViolation`.
2. **Zero Credential Scraping**:
   Lulu never attempts to read `.env`, SSH keys, or CLI config files directly. CLI processes inherit the user's existing host environment session safely.
3. **Granular Confirmation Policy**:
   Destructive actions triggered by CLI tools or agents require explicit user approval (`Allow Once`, `Allow Session`, `Deny`).
