import { describe, it, expect } from 'vitest';
import { AgyProvider } from '../src/features/ai/providers/AgyProvider';
import { ProviderConfig } from '../src/features/ai/types';

describe('Antigravity (AGY) CLI Integration', () => {
  const provider = new AgyProvider();

  const mockConfig: ProviderConfig = {
    id: 'agy',
    name: 'Antigravity (AGY)',
    enabled: true,
    selectedModel: 'gemini-3.8-flash-low',
    availableModels: ['gemini-3.8-flash-low', 'claude-sonnet-4-6', 'gpt-oss-120b-medium'],
    temperature: 0.7,
    maxTokens: 2048,
  };

  it('reports provider metadata accurately', () => {
    expect(provider.id).toBe('agy');
    expect(provider.name).toBe('Antigravity (AGY)');
  });

  it('tests connection and retrieves supported model list', async () => {
    const res = await provider.testConnection(mockConfig);

    expect(res.success).toBe(true);
    expect(res.models).toBeDefined();
    expect(res.models).toContain('gemini-3.8-flash-low');
    expect(res.models).toContain('claude-sonnet-4-6');
    expect(res.models).toContain('gpt-oss-120b-medium');
  });

  it('executes multi-turn chat prompt formatting correctly', async () => {
    const response = await provider.chat(
      {
        messages: [
          { id: '1', role: 'user', content: 'What is your ninja way?', timestamp: Date.now() },
          { id: '2', role: 'assistant', content: 'Never giving up! Dattebayo!', timestamp: Date.now() },
          { id: '3', role: 'user', content: 'Tell me more about Rasengan.', timestamp: Date.now() },
        ],
        systemPrompt: 'You are Naruto Uzumaki, the Seventh Hokage.',
        model: 'gemini-3.8-flash-low',
      },
      mockConfig
    );

    expect(response).toBeDefined();
    expect(response.message.role).toBe('assistant');
    expect(response.message.content.length).toBeGreaterThan(0);
    expect(response.model).toBe('gemini-3.8-flash-low');
    expect(response.usage).toBeDefined();
  });

  it('streams tokens through async generator', async () => {
    const generator = provider.chatStream(
      {
        messages: [{ id: '1', role: 'user', content: 'Hello ninja', timestamp: Date.now() }],
        systemPrompt: 'Be friendly',
      },
      mockConfig
    );

    let streamAcc = '';
    for await (const chunk of generator) {
      streamAcc += chunk;
    }

    expect(streamAcc.length).toBeGreaterThan(0);
  });
});
