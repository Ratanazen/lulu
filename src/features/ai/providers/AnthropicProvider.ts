import { AIProvider, AIProviderId, ChatRequest, ChatResponse, ProviderConfig } from '../types';

export class AnthropicProvider implements AIProvider {
  readonly id: AIProviderId = 'anthropic';
  readonly name = 'Anthropic Claude';

  private getEndpoint(config: ProviderConfig): string {
    const base = (config.baseUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
    return `${base}/messages`;
  }

  async testConnection(config: ProviderConfig): Promise<{ success: boolean; message: string; models?: string[] }> {
    if (!config.apiKey) {
      return { success: false, message: 'API key is required for Anthropic.' };
    }

    try {
      const res = await fetch(this.getEndpoint(config), {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
          'dangerously-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: config.selectedModel || 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Ping' }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, message: `Anthropic error: ${err}` };
      }

      return {
        success: true,
        message: 'Anthropic Claude connected successfully!',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection failed.' };
    }
  }

  async chat(request: ChatRequest, config: ProviderConfig): Promise<ChatResponse> {
    if (!config.apiKey) throw new Error('Anthropic API key is missing.');
    const model = request.model || config.selectedModel || 'claude-3-5-sonnet-20241022';

    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const payload: any = {
      model,
      max_tokens: request.maxTokens ?? config.maxTokens ?? 1024,
      temperature: request.temperature ?? config.temperature ?? 0.7,
      messages,
    };

    if (request.systemPrompt) {
      payload.system = request.systemPrompt;
    }

    const res = await fetch(this.getEndpoint(config), {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'dangerously-allow-browser': 'true',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const content = data.content?.[0]?.text || '';

    return {
      message: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: Date.now(),
      },
      model: data.model || model,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
    };
  }

  async *chatStream(
    request: ChatRequest,
    config: ProviderConfig,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    if (!config.apiKey) throw new Error('Anthropic API key is missing.');
    const model = request.model || config.selectedModel || 'claude-3-5-sonnet-20241022';

    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const payload: any = {
      model,
      max_tokens: request.maxTokens ?? config.maxTokens ?? 1024,
      temperature: request.temperature ?? config.temperature ?? 0.7,
      messages,
      stream: true,
    };

    if (request.systemPrompt) {
      payload.system = request.systemPrompt;
    }

    const res = await fetch(this.getEndpoint(config), {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'dangerously-allow-browser': 'true',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic stream error (${res.status}): ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === 'content_block_delta') {
            const chunk = parsed.delta?.text || '';
            if (chunk) {
              yield chunk;
            }
          }
        } catch {
          // ignore chunk
        }
      }
    }
  }
}
