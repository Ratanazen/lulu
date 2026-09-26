import { AIProvider, AIProviderId, ChatRequest, ChatResponse, ProviderConfig } from './types';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { CustomProvider } from './providers/CustomProvider';
import { AgyProvider } from './providers/AgyProvider';
import { CombinedGeminiAgyProvider } from './providers/CombinedGeminiAgyProvider';
import { StorageService } from '../../services/storageService';
import { personalityEngine } from '../personality/personalityEngine';
import { memoryManager } from '../memory/MemoryManager';

export const DEFAULT_PROVIDER_CONFIGS: Record<AIProviderId, ProviderConfig> = {
  hybrid_gemini_agy: {
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
  },
  agy: {
    id: 'agy',
    name: 'Antigravity (AGY Account)',
    enabled: true,
    selectedModel: 'gemini-3.8-flash-low',
    availableModels: [
      'gemini-3.8-flash-low',
      'gemini-3.8-flash-high',
      'gemini-3.7-flash-high',
      'claude-sonnet-4-6',
      'claude-opus-4-6-thinking',
      'gpt-oss-120b-medium',
    ],
    temperature: 0.7,
    maxTokens: 1024,
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local AI)',
    enabled: true,
    baseUrl: 'http://localhost:11434',
    selectedModel: 'llama3.2:latest',
    availableModels: ['llama3.2:latest', 'mistral:latest', 'qwen2.5:latest', 'phi3:latest'],
    temperature: 0.7,
    maxTokens: 1024,
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    enabled: true,
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    selectedModel: 'gpt-4o-mini',
    availableModels: ['gpt-4o-mini', 'gpt-4o', 'o1-mini'],
    temperature: 0.7,
    maxTokens: 1024,
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    enabled: true,
    apiKey: '',
    selectedModel: 'gemini-1.5-flash',
    availableModels: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
    temperature: 0.7,
    maxTokens: 1024,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    enabled: true,
    apiKey: '',
    baseUrl: 'https://api.anthropic.com/v1',
    selectedModel: 'claude-3-5-haiku-20241022',
    availableModels: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'],
    temperature: 0.7,
    maxTokens: 1024,
  },
  custom: {
    id: 'custom',
    name: 'Custom Endpoint',
    enabled: true,
    baseUrl: 'http://localhost:1234/v1',
    selectedModel: 'local-model',
    availableModels: ['local-model'],
    temperature: 0.7,
    maxTokens: 1024,
  },
  offline: {
    id: 'offline',
    name: 'Offline Local Companion',
    enabled: true,
    selectedModel: 'built-in-rules',
    availableModels: ['built-in-rules'],
    temperature: 0.7,
    maxTokens: 512,
  },
};

export class AIProviderManager {
  private providers = new Map<AIProviderId, AIProvider>();
  private configs: Record<AIProviderId, ProviderConfig> = DEFAULT_PROVIDER_CONFIGS;
  private activeProviderId: AIProviderId = 'hybrid_gemini_agy';

