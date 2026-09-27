import { describe, it, expect } from 'vitest';
import { updateService } from '../src/services/updateService';
import fs from 'fs';
import path from 'path';

describe('Full System Update Pipeline Suite', () => {
  it('checks for updates gracefully in dev/offline mode', async () => {
    const res = await updateService.checkForUpdates();
    expect(res).toBeDefined();
    expect(res.currentVersion).toBe('0.1.0');
    expect(typeof res.hasUpdate).toBe('boolean');
    expect(typeof res.commitsBehind).toBe('number');
  });

  it('runs standard update task returning structured logs', async () => {
    const res = await updateService.runUpdateTask();
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.outputLog).toContain('[Mock Update Task]');
  });

  it('runs full update task returning dual-app pipeline status', async () => {
    const res = await updateService.runFullUpdateTask();
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.outputLog).toContain('[Mock Full Update Task]');
    expect(res.outputLog).toContain('Build Lulu Code');
  });

  it('verifies update-full.mjs script exists and contains necessary phases', () => {
    const scriptPath = path.resolve('scripts/update-full.mjs');
    expect(fs.existsSync(scriptPath)).toBe(true);

    const content = fs.readFileSync(scriptPath, 'utf8');
    // Verify core phases exist in the pipeline script
    expect(content).toContain('LULU SUITE — FULL SYSTEM APPLICATION UPDATE PIPELINE');
    expect(content).toContain('npm run build');
    expect(content).toContain('npx tauri build --no-bundle');
    expect(content).toContain('lulu.desktop');
    expect(content).toContain('lulu-code.desktop');
    expect(content).toContain('for_window [app_id="lulu-code"]');
  });
});
