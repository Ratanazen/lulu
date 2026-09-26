// AI Provider Subsystem Types

export type AIProviderId = 'agy' | 'openai' | 'gemini' | 'anthropic' | 'ollama' | 'custom' | 'offline';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
}

export interface ChatResponse {
  message: ChatMessage;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface OllamaModelInfo {
  name: string;
  size: number;
  digest: string;
  modifiedAt: string;
}

export interface ProviderConfig {
  id: AIProviderId;
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  selectedModel: string;
  availableModels: string[];
  temperature: number;
  maxTokens: number;
}

export interface AIProvider {
  readonly id: AIProviderId;
  readonly name: string;

  chat(request: ChatRequest, config: ProviderConfig): Promise<ChatResponse>;

  chatStream(
    request: ChatRequest,
    config: ProviderConfig,
    signal?: AbortSignal
  ): AsyncGenerator<string>;

  testConnection(config: ProviderConfig): Promise<{ success: boolean; message: string; models?: string[] }>;
}
