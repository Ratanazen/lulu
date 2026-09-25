// Multi-Agent Orchestrator Types for Lulu Desktop

export type AgentId =
  | 'general_assistant'
  | 'planner'
  | 'coder'
  | 'reviewer'
  | 'tester'
  | 'researcher'
  | 'linux_agent'
  | 'devops_agent'
  | 'cybersecurity_agent'
  | 'ui_agent';

export type TaskStatus =
  | 'pending'
  | 'planning'
  | 'running'
  | 'awaiting_confirmation'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  role: string;
  category: 'core' | 'development' | 'system' | 'quality';
  description: string;
  avatar: string;
  systemPrompt: string;
  capabilities: string[];
  suggestedTools: string[];
}

export interface WorkspaceBoundary {
  rootPath: string;
  allowedSubdirs?: string[];
  readOnly?: boolean;
}

export interface WorkspaceValidationResult {
  valid: boolean;
  canonicalPath?: string;
  error?: string;
}

export interface TaskStep {
  id: string;
  title: string;
  agentId: AgentId;
  status: 'pending' | 'running' | 'completed' | 'failed';
  detail?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface AgentTask {
  id: string;
  title: string;
  agentId: AgentId;
  status: TaskStatus;
  input: string;
  output?: string;
  workspaceRoot: string;
  steps: TaskStep[];
  error?: string;
  createdAt: number;
  completedAt?: number;
}
