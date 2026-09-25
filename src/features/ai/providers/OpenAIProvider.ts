import { AIProvider, AIProviderId, ChatRequest, ChatResponse, ProviderConfig } from '../types';

export class OpenAIProvider implements AIProvider {
  readonly id: AIProviderId = 'openai';
  readonly name = 'OpenAI';

  private getEndpoint(config: ProviderConfig, path: string): string {
    const base = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    return `${base}${path}`;
  }

  async testConnection(config: ProviderConfig): Promise<{ success: boolean; message: string; models?: string[] }> {
    if (!config.apiKey && !config.baseUrl?.includes('localhost')) {
      return { success: false, message: 'API key is required for OpenAI.' };
    }

    try {
      const res = await fetch(this.getEndpoint(config, '/models'), {
        headers: {
          Authorization: `Bearer ${config.apiKey || ''}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, message: `HTTP ${res.status}: ${errText}` };
      }

      const data = await res.json();
      const models = Array.isArray(data.data) ? data.data.map((m: any) => m.id) : [];
      return { success: true, message: `Connected! Found ${models.length} models.`, models };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection failed.' };
    }
  }

  async chat(request: ChatRequest, config: ProviderConfig): Promise<ChatResponse> {
    const messages = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const payload = {
      model: request.model || config.selectedModel || 'gpt-4o-mini',
      messages,
      temperature: request.temperature ?? config.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? config.maxTokens ?? 1024,
      stream: false,
    };

    const res = await fetch(this.getEndpoint(config, '/chat/completions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey || ''}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      message: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: Date.now(),
      },
      model: data.model || payload.model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async streamChat(
    request: ChatRequest,
    config: ProviderConfig,
    onToken: (token: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const messages = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const payload = {
      model: request.model || config.selectedModel || 'gpt-4o-mini',
      messages,
      temperature: request.temperature ?? config.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? config.maxTokens ?? 1024,
      stream: true,
    };

    const res = await fetch(this.getEndpoint(config, '/chat/completions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey || ''}`,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI stream error (${res.status}): ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported.');

    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            onToken(delta);
          }
        } catch {
          // ignore partial chunks
        }
      }
    }

    return fullText;
  }
}
