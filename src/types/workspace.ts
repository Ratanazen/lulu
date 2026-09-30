export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  size?: number;
  children?: FileNode[];
}

export interface ProjectMetadata {
  name: string;
  path: string;
  language: string;
  build_tool: string;
  test_runner: string;
  is_git: boolean;
  has_lulu_spec: boolean;
  lulu_instructions?: string;
}

export interface RecentProject {
  id: string;
  name: string;
  path: string;
  detected_type: string;
  last_opened_at: string;
}
