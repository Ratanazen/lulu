import { AIProvider, AIProviderId, ChatRequest, ChatResponse, ProviderConfig } from '../types';
import { AiCliService } from '../AiCliService';

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g, '').trim();
}

export class GeminiProvider implements AIProvider {
  readonly id: AIProviderId = 'gemini';
  readonly name = 'Google Gemini';

  private getModel(config: ProviderConfig, request?: ChatRequest): string {
    return request?.model || config.selectedModel || 'gemini-3.8-flash-low';
  }

  async testConnection(config: ProviderConfig): Promise<{ success: boolean; message: string; models?: string[] }> {
    if (!config.apiKey) {
      try {
        const status = await AiCliService.getProviderStatus('gemini');
        if (status && status.status !== 'NOT_INSTALLED') {
          const res = await AiCliService.executeCli('gemini', ['--version']);
          if (res.success || res.exitCode === 0) {
            return {
              success: true,
              message: `Connected to Gemini CLI v${res.stdout.trim() || status.version || '1.2.11'} via Google OAuth session!`,
              models: config.availableModels,
            };
          }
        }
      } catch {}
      return { success: false, message: 'API key is required for direct Gemini REST or ensure Gemini CLI is installed.' };
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
    const model = this.getModel(config, request);

    if (!config.apiKey) {
      // Use Gemini CLI protocol via local OAuth session
      const historyText = request.messages
        .filter((m) => m.content && m.content.trim())
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.trim()}`)
        .join('\n\n');

      const fullPrompt = request.systemPrompt
        ? `${request.systemPrompt}\n\n${historyText}\nAssistant:`
        : historyText || 'Hello!';

      const res = await AiCliService.executeCli('gemini', ['--print', fullPrompt, '--model', model]);
      if (!res.success && res.exitCode !== 0 && !res.stdout.trim()) {
        throw new Error(`Gemini CLI Error: ${res.stderr || 'Non-zero exit code'}`);
      }

      const cleaned = stripAnsi(res.stdout);
      const replyContent = cleaned || res.stdout.trim() || 'Gemini response received ✨';

      return {
        message: {
          id: `gemini_${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          timestamp: Date.now(),
        },
        model,
        usage: {
          promptTokens: Math.round(fullPrompt.length / 4),
          completionTokens: Math.round(replyContent.length / 4),
          totalTokens: Math.round((fullPrompt.length + replyContent.length) / 4),
        },
      };
    }

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

  async *chatStream(
    request: ChatRequest,
    config: ProviderConfig,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    if (!config.apiKey) {
      const res = await this.chat(request, config);
      const content = res.message.content;
      const words = content.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield (i === 0 ? '' : ' ') + words[i];
      }
      return;
    }

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
          const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (chunk) {
            yield chunk;
          }
        } catch {
          // ignore chunk
        }
      }
    }
  }
}
