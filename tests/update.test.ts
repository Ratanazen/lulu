import { describe, it, expect } from 'vitest';
import { UpdateService, updateService } from '../src/services/updateService';
import { AgentManager } from '../src/features/agents/AgentManager';

describe('UpdateService', () => {
  it('instantiates as a singleton', () => {
    const s1 = UpdateService.getInstance();
    const s2 = updateService;
    expect(s1).toBe(s2);
  });

  it('checks for updates with fallback when not running in Tauri', async () => {
    const res = await updateService.checkForUpdates();
    expect(res).toBeDefined();
    expect(res.currentVersion).toBe('0.1.0');
    expect(typeof res.hasUpdate).toBe('boolean');
    expect(typeof res.isClean).toBe('boolean');
    expect(res.statusMessage).toBeDefined();
  });

  it('runs update task with fallback when not running in Tauri', async () => {
    const res = await updateService.runUpdateTask();
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.message).toBeDefined();
    expect(res.outputLog).toContain('Mock Update Task');
  });
});

describe('Update Task Multi-Agent Integration', () => {
  it('routes update requests to devops_agent', () => {
    const agentManager = new AgentManager('/home/user/projects/lulu');
    const agent = agentManager.selectAgentForIntent('Run application update task');
    expect(agent.id).toBe('devops_agent');
  });

  it('executes update task via devops_agent in pipeline', async () => {
    const agentManager = new AgentManager('/home/user/projects/lulu');
    const task = agentManager.createTask('Run update on desktop application');
    expect(task.agentId).toBe('devops_agent');

    const result = await agentManager.executeTask(task.id);
    expect(result.status).toBe('completed');
    expect(result.output).toContain('Build & Update Log');
  });
});
