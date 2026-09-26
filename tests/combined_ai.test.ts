import { describe, it, expect } from 'vitest';
import { CombinedGeminiAgyProvider } from '../src/features/ai/providers/CombinedGeminiAgyProvider';
import { ProviderConfig } from '../src/features/ai/types';

describe('Combined Gemini + AGY Engine', () => {
  const provider = new CombinedGeminiAgyProvider();

  const mockConfig: ProviderConfig = {
    id: 'hybrid_gemini_agy',
    name: 'Combined Gemini + AGY Engine',
    enabled: true,
    apiKey: '',
    selectedModel: 'auto',
    availableModels: [
      'auto',
      'gemini-3.8-flash-low',
      'gemini-3.8-flash-high',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
      'claude-sonnet-4-6',
      'gpt-oss-120b-medium',
    ],
    temperature: 0.7,
    maxTokens: 1024,
  };

  it('reports provider metadata accurately', () => {
    expect(provider.id).toBe('hybrid_gemini_agy');
    expect(provider.name).toContain('Combined');
    expect(provider.name).toContain('Gemini');
    expect(provider.name).toContain('AGY');
  });

  it('tests connection and reports AGY status and cloud options', async () => {
    const res = await provider.testConnection(mockConfig);
    expect(res.success).toBe(true);
    expect(res.models).toBeDefined();
    expect(res.models).toContain('auto');
    expect(res.models).toContain('gemini-3.8-flash-low');
    expect(res.models).toContain('gemini-1.5-flash');
    expect(res.message).toContain('AGY CLI');
  });

  it('executes smart routing with multi-turn prompt support', async () => {
    const response = await provider.chat(
      {
        messages: [
          { id: '1', role: 'user', content: 'What is reality?', timestamp: Date.now() },
          { id: '2', role: 'assistant', content: 'Wake up to reality.', timestamp: Date.now() },
          { id: '3', role: 'user', content: 'Show me your strategic vision.', timestamp: Date.now() },
        ],
        systemPrompt: 'You are Madara Uchiha.',
      },
      mockConfig
    );

    expect(response).toBeDefined();
    expect(response.message.role).toBe('assistant');
    expect(response.message.content.length).toBeGreaterThan(0);
    expect(response.model).toBeDefined();
  });

  it('streams tokens through async generator', async () => {
    const generator = provider.chatStream(
      {
        messages: [{ id: '1', role: 'user', content: 'Greetings Madara', timestamp: Date.now() }],
        systemPrompt: 'Be brief',
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
