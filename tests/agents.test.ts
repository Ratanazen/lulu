import { describe, it, expect, beforeEach } from 'vitest';
import { normalizePath, validateWorkspacePath, ensureInsideWorkspace } from '../src/features/agents/workspaceBoundary';
import { AgentManager } from '../src/features/agents/AgentManager';

describe('Workspace Boundary Validator', () => {
  const workspaceRoot = '/home/user/projects/lulu';

  it('normalizes paths and removes redundant slashes', () => {
    expect(normalizePath('/home//user///projects/lulu/src/')).toBe('/home/user/projects/lulu/src');
    expect(normalizePath('src/../src/components/./App.tsx')).toBe('src/components/App.tsx');
  });

  it('detects and rejects null-byte attacks', () => {
    expect(() => normalizePath('/home/user/projects/lulu/src\0/secret.txt')).toThrow('Null byte detected');
  });

  it('accepts paths strictly inside workspace root', () => {
    const check1 = validateWorkspacePath('/home/user/projects/lulu/src/main.ts', workspaceRoot);
    expect(check1.valid).toBe(true);
    expect(check1.canonicalPath).toBe('/home/user/projects/lulu/src/main.ts');

    const check2 = validateWorkspacePath('src/components/App.tsx', workspaceRoot);
    expect(check2.valid).toBe(true);
    expect(check2.canonicalPath).toBe('/home/user/projects/lulu/src/components/App.tsx');

    const check3 = validateWorkspacePath('/home/user/projects/lulu', workspaceRoot);
    expect(check3.valid).toBe(true);
  });

  it('blocks path traversal escapes with ..', () => {
    const check = validateWorkspacePath('/home/user/projects/lulu/../../etc/passwd', workspaceRoot);
    expect(check.valid).toBe(false);
    expect(check.error).toContain('Path traversal violation');
  });

  it('blocks absolute paths outside workspace root', () => {
    const check = validateWorkspacePath('/etc/shadow', workspaceRoot);
    expect(check.valid).toBe(false);
    expect(check.error).toContain('Path traversal violation');
  });

  it('blocks prefix collisions (e.g. /workspace-sibling vs /workspace)', () => {
    const check = validateWorkspacePath('/home/user/projects/lulu-other/leak.txt', workspaceRoot);
    expect(check.valid).toBe(false);
    expect(check.error).toContain('Path traversal violation');
  });

  it('ensureInsideWorkspace returns path or throws SecurityViolation', () => {
    expect(ensureInsideWorkspace('src/index.ts', workspaceRoot)).toBe('/home/user/projects/lulu/src/index.ts');
    expect(() => ensureInsideWorkspace('/var/log/syslog', workspaceRoot)).toThrow('SecurityViolation');
  });
});

describe('Multi-Agent Orchestrator (AgentManager)', () => {
  let agentManager: AgentManager;

  beforeEach(() => {
    agentManager = new AgentManager('/home/user/projects/lulu');
  });

  it('registers all 10 required specialized agents', () => {
    const agents = agentManager.getAllAgents();
    expect(agents).toHaveLength(10);

    const agentIds = agents.map((a) => a.id);
    expect(agentIds).toContain('general_assistant');
    expect(agentIds).toContain('planner');
    expect(agentIds).toContain('coder');
    expect(agentIds).toContain('reviewer');
    expect(agentIds).toContain('tester');
    expect(agentIds).toContain('researcher');
    expect(agentIds).toContain('linux_agent');
    expect(agentIds).toContain('devops_agent');
    expect(agentIds).toContain('cybersecurity_agent');
    expect(agentIds).toContain('ui_agent');
  });

  it('selects appropriate agents based on task intent and keywords', () => {
    expect(agentManager.selectAgentForIntent('Write unit tests with vitest').id).toBe('tester');
    expect(agentManager.selectAgentForIntent('Review this PR and inspect diff').id).toBe('reviewer');
    expect(agentManager.selectAgentForIntent('Audit permissions and check for CVE vulnerability').id).toBe('cybersecurity_agent');
    expect(agentManager.selectAgentForIntent('Troubleshoot Sway Wayland D-Bus audio service').id).toBe('linux_agent');
    expect(agentManager.selectAgentForIntent('Create Docker packaging for Debian release').id).toBe('devops_agent');
    expect(agentManager.selectAgentForIntent('Style the modal header with responsive CSS Tailwind').id).toBe('ui_agent');
    expect(agentManager.selectAgentForIntent('Create architectural plan and roadmap breakdown').id).toBe('planner');
    expect(agentManager.selectAgentForIntent('Investigate documentation for WebGL vs Canvas').id).toBe('researcher');
    expect(agentManager.selectAgentForIntent('Implement binary search algorithm in Rust').id).toBe('coder');
    expect(agentManager.selectAgentForIntent('Tell me a bedtime story').id).toBe('general_assistant');
  });

  it('creates and tracks tasks with workspace containment', async () => {
    const task = agentManager.createTask('Write unit tests for parser');
    expect(task.agentId).toBe('tester');
    expect(task.workspaceRoot).toBe('/home/user/projects/lulu');
    expect(task.status).toBe('pending');
    expect(task.steps.length).toBeGreaterThan(0);

    const executed = await agentManager.executeTask(task.id);
    expect(executed.status).toBe('completed');
    expect(executed.steps.length).toBe(2);
    expect(executed.steps[1].agentId).toBe('cybersecurity_agent');
    expect(executed.output).toBeDefined();
  });

  it('updates workspace root and enforces new boundary', () => {
    agentManager.setWorkspaceRoot('/home/user/new-workspace');
    expect(agentManager.getWorkspace().rootPath).toBe('/home/user/new-workspace');

    expect(agentManager.validatePath('/home/user/new-workspace/docs').valid).toBe(true);
    expect(agentManager.validatePath('/home/user/projects/lulu/docs').valid).toBe(false);
  });
});
