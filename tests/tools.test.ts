import { describe, it, expect, beforeEach } from 'vitest';
import { ToolManager } from '../src/features/tools/ToolManager';

describe('ToolManager', () => {
  let tools: ToolManager;

  beforeEach(() => {
    tools = new ToolManager();
  });

  it('registers core built-in tools', () => {
    expect(tools.getTool('calculator')).toBeDefined();
    expect(tools.getTool('timer')).toBeDefined();
    expect(tools.getTool('notes')).toBeDefined();
  });

  it('safely evaluates arithmetic expressions with CalculatorTool', async () => {
    const res = await tools.execute('calculator', { expression: '40 + 2 * 10' });
    expect(res.success).toBe(true);
    expect(res.result).toBe(60);
    expect(res.displayMessage).toBe('40 + 2 * 10 = 60');
  });

  it('rejects malicious or invalid expressions in CalculatorTool', async () => {
    const res = await tools.execute('calculator', { expression: 'process.exit(1)' });
    expect(res.success).toBe(false);
    expect(res.error).toBe('Invalid characters');
  });

  it('starts focus timers with TimerTool', async () => {
    const res = await tools.execute('timer', { minutes: 25, label: 'Deep Work' });
    expect(res.success).toBe(true);
    expect(res.result.minutes).toBe(25);
    expect(res.displayMessage).toContain('25-minute timer');
  });

  it('stores scratchpad notes with NotesTool', async () => {
    const res = await tools.execute('notes', { title: 'Bug Checklist', content: 'Fix memory leak' });
    expect(res.success).toBe(true);
    expect(res.displayMessage).toContain('Saved note');
  });

  it('returns failure for unknown tool', async () => {
    const res = await tools.execute('unknown_tool', {});
    expect(res.success).toBe(false);
    expect(res.error).toBe('Not found');
  });
});
