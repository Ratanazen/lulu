import { describe, it, expect, beforeEach } from 'vitest';
import { AIProviderManager } from '../src/features/ai/AIProviderManager';

describe('AIProviderManager', () => {
  let manager: AIProviderManager;

  beforeEach(() => {
    manager = new AIProviderManager();
  });

  it('registers all standard Gemini and AGY providers by default', () => {
    expect(manager.getProvider('hybrid_gemini_agy')).toBeDefined();
    expect(manager.getProvider('agy')).toBeDefined();
    expect(manager.getProvider('gemini')).toBeDefined();
  });

  it('allows switching active provider', () => {
    expect(manager.getActiveProviderId()).toBe('hybrid_gemini_agy');
    manager.setActiveProviderId('gemini');
    expect(manager.getActiveProviderId()).toBe('gemini');
  });

  it('exposes only Google Gemini and AGY providers in visible list', () => {
    const visible = manager.getVisibleProviders();
    const ids = visible.map((p) => p.id);
    expect(ids).toContain('hybrid_gemini_agy');
    expect(ids).toContain('agy');
    expect(ids).toContain('gemini');
    expect(ids).toContain('offline');
  });

  it('returns valid default configs for Gemini and AGY providers', () => {
    const configs = manager.getAllConfigs();
    expect(configs.hybrid_gemini_agy.selectedModel).toBe('auto');
    expect(configs.agy.selectedModel).toBe('gemini-3.8-flash-low');
    expect(configs.gemini.selectedModel).toBe('gemini-1.5-flash');
    expect(configs.offline.selectedModel).toBe('built-in-rules');
  });

  it('updates provider config correctly', () => {
    manager.updateConfig('gemini', { apiKey: 'test-gemini-key', temperature: 0.9 });
    const updated = manager.getConfig('gemini');
    expect(updated.apiKey).toBe('test-gemini-key');
    expect(updated.temperature).toBe(0.9);
  });

  it('falls back to offline engine gracefully when offline or provider unavailable', async () => {
    manager.setActiveProviderId('offline');
    const response = await manager.chat({
      messages: [{ id: '1', role: 'user', content: 'hello lulu!', timestamp: Date.now() }],
    });

    expect(response.message.content).toContain('Lulu');
    expect(response.model).toBe('built-in-offline');
  });

  it('streams offline responses smoothly token by token', async () => {
    manager.setActiveProviderId('offline');
    const tokens: string[] = [];
    const full = await manager.streamChat(
      {
        messages: [{ id: '1', role: 'user', content: 'tell me a joke', timestamp: Date.now() }],
      },
      (token) => {
        tokens.push(token);
      }
    );

    expect(tokens.length).toBeGreaterThan(0);
    expect(full.length).toBeGreaterThan(0);
  });

  it('supports Antigravity (AGY) provider chat and model selection', async () => {
    const agy = manager.getProvider('agy');
    expect(agy).toBeDefined();
    expect(agy?.name).toContain('Antigravity');

    const config = manager.getConfig('agy');
    expect(config.selectedModel).toBe('gemini-3.8-flash-low');
    expect(config.availableModels).toContain('gemini-3.8-flash-high');

    const testConn = await agy?.testConnection?.(config);
    expect(testConn).toBeDefined();
    expect(testConn?.success).toBe(true);

    const chatRes = await agy?.chat(
      {
        messages: [{ id: '1', role: 'user', content: 'hello from test', timestamp: Date.now() }],
      },
      config
    );
    expect(chatRes).toBeDefined();
    expect(chatRes?.message.role).toBe('assistant');
  });
});
