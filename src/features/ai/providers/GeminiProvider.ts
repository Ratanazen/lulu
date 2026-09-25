import { AIProvider, AIProviderId, ChatRequest, ChatResponse, ProviderConfig } from '../types';

export class GeminiProvider implements AIProvider {
  readonly id: AIProviderId = 'gemini';
  readonly name = 'Google Gemini';

  private getModel(config: ProviderConfig, request?: ChatRequest): string {
    return request?.model || config.selectedModel || 'gemini-1.5-flash';
  }

  async testConnection(config: ProviderConfig): Promise<{ success: boolean; message: string; models?: string[] }> {
    if (!config.apiKey) {
      return { success: false, message: 'API key is required for Gemini.' };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.text();
        return { success: false, message: `Gemini API error: ${err}` };
      }
      const data = await res.json();
      const models = (data.models || [])
        .map((m: any) => m.name.replace('models/', ''))
        .filter((name: string) => name.includes('gemini'));
      return { success: true, message: `Connected! Found ${models.length} Gemini models.`, models };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection failed.' };
    }
  }

  async chat(request: ChatRequest, config: ProviderConfig): Promise<ChatResponse> {
    if (!config.apiKey) throw new Error('Gemini API key is missing.');
    const model = this.getModel(config, request);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

    const contents = request.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const payload: any = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? config.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? config.maxTokens ?? 1024,
      },
    };

    if (request.systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: request.systemPrompt }],
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      message: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
      },
      model,
    };
  }

  async streamChat(
    request: ChatRequest,
    config: ProviderConfig,
    onToken: (token: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    if (!config.apiKey) throw new Error('Gemini API key is missing.');
    const model = this.getModel(config, request);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${config.apiKey}`;

    const contents = request.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const payload: any = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? config.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? config.maxTokens ?? 1024,
      },
    };

    if (request.systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: request.systemPrompt }],
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini stream error (${res.status}): ${err}`);
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
        if (!trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.slice(5).trim();
        try {
          const parsed = JSON.parse(jsonStr);
          const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (chunk) {
            fullText += chunk;
            onToken(chunk);
          }
        } catch {
          // ignore chunk
        }
      }
    }

    return fullText;
  }
}
