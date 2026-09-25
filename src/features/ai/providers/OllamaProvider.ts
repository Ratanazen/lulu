import { AIProvider, AIProviderId, ChatRequest, ChatResponse, ProviderConfig } from '../types';

export class OllamaProvider implements AIProvider {
  readonly id: AIProviderId = 'ollama';
  readonly name = 'Ollama (Local AI)';

  private getBaseUrl(config: ProviderConfig): string {
    return (config.baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
  }

  async testConnection(config: ProviderConfig): Promise<{ success: boolean; message: string; models?: string[] }> {
    const url = `${this.getBaseUrl(config)}/api/tags`;
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        return {
          success: false,
          message: `Ollama returned status ${res.status}. Please verify Ollama is running.`,
        };
      }

      const data = await res.json();
      const models = Array.isArray(data.models) ? data.models.map((m: any) => m.name) : [];
      if (models.length === 0) {
        return {
          success: true,
          message: 'Ollama is running, but no models are installed yet. Run `ollama run llama3.2` to get started.',
          models: [],
        };
      }

      return {
        success: true,
        message: `Connected! Found ${models.length} local model(s): ${models.slice(0, 3).join(', ')}${models.length > 3 ? '...' : ''}`,
        models,
      };
    } catch {
      return {
        success: false,
        message: 'Ollama not detected on local port 11434. Start Ollama with `ollama serve` or choose a cloud AI provider.',
      };
    }
  }

  async chat(request: ChatRequest, config: ProviderConfig): Promise<ChatResponse> {
    const url = `${this.getBaseUrl(config)}/api/chat`;
    const model = request.model || config.selectedModel || 'llama3.2:latest';

    const messages = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const payload = {
      model,
      messages,
      stream: false,
      options: {
        temperature: request.temperature ?? config.temperature ?? 0.7,
        num_predict: request.maxTokens ?? config.maxTokens ?? 1024,
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Ollama error (${res.status}): ${err}`);
      }

      const data = await res.json();
      return {
        message: {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: data.message?.content || '',
          timestamp: Date.now(),
        },
        model: data.model || model,
      };
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        throw new Error('Local Ollama is offline. Please launch `ollama serve` or pick another AI provider in Settings.');
      }
      throw err;
    }
  }

  async *chatStream(
    request: ChatRequest,
    config: ProviderConfig,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    const url = `${this.getBaseUrl(config)}/api/chat`;
    const model = request.model || config.selectedModel || 'llama3.2:latest';

    const messages = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    for (const msg of request.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const payload = {
      model,
      messages,
      stream: true,
      options: {
        temperature: request.temperature ?? config.temperature ?? 0.7,
        num_predict: request.maxTokens ?? config.maxTokens ?? 1024,
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Ollama stream error (${res.status}): ${err}`);
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n').filter(Boolean)) {
          try {
            const parsed = JSON.parse(line);
            const token = parsed.message?.content || '';
            if (token) {
              yield token;
            }
          } catch {
            // ignore invalid json line
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        throw new Error('Local Ollama is offline. Please launch `ollama serve` or configure a cloud provider.');
      }
      throw err;
    }
  }
}
