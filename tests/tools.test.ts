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

  it('registers all required safe system tools', () => {
    const requiredTools = [
      'system_info', 'cpu_info', 'ram_info', 'disk_info',
      'network_info', 'battery_info', 'open_application',
      'open_folder', 'open_url', 'file_search',
    ];
    for (const id of requiredTools) {
      const t = tools.getTool(id);
      expect(t).toBeDefined();
      expect(t?.category).toBe('safe');
    }
  });

  it('executes safe system tools successfully', async () => {
    const sys = await tools.execute('system_info', {});
    expect(sys.success).toBe(true);
    expect(sys.displayMessage).toBeDefined();

    const net = await tools.execute('network_info', {});
    expect(net.success).toBe(true);

    const openUrl = await tools.execute('open_url', { url: 'https://example.com' });
    expect(openUrl.success).toBe(true);

    const badUrl = await tools.execute('open_url', { url: 'javascript:alert(1)' });
    expect(badUrl.success).toBe(false);
  });

  it('enforces confirmation on dangerous tools', async () => {
    // 1. Without callback -> denied
    const unconfirmed = await tools.execute('delete_file', { filePath: '/tmp/test.txt' });
    expect(unconfirmed.success).toBe(false);
    expect(unconfirmed.error).toBe('CONFIRMATION_REQUIRED');

    // 2. With callback denying
    const denied = await tools.execute('delete_file', { filePath: '/tmp/test.txt' }, async () => 'deny');
    expect(denied.success).toBe(false);
    expect(denied.error).toBe('USER_DENIED');

    // 3. With callback approving
    const approved = await tools.execute('delete_file', { filePath: '/tmp/test.txt' }, async () => 'allow_once');
    expect(approved.success).toBe(true);
  });
});
