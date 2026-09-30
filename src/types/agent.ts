export type AgentState =
  | 'IDLE'
  | 'PLANNING'
  | 'INSPECTING'
  | 'EXECUTING'
  | 'TESTING'
  | 'ANALYZING'
  | 'FIXING'
  | 'VERIFYING'
  | 'COMPLETE'
  | 'RECOVERY'
  | 'CANCELLED';

export interface PlanStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: string;
}

export interface TaskRecord {
  id: string;
  projectId?: string;
  title: string;
  prompt: string;
  status: 'QUEUED' | 'RUNNING' | 'WAITING_PERMISSION' | 'FAILED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  plan: PlanStep[];
  filesChanged: string[];
  retryCount: number;
  maxRetries: number;
  result?: string;
}

export interface AgentTimelineEvent {
  timestamp: string;
  phase: AgentState;
  message: string;
  tool?: string;
  exitCode?: number;
  durationMs?: number;
}
