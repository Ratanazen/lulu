# Lulu Code Architecture Specification

## Overview

Lulu Code is an original, local-first native desktop AI coding agent built with Tauri 2, Rust, React, TypeScript, Monaco Editor, and SQLite.

## Design Tenets

1. **Evidence-Based Workflow**:
   `PLAN` → `INSPECT` → `EDIT` → `RUN` → `TEST` → `ANALYZE` → `FIX` → `VERIFY` → `REPORT`.
   Every code change must be verified against actual compiler/test runner output. Never claim success without evidence.

2. **Security & Sandbox Isolation**:
   - Commands such as `sudo`, `rm -rf /`, `mkfs`, `dd`, `shutdown`, `curl | sh` are strictly blocked or require explicit elevated confirmation.
   - Files matching `.env`, `*.pem`, `*.key`, `id_rsa`, and system credentials are permanently shielded and redacted with `********` before entering AI context or logs.
   - Safe patch engine: Patches check exact file contents prior to application. If the file has changed externally, the engine yields `FILE_CHANGED_EXTERNALLY` and refuses destructive overwrites.

3. **Offline-First & Low Hardware Overhead**:
   - Operates without internet connectivity.
   - Uses zero-idle CPU loops, debounced file system trees, and native PTY child process management without busy loops.
   - Supports Local Ollama (`http://localhost:11434`) with automatic offline fallback to internal deterministic rule engine.

## State Machine

```
[IDLE]
  │
  ▼
[PLANNING] ──► Formulate explicit checklist
  │
  ▼
[INSPECTING] ──► Read repository files & Cargo.toml / package.json
  │
  ▼
[EXECUTING] ──► Apply minimal edits & patches
  │
  ▼
[TESTING] ──► Run project test runner (cargo test, npm test, pytest)
  │            │
  │ (success)  │ (error detected)
  ▼            ▼
[VERIFYING]  [ANALYZING] ──► Extract normalized diagnostics (rustc, tsc)
  │            │
  │            ▼
  │          [FIXING] ──► Formulate targeted repair (Max 5 retries)
  │            │
  │            └────────► Loops back to [TESTING]
  ▼
[COMPLETE] ──► Present verified result, evidence & diff
```