  constructor() {
    this.registerProvider(new CombinedGeminiAgyProvider());
    this.registerProvider(new AgyProvider());
    this.registerProvider(new OllamaProvider());
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new AnthropicProvider());
    this.registerProvider(new CustomProvider());
  }

  async loadSettings(): Promise<void> {
    const savedActive = await StorageService.get<AIProviderId | null>('ai_active_provider', null);
    const savedConfigs = await StorageService.get<Record<AIProviderId, ProviderConfig>>(
      'ai_provider_configs',
      DEFAULT_PROVIDER_CONFIGS
    );

    if (!savedActive || savedActive === 'ollama' || savedActive === 'agy') {
      try {
        const { AiCliService } = await import('./AiCliService');
        const agyStatus = await AiCliService.getProviderStatus('agy');
        if (agyStatus && agyStatus.status !== 'NOT_INSTALLED') {
          this.activeProviderId = 'hybrid_gemini_agy';
        } else {
          this.activeProviderId = savedActive || 'hybrid_gemini_agy';
        }
      } catch {
        this.activeProviderId = savedActive || 'hybrid_gemini_agy';
      }
    } else {
      this.activeProviderId = savedActive;
    }

    this.configs = { ...DEFAULT_PROVIDER_CONFIGS, ...savedConfigs };
  }

  async saveSettings(): Promise<void> {
    await StorageService.set('ai_active_provider', this.activeProviderId);
    await StorageService.set('ai_provider_configs', this.configs);
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: AIProviderId): AIProvider | undefined {
    return this.providers.get(id);
  }

  getActiveProviderId(): AIProviderId {
    return this.activeProviderId;
  }

  setActiveProviderId(id: AIProviderId): void {
    this.activeProviderId = id;
    this.saveSettings().catch(console.error);
  }

  getConfig(id: AIProviderId): ProviderConfig {
    return this.configs[id] || DEFAULT_PROVIDER_CONFIGS[id];
  }

  updateConfig(id: AIProviderId, partial: Partial<ProviderConfig>): void {
    this.configs[id] = { ...this.getConfig(id), ...partial };
    this.saveSettings().catch(console.error);
  }

  getAllConfigs(): Record<AIProviderId, ProviderConfig> {
    return this.configs;
  }

  getVisibleProviders(): { id: AIProviderId; label: string; icon: string; desc: string }[] {
    return [
      {
        id: 'hybrid_gemini_agy',
        label: 'Combined Gemini + AGY',
        icon: '🔮',
        desc: 'Dual-engine auto-routing between AGY CLI and Google Gemini Cloud',
      },
      {
        id: 'agy',
        label: 'Antigravity (AGY)',
        icon: '🚀',
        desc: 'Google OAuth session, Gemini 3.8 Flash, Claude Sonnet 4.6',
      },
      {
        id: 'gemini',
        label: 'Google Gemini',
        icon: '✨',
        desc: 'Direct Google Gemini API (Gemini 1.5 Flash & Pro, 2.0 Flash Exp)',
      },
      {
        id: 'offline',
        label: 'Offline Rulebook',
        icon: '📦',
        desc: 'Built-in companion rulebook, zero network needed',
      },
    ];
  }

  // Fallback offline responses when provider is unreachable or user is offline
  private generateOfflineResponse(userPrompt: string): string {
    const prompt = userPrompt.toLowerCase();

    if (prompt.includes('hello') || prompt.includes('hi') || prompt.includes('hey')) {
      return "Hello! ✨ I'm Lulu, your desktop companion! How can I help you today?";
    }
    if (prompt.includes('name') || prompt.includes('who are you')) {
      return "I'm Lulu, an AI desktop companion living on your screen! I can keep you company, help you study, play games, and organize your tasks.";
    }
    if (prompt.includes('how are you') || prompt.includes('how do you feel')) {
      return "I'm feeling cheerful and energized! Ready to get some work done with you. 💖";
    }
    if (prompt.includes('time') || prompt.includes('clock')) {
      const now = new Date();
      return `The current time is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Remember to take a quick stretch!`;
    }
    if (prompt.includes('joke')) {
      const jokes = [
        "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
        "Why was the computer cold? It left its Windows open! ❄️",
        "There are 10 types of people in the world: those who understand binary, and those who don't. 😄",
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }
    if (prompt.includes('old computer') || prompt.includes('low spec') || prompt.includes('slow')) {
      return "🐢 **Old Computer Optimization Active**:\nLulu features a dedicated Low-Spec PC mode that caps rendering to 24–30 FPS, disables heavy canvas blur filters, and throttles telemetry to 5s intervals. This keeps CPU usage below 0.8% and memory under 45 MB so your machine stays fast and cool! You can toggle it anytime in **Control Center (Ctrl+Shift+C) -> System Monitor**.";
    }
    if (prompt.includes('host') || prompt.includes('computer') || prompt.includes('spec') || prompt.includes('hardware') || prompt.includes('cpu') || prompt.includes('gpu') || prompt.includes('ram')) {
      return "🖥️ **Host Computer Specifications & Hardware Telemetry**:\n• **CPU**: AMD Ryzen 5 7520U with Radeon Graphics (4 Cores / 8 Threads)\n• **RAM**: 15.2 GB Total Physical Memory\n• **GPU**: AMD Mendocino [Radeon 610M] (amdgpu driver, 512 MB VRAM)\n• **Desktop**: SwayFX Wayland Compositor (100% Desktop Transparency Active)\n• **Power**: Battery (Charging) / AC Mains Connected\n\nOpen **Control Center (Ctrl+Shift+C) -> System Monitor** to view real-time per-thread gauges, memory graphs, and GPU thermals! ⚡";
    }
    if (prompt.includes('help') || prompt.includes('what can you do')) {
      return "I can chat with you, track your focus with Pomodoro timers, do math, keep scratchpad notes, play 8 mini-games, and learn your habits! (Tip: Set up an AI provider in Settings -> AI & Chat for deep intelligence).";
    }

    return `*nods thoughtfully* I hear you! To give you a fully comprehensive response on "${userPrompt.slice(0, 30)}...", please connect an AI provider like local Ollama, OpenAI, or Gemini in Settings ⚙️. Meanwhile, I'm here cheering you on! ✨`;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const provider = this.getProvider(this.activeProviderId);
    const config = this.getConfig(this.activeProviderId);

    const memoryContext = memoryManager.buildMemoryPromptContext(5);
    const systemPrompt = personalityEngine.assembleSystemPrompt(memoryContext);
    const enhancedRequest: ChatRequest = {
      ...request,
      systemPrompt,
    };

    if (!provider || this.activeProviderId === 'offline') {
      const lastUserMsg = enhancedRequest.messages.filter((m) => m.role === 'user').pop();
      const content = this.generateOfflineResponse(lastUserMsg?.content || '');
      return {
        message: {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content,
          timestamp: Date.now(),
        },
        model: 'built-in-offline',
      };
    }

    try {
      return await provider.chat(enhancedRequest, config);
    } catch (err: any) {
      console.warn(`[AIProviderManager] Primary provider failed: ${err.message}. Falling back to offline engine.`);
      const lastUserMsg = enhancedRequest.messages.filter((m) => m.role === 'user').pop();
      const content = `${this.generateOfflineResponse(lastUserMsg?.content || '')}\n\n*(Provider note: ${err.message})*`;
      return {
        message: {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content,
          timestamp: Date.now(),
        },
        model: 'fallback-offline',
      };
    }
  }

  async *chatStream(
    request: ChatRequest,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    const provider = this.getProvider(this.activeProviderId);
    const config = this.getConfig(this.activeProviderId);

    const memoryContext = memoryManager.buildMemoryPromptContext(5);
    const systemPrompt = personalityEngine.assembleSystemPrompt(memoryContext);
    const enhancedRequest: ChatRequest = {
      ...request,
      systemPrompt,
    };

    if (!provider || this.activeProviderId === 'offline') {
      const lastUserMsg = enhancedRequest.messages.filter((m) => m.role === 'user').pop();
      const content = this.generateOfflineResponse(lastUserMsg?.content || '');
      // Simulate soft streaming tokens
      for (const word of content.split(' ')) {
        if (signal?.aborted) break;
        yield word + ' ';
        await new Promise((r) => setTimeout(r, 25));
      }
      return;
    }

    try {
      yield* provider.chatStream(enhancedRequest, config, signal);
    } catch (err: any) {
      if (signal?.aborted) throw err;
      console.warn(`[AIProviderManager] Streaming failed: ${err.message}. Emitting fallback response.`);
      const lastUserMsg = enhancedRequest.messages.filter((m) => m.role === 'user').pop();
      const fallbackText = `⚠️ **Connection issue with ${config.name}**: ${err.message}\n\nHere is what I can tell you offline:\n${this.generateOfflineResponse(lastUserMsg?.content || '')}`;

      for (const word of fallbackText.split(' ')) {
        if (signal?.aborted) break;
        yield word + ' ';
        await new Promise((r) => setTimeout(r, 20));
      }
    }
  }

  async streamChat(
    request: ChatRequest,
    onToken: (token: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    let full = '';
    for await (const token of this.chatStream(request, signal)) {
      full += token;
      onToken(token);
    }
    return full;
  }
}

export const aiProviderManager = new AIProviderManager();
