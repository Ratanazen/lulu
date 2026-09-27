-- Lulu Code Initial Database Schema Migration
-- SQLite 3 compatible

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    detected_type TEXT DEFAULT 'generic',
    build_tool TEXT,
    test_runner TEXT,
    last_opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('QUEUED', 'RUNNING', 'WAITING_PERMISSION', 'FAILED', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_steps (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    step_index INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED')),
    plan_text TEXT,
    output TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('USER', 'LULU', 'TOOL', 'SYSTEM')),
    content TEXT NOT NULL,
    tool_call_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tool_calls (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    input_json TEXT NOT NULL,
    output_json TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    exit_code INTEGER,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS file_changes (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    before_content TEXT,
    after_content TEXT,
    diff TEXT,
    status TEXT NOT NULL CHECK(status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'APPLIED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    state TEXT NOT NULL,
    phase TEXT NOT NULL,
    iteration INTEGER NOT NULL DEFAULT 1,
    retry_count INTEGER NOT NULL DEFAULT 0,
    evidence TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    scope TEXT NOT NULL,
    level TEXT NOT NULL CHECK(level IN ('READ_ONLY', 'SAFE_EDIT', 'FULL_EDIT', 'COMMAND_CONFIRM', 'AUTONOMOUS')),
    pattern TEXT,
    action TEXT NOT NULL CHECK(action IN ('ALLOW_ONCE', 'ALLOW_FOR_TASK', 'ALLOW_FOR_PROJECT', 'DENY')),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK(provider_type IN ('LOCAL_OLLAMA', 'OPENAI_COMPATIBLE', 'CUSTOM')),
    endpoint TEXT NOT NULL,
    api_key TEXT,
    model TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_task_id ON tool_calls(task_id);
CREATE INDEX IF NOT EXISTS idx_file_changes_task_id ON file_changes(task_id);
