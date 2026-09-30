export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export interface FileDiff {
  filePath: string;
  status: 'added' | 'modified' | 'deleted';
  beforeContent: string;
  afterContent: string;
  hunks?: DiffHunk[];
}
