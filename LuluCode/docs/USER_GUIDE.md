# Lulu Code User Guide

## Getting Started

Lulu Code is an offline-first desktop companion for software engineers. It inspects your project, plans safe modifications, executes tests, analyzes error diagnostics, and fixes issues with verifiable evidence.

## Main Interface Layout

- **Top Bar**: Workspace project switcher, test runner shortcut, Ollama/Offline AI status badge, permission level selector, and settings.
- **Left Sidebar**:
  - **Explorer**: File and folder tree. Create, delete, rename, and open files.
  - **Search**: Workspace-wide text search with regex support.
  - **Git**: Branch info, staged/unstaged changes, unified diff inspection, and commit dialog.
  - **Tasks**: Historical record of previous agent tasks and re-run triggers.
- **Center Area**:
  - **Code Editor**: Monaco editor with syntax highlighting, tabs, minimap, formatting, and diff views.
  - **Agent Chat**: Conversation thread displaying user goals, agent reasoning, and collapsible tool executions.
  - **Split View**: Side-by-side view of Editor and Agent Chat.
- **Right Sidebar (Inspector)**:
  - **Plan**: Live execution checklist showing progress through task steps.
  - **Diagnostics**: Normalized compiler and test issues (rustc, tsc, pytest). Clicking an issue jumps directly to the file and line.
- **Bottom Panel**: Tabbed terminal emulator (`Agent Activity`, `Tests & Build`, `Terminal 1`, `Terminal 2`).

## Connecting Local Ollama

Lulu Code is designed to work completely offline, but can seamlessly connect to your local Ollama instance:
1. Start Ollama:
   ```bash
   ollama serve
   ```
2. Pull a coding model:
   ```bash
   ollama pull qwen2.5-coder:latest
   ```
3. In Lulu Code, click **Settings (gear icon)** -> **AI Provider**.
4. Confirm endpoint `http://localhost:11434` and click **Detect**.
5. Select your model.
6. If Ollama is stopped or unavailable, Lulu Code automatically falls back to its internal deterministic engine without freezing or hanging.

## Keyboard Shortcuts

| Shortcut | Description |
|---|---|
| `Ctrl+S` / `Cmd+S` | Save current active editor file |
| `Ctrl+Enter` | Run task in prompt |
| `Esc` | Stop active agent task |
| `Ctrl+`` | Toggle bottom terminal panel |

## Permission Policies

Lulu Code provides 5 distinct permission levels:
1. `READ_ONLY`: Agent can only read files and inspect logs. Never writes or executes.
2. `SAFE_EDIT`: Agent can edit source files and run safe tests. Destructive commands require approval.
3. `FULL_EDIT`: Full file editing access.
4. `COMMAND_CONFIRM`: Prompts for user confirmation before executing any shell command.
5. `AUTONOMOUS`: Fully autonomous operation within the workspace sandbox.

*Note: Dangerous commands (`sudo`, `rm -rf /`, `mkfs`, `curl | sh`) and secrets (`.env`, SSH keys) are always shielded.*
