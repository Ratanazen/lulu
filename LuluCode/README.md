# Lulu Code

> **An original, native desktop AI coding agent built with Tauri 2, Rust, React, Monaco Editor, and SQLite.**

Lulu Code is an offline-first desktop companion for software engineers. It inspects repositories, formulates execution plans, applies safe patches, runs test suites, extracts compiler diagnostics, and repairs code with verifiable evidence.

---

## Key Features

- **Evidence-Based Workflow**:
  `PLAN` → `INSPECT` → `EDIT` → `RUN` → `TEST` → `ANALYZE` → `FIX` → `VERIFY` → `REPORT`.
- **Zero Cloud AI Dependency**:
  Works fully offline. Connects to Local Ollama (`http://localhost:11434`) when available, with automatic fallback to an internal deterministic code analysis engine.
- **Monaco Code & Diff Editor**:
  Full syntax highlighting, tabs, minimap, formatting, line numbers, and side-by-side or inline diff inspections.
- **PTY Terminal Manager**:
  Multi-tab terminal emulator (`Agent Activity`, `Tests & Build`, `Terminal 1`, `Terminal 2`) with live streaming output and child process tracking.
- **Security & Secret Shield**:
  - Blocks dangerous destructive operations (`sudo`, `rm -rf /`, `mkfs`, `dd`, `curl | sh`).
  - Redacts sensitive credentials, `.env` files, and private keys (`OPENAI_API_KEY=********`).
  - Safe patch engine: refuses destructive overwrites if files were modified externally.
- **Permission Center**:
  5 granular permission levels: `READ_ONLY`, `SAFE_EDIT`, `FULL_EDIT`, `COMMAND_CONFIRM`, and `AUTONOMOUS`.
- **Diagnostics Parser**:
  Translates `rustc`, `tsc`, and `pytest` error outputs into normalized issues; clicking an issue immediately jumps to the line in Monaco editor.
- **Git Integration**:
  Branch selector, staged/unstaged changes, unified diffs, and commit dialog.
- **Local Memory**:
  Bundled SQLite database storing projects, tasks, steps, messages, tool calls, and diffs. Supports project-level `LULU.md` and `.lulu/` guidelines.

---

## Project Structure

```
LuluCode/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── chat/
│   │   ├── agent/
│   │   ├── workspace/
│   │   ├── explorer/
│   │   ├── editor/
│   │   ├── terminal/
│   │   ├── diff/
│   │   ├── git/
│   │   ├── tasks/
│   │   ├── plans/
│   │   ├── permissions/
│   │   ├── settings/
│   │   ├── search/
│   │   └── diagnostics/
│   ├── stores/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── styles/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── commands/
│   │   ├── agent/
│   │   ├── ai/
│   │   ├── filesystem/
│   │   ├── terminal/
│   │   ├── git/
│   │   ├── workspace/
│   │   ├── permissions/
│   │   ├── database/
│   │   ├── diagnostics/
│   │   └── security/
│   ├── capabilities/
│   └── tauri.conf.json
├── migrations/
├── tests/
├── docs/
├── scripts/
├── package.json
├── README.md
└── LICENSE
```

---

## Testing

Run all unit and integration tests:
```bash
./scripts/test-all.sh
```

---

## Building

Build the production desktop application:
```bash
./scripts/build-linux.sh
```
