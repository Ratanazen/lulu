import { AIProvider, AIProviderId, ChatRequest, ChatResponse, ProviderConfig } from '../types';
import { AgyProvider } from './AgyProvider';
import { GeminiProvider } from './GeminiProvider';
import { AiCliService } from '../AiCliService';

export class CombinedGeminiAgyProvider implements AIProvider {
  readonly id: AIProviderId = 'hybrid_gemini_agy';
  readonly name = 'Combined Gemini + AGY Engine';

  private agyProvider = new AgyProvider();
  private geminiProvider = new GeminiProvider();

  async testConnection(config: ProviderConfig): Promise<{ success: boolean; message: string; models?: string[] }> {
    const results: string[] = [];
    let agyOk = false;
    let geminiOk = false;

    // 1. Test local AGY CLI connection
    try {
      const agyRes = await this.agyProvider.testConnection(config);
      if (agyRes.success) {
        agyOk = true;
        results.push(`✓ AGY CLI: Active (${agyRes.message})`);
      } else {
        results.push(`✗ AGY CLI: ${agyRes.message}`);
      }
    } catch (e: any) {
      results.push(`✗ AGY CLI: ${e?.message || String(e)}`);
    }

    // 2. Test Google Gemini Cloud API connection if apiKey is configured
    if (config.apiKey) {
      try {
        const geminiRes = await this.geminiProvider.testConnection(config);
        if (geminiRes.success) {
          geminiOk = true;
          results.push(`✓ Gemini Cloud: Active (${geminiRes.models?.length || 0} models available)`);
        } else {
          results.push(`✗ Gemini Cloud: ${geminiRes.message}`);
        }
      } catch (e: any) {
        results.push(`✗ Gemini Cloud: ${e?.message || String(e)}`);
      }
    } else {
      results.push('ℹ️ Gemini Cloud: No API key set (AGY CLI operates as primary offline/local engine)');
    }

    const combinedModels = Array.from(new Set([
      'auto',
      'gemini-3.8-flash-low',
      'gemini-3.8-flash-high',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
      'claude-sonnet-4-6',
      'gpt-oss-120b-medium',
    ]));

    const overallSuccess = agyOk || geminiOk;
    return {
      success: overallSuccess,
      message: results.join('\n'),
      models: combinedModels,
    };
  }

  async chat(request: ChatRequest, config: ProviderConfig): Promise<ChatResponse> {
    const selected = request.model || config.selectedModel || 'auto';
    const isCloudModel = selected.startsWith('gemini-1.5') || selected.startsWith('gemini-2.0');

    // Strategy 1: If cloud model explicitly requested and API key is present, try Gemini first
    if (isCloudModel && config.apiKey) {
      try {
        const res = await this.geminiProvider.chat(request, config);
        return {
          ...res,
          model: `gemini-cloud:${res.model}`,
        };
      } catch (err: any) {
        console.warn('[CombinedGeminiAgy] Gemini Cloud error, falling back to AGY CLI:', err.message);
      }
    }

    // Strategy 2: Attempt AGY CLI (Google OAuth session / host CLI)
    try {
      const agyModel = selected === 'auto' || isCloudModel ? 'gemini-3.8-flash-low' : selected;
      const res = await this.agyProvider.chat({ ...request, model: agyModel }, config);
      return {
        ...res,
        model: `agy-cli:${res.model}`,
      };
    } catch (agyErr: any) {
      console.warn('[CombinedGeminiAgy] AGY CLI failed, attempting Gemini Cloud fallback:', agyErr.message);

      // Strategy 3: Automatic fallback to Gemini Cloud API if API key is provided
      if (config.apiKey) {
        const cloudModel = isCloudModel ? selected : 'gemini-1.5-flash';
        const res = await this.geminiProvider.chat({ ...request, model: cloudModel }, config);
        return {
          ...res,
          model: `gemini-cloud:${res.model} (fallback)`,
        };
      }

      throw new Error(`Combined Engine Error: AGY CLI failed (${agyErr.message}) and no Gemini API key configured for cloud fallback.`);
    }
  }

  async *chatStream(
    request: ChatRequest,
    config: ProviderConfig,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    const selected = request.model || config.selectedModel || 'auto';
    const isCloudModel = selected.startsWith('gemini-1.5') || selected.startsWith('gemini-2.0');

    if (isCloudModel && config.apiKey) {
      try {
        yield* this.geminiProvider.chatStream(request, config, signal);
        return;
      } catch (err: any) {
        console.warn('[CombinedGeminiAgy] Stream cloud failure, falling back to AGY CLI:', err.message);
      }
    }

    try {
      const agyModel = selected === 'auto' || isCloudModel ? 'gemini-3.8-flash-low' : selected;
      yield* this.agyProvider.chatStream({ ...request, model: agyModel }, config, signal);
    } catch (agyErr: any) {
      if (config.apiKey) {
        const cloudModel = isCloudModel ? selected : 'gemini-1.5-flash';
        yield* this.geminiProvider.chatStream({ ...request, model: cloudModel }, config, signal);
        return;
      }
      throw agyErr;
    }
  }
}
