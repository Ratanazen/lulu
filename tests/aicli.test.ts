import { describe, it, expect } from 'vitest';
import { AiCliService } from '../src/features/ai/AiCliService';

describe('AI CLI Detection & Execution Service', () => {
  it('detects AI CLI providers with truthful status information', async () => {
    const providers = await AiCliService.detectProviders(true);
    expect(providers.length).toBeGreaterThanOrEqual(4);

    const ids = providers.map((p) => p.id);
    expect(ids).toContain('agy');
    expect(ids).toContain('codex');
    expect(ids).toContain('claude');
    expect(ids).toContain('gemini');
    expect(ids).toContain('ollama');

    const agy = providers.find((p) => p.id === 'agy');
    expect(agy?.status).toBe('AUTHENTICATED');
    expect(agy?.executablePath).toBe('/home/reny/.local/bin/agy');

    const codex = providers.find((p) => p.id === 'codex');
    expect(codex?.status).toBe('INSTALLED');
    expect(codex?.executablePath).toBe('/usr/bin/codex');

    const claude = providers.find((p) => p.id === 'claude');
    expect(claude?.status).toBe('INSTALLED');
    expect(claude?.executablePath).toBe('/home/reny/.local/bin/claude');

    const gemini = providers.find((p) => p.id === 'gemini');
    expect(gemini?.status).toBe('NOT_INSTALLED');
    expect(gemini?.installGuidance).toContain('npm install -g @google/gemini-cli');

    const ollama = providers.find((p) => p.id === 'ollama');
    expect(ollama?.installGuidance).toContain('curl -fsSL https://ollama.com/install.sh');
  });

  it('retrieves individual provider status by id', async () => {
    const claude = await AiCliService.getProviderStatus('claude');
    expect(claude).toBeDefined();
    expect(claude?.name).toBe('Claude CLI');
  });

  it('executes CLI commands safely', async () => {
    const result = await AiCliService.executeCli('codex', ['--help']);
    expect(result).toBeDefined();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('codex');
  });
});
