# Privacy & Security Manifesto

## 1. Offline-First by Default

Lulu operates 100% locally on your workstation:
- **No Telemetry**: No user analytics, metrics, or telemetry are transmitted.
- **No Screen Capture**: Lulu does not record, screenshot, or inspect your desktop content without explicit user action.
- **No Keystroke Logging**: Keyboard input is only received when mini-game canvas elements or input fields are actively focused.
- **Zero Cloud Accounts**: No logins, email registrations, or cloud tokens required.

## 2. AI Intelligence & Model Sovereignty

- **Local Ollama Priority**: Lulu features built-in detection and streaming support for local Ollama instances (`http://localhost:11434`). Prompts, responses, and tokens never leave your local machine.
- **Offline Rule-Based Fallback**: When offline or without API keys, Lulu uses a built-in deterministic heuristic companion engine.
- **User-Owned API Keys**: If cloud providers (OpenAI, Gemini, Claude) are chosen, user API keys are stored only on your local machine in SQLite and transmitted exclusively to the specified provider endpoint over TLS.

## 3. Persistent Memory Transparency

- **Explicit Knowledge Retention**: Lulu only stores memories and facts either derived from active chat context or explicitly created via `/note` or the Memory Manager.
- **Full Data Sovereignty**: All memories can be browsed, edited, searched, deleted individually (`forget()`), or completely purged at any time.
- **Structured Portability**: Full JSON export and rollback-protected import are built directly into the UI.

## 4. Safe Tool & Agent Execution

- **Sandboxed Utilities**: Built-in tools (Calculator, Timers, Notes) run locally in-process without dangerous system side effects.
- **No Unrestricted Shell Access**: Lulu will never execute arbitrary shell commands without explicit user review and confirmation.

## 5. Local Storage Transparency

All saved settings, achievements, and companion state reside on your device in `$APP_DATA_DIR/lulu.db`. You can view, export, or erase this data at any time via the Control Center **Privacy & Storage** tab.

