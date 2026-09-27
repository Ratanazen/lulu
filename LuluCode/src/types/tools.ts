export interface ReadFileArgs {
  path: string;
  startLine?: number;
  endLine?: number;
}

export interface WriteFileArgs {
  path: string;
  content: string;
}

export interface EditFileArgs {
  path: string;
  targetContent: string;
  replacementContent: string;
}

export interface CreateFileArgs {
  path: string;
  content?: string;
}

export interface DeleteFileArgs {
  path: string;
}

export interface ListDirectoryArgs {
  path?: string;
  maxDepth?: number;
}

export interface SearchFilesArgs {
  query: string;
  path?: string;
}

export interface SearchTextArgs {
  query: string;
  isRegex?: boolean;
  path?: string;
}

export interface SearchMatch {
  file_path: string;
  line_number: number;
  line_content: string;
}

export interface RunCommandArgs {
  command: string;
  cwd?: string;
  timeoutSecs?: number;
}

export interface RunTestsArgs {
  path?: string;
  testFilter?: string;
}

export interface GitStatusArgs {}

export interface GitDiffArgs {
  path?: string;
  staged?: boolean;
}

export interface GitLogArgs {
  count?: number;
}

export interface GitBranchArgs {}

export interface GitCommitArgs {
  message: string;
  files?: string[];
}

export type ToolName =
  | 'read_file'
  | 'write_file'
  | 'edit_file'
  | 'create_file'
  | 'delete_file'
  | 'list_directory'
  | 'search_files'
  | 'search_text'
  | 'run_command'
  | 'run_tests'
  | 'git_status'
  | 'git_diff'
  | 'git_log'
  | 'git_branch'
  | 'git_commit';

export interface ToolCallRecord {
  id: string;
  tool: ToolName;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: Record<string, unknown>;
  output?: string;
  exitCode?: number;
  durationMs?: number;
  createdAt: string;
}
