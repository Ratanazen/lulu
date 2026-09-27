# Lulu Code Tool Reference & Schemas

Lulu Code agents interact with projects through strictly defined, safe native tools.

## Available Tools

### 1. `read_file`
Reads contents from a workspace file, optionally sliced by start/end line.
```json
{
  "path": "src/main.rs",
  "startLine": 1,
  "endLine": 50
}
```

### 2. `write_file`
Writes complete contents to a file. Parent directories are created automatically.
```json
{
  "path": "src/config.json",
  "content": "{\n  \"version\": 1\n}"
}
```

### 3. `edit_file` / `apply_patch`
Safely replaces exact `targetContent` with `replacementContent`. If the file was changed externally, returns `FILE_CHANGED_EXTERNALLY`.
```json
{
  "path": "src/auth.rs",
  "targetContent": "let timeout = 30;",
  "replacementContent": "let timeout = 60;"
}
```

### 4. `create_file`
Creates a new file if it does not already exist.
```json
{
  "path": "src/utils.rs",
  "content": "// Utility module"
}
```

### 5. `delete_file`
Deletes a file or directory. Root workspace deletion is strictly blocked.
```json
{
  "path": "temp/test.log"
}
```

### 6. `list_directory`
Returns structured file tree nodes up to specified depth, respecting ignored folders (`target`, `node_modules`, `.git`).
```json
{
  "path": "src",
  "maxDepth": 3
}
```

### 7. `search_files`
Searches for filenames matching a pattern or query.
```json
{
  "query": "auth*.rs"
}
```

### 8. `search_text`
Performs literal or regex text search across files in the workspace.
```json
{
  "query": "fn authenticate",
  "isRegex": false
}
```

### 9. `run_command`
Runs shell command inside project root with timeout and process tracking.
```json
{
  "command": "cargo build",
  "timeoutSecs": 120
}
```

### 10. `run_tests`
Executes auto-detected test runner (`cargo test`, `npm test`, `pytest`, etc.).
```json
{
  "testFilter": "test_auth"
}
```

### 11. `git_status`
Retrieves git branch, staged files, unstaged changes, and untracked files.

### 12. `git_diff`
Generates unified git diff for staged or unstaged modifications.

### 13. `git_log`
Returns recent commit history (hash, message, author, timestamp).

### 14. `git_branch`
Returns current branch and list of local branches.

### 15. `git_commit`
Stages files (optional) and creates a git commit.
```json
{
  "message": "fix: resolve authentication timeout bug",
  "files": ["src/auth.rs"]
}
```
