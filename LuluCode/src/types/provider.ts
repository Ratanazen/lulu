export type ProviderType = 'LOCAL_OLLAMA' | 'OPENAI_COMPATIBLE' | 'CUSTOM';

export interface OllamaStatus {
  is_available: boolean;
  status: 'CONNECTED' | 'OFFLINE' | 'NO_MODELS' | 'ERROR';
  models: string[];
}

export interface AIProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  endpoint: string;
  apiKey?: string;
  model: string;
  isActive: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  type: ProviderType;
  chat(prompt: string, systemPrompt?: string): Promise<string>;
  stream?(prompt: string, onToken: (token: string) => void): Promise<void>;
  cancel?(): void;
  listModels?(): Promise<string[]>;
}
