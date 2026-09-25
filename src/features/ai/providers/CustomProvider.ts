import { AIProvider, AIProviderId, ChatRequest, ChatResponse, ProviderConfig } from '../types';

export class CustomProvider implements AIProvider {
  readonly id: AIProviderId = 'custom';
  readonly name = 'Custom Endpoint (OpenAI Compatible)';

  private getEndpoint(config: ProviderConfig, path: string): string {
    const base = (config.baseUrl || 'http://localhost:1234/v1').replace(/\/+$/, '');
    return `${base}${path}`;
  }

  async testConnection(config: ProviderConfig): Promise<{ success: boolean; message: string; models?: string[] }> {
    try {
      const headers: Record<string, string> = {};
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

      const res = await fetch(this.getEndpoint(config, '/models'), { headers });
      if (!res.ok) {
        return { success: false, message: `Server returned HTTP ${res.status}.` };
      }
      const data = await res.json();
      const models = Array.isArray(data.data) ? data.data.map((m: any) => m.id) : [];
      return { success: true, message: `Connected! Found ${models.length} model(s).`, models };
    } catch (err: any) {
      return { success: false, message: err.message || 'Custom endpoint connection failed.' };
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

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

    const payload = {
      model: request.model || config.selectedModel || 'default',
      messages,
      temperature: request.temperature ?? config.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? config.maxTokens ?? 1024,
      stream: false,
    };

    const res = await fetch(this.getEndpoint(config, '/chat/completions'), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Custom provider error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return {
      message: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || '',
        timestamp: Date.now(),
      },
      model: data.model || payload.model,
    };
  }

  async *chatStream(
    request: ChatRequest,
    config: ProviderConfig,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    const messages = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

    const payload = {
      model: request.model || config.selectedModel || 'default',
      messages,
      temperature: request.temperature ?? config.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? config.maxTokens ?? 1024,
      stream: true,
    };

    const res = await fetch(this.getEndpoint(config, '/chat/completions'), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Custom provider stream error (${res.status}): ${err}`);
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
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            yield delta;
          }
        } catch {
          // ignore
        }
      }
    }
  }
}
