import { describe, it, expect, beforeEach } from 'vitest';
import { AIProviderManager } from '../src/features/ai/AIProviderManager';
import { OpenAIProvider } from '../src/features/ai/providers/OpenAIProvider';
import { OllamaProvider } from '../src/features/ai/providers/OllamaProvider';

describe('AIProviderManager', () => {
  let manager: AIProviderManager;

  beforeEach(() => {
    manager = new AIProviderManager();
  });

  it('registers all standard providers by default', () => {
    expect(manager.getProvider('agy')).toBeDefined();
    expect(manager.getProvider('ollama')).toBeDefined();
    expect(manager.getProvider('openai')).toBeDefined();
    expect(manager.getProvider('gemini')).toBeDefined();
    expect(manager.getProvider('anthropic')).toBeDefined();
    expect(manager.getProvider('custom')).toBeDefined();
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
    expect(ids).not.toContain('openai');
    expect(ids).not.toContain('anthropic');
    expect(ids).not.toContain('ollama');
  });

  it('returns valid default configs for all providers', () => {
    const configs = manager.getAllConfigs();
    expect(configs.ollama.baseUrl).toBe('http://localhost:11434');
    expect(configs.openai.selectedModel).toBe('gpt-4o-mini');
    expect(configs.gemini.selectedModel).toBe('gemini-1.5-flash');
    expect(configs.anthropic.selectedModel).toBe('claude-3-5-haiku-20241022');
  });

  it('updates provider config correctly', () => {
    manager.updateConfig('openai', { apiKey: 'sk-test-key-123', temperature: 0.9 });
    const updated = manager.getConfig('openai');
    expect(updated.apiKey).toBe('sk-test-key-123');
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
