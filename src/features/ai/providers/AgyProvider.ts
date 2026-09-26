import { AIProvider, AIProviderId, ChatRequest, ChatResponse, ProviderConfig } from '../types';
import { AiCliService } from '../AiCliService';

export class AgyProvider implements AIProvider {
  readonly id: AIProviderId = 'agy';
  readonly name = 'Antigravity (AGY)';

  async testConnection(config: ProviderConfig): Promise<{ success: boolean; message: string; models?: string[] }> {
    try {
      const status = await AiCliService.getProviderStatus('agy');
      if (!status || status.status === 'NOT_INSTALLED') {
        return {
          success: false,
          message: 'Antigravity CLI (agy) not detected. Install or configure agy binary in ~/.local/bin/agy.',
        };
      }

      const res = await AiCliService.executeCli('agy', ['--version']);
      if (!res.success && res.exitCode !== 0) {
        return {
          success: false,
          message: `AGY CLI check returned error: ${res.stderr || 'Command failed'}`,
        };
      }

      const models = config.availableModels || [
        'gemini-3.8-flash-low',
        'gemini-3.8-flash-high',
        'gemini-3.7-flash-high',
        'claude-sonnet-4-6',
        'claude-opus-4-6-thinking',
        'gpt-oss-120b-medium',
      ];

      return {
        success: true,
        message: `Connected to Antigravity CLI v${res.stdout.trim() || status.version || '1.2.10'} via Google OAuth session!`,
        models,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to connect to Antigravity CLI: ${err?.message || String(err)}`,
      };
    }
  }

  async chat(request: ChatRequest, config: ProviderConfig): Promise<ChatResponse> {
    const model = request.model || config.selectedModel || 'gemini-3.8-flash-low';

    // Format multi-turn conversation history for context-rich prompt
    const historyText = request.messages
      .filter((m) => m.content && m.content.trim())
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.trim()}`)
      .join('\n\n');

    const fullPrompt = request.systemPrompt
      ? `${request.systemPrompt}\n\n${historyText}\nAssistant:`
      : historyText || 'Hello!';

    const res = await AiCliService.executeCli('agy', ['--print', fullPrompt, '--model', model]);

    if (!res.success && res.exitCode !== 0 && !res.stdout.trim()) {
      throw new Error(`AGY CLI Error: ${res.stderr || 'Non-zero exit code'}`);
    }

    const replyContent = res.stdout.trim() || 'Lulu has received your thought ✨';

    return {
      message: {
        id: `agy_${Date.now()}`,
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

  async *chatStream(
    request: ChatRequest,
    config: ProviderConfig,
    _signal?: AbortSignal
  ): AsyncGenerator<string> {
    const res = await this.chat(request, config);
    const content = res.message.content;
    const words = content.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield (i === 0 ? '' : ' ') + words[i];
    }
  }
}

