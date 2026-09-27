import { create } from 'zustand';
import { OllamaStatus, ProviderType } from '../types/provider';
import { invokeCommand } from '../services/tauriBridge';

interface ProviderStore {
  activeType: ProviderType;
  endpoint: string;
  apiKey: string;
  selectedModel: string;
  availableModels: string[];
  ollamaStatus: OllamaStatus;
  isDetecting: boolean;
  testStatus: { testing: boolean; message?: string; success?: boolean } | null;

  detectOllama: () => Promise<void>;
  setActiveType: (type: ProviderType) => void;
  setEndpoint: (url: string) => void;
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  testConnection: () => Promise<{ success: boolean; message: string }>;
}

const STORAGE_KEY_PREFIX = 'lulucode_provider_';

function getStored(key: string, defaultVal: string): string {
  try {
    return localStorage.getItem(STORAGE_KEY_PREFIX + key) || defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored(key: string, val: string) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, val);
  } catch {
    // Ignore in non-browser envs
  }
}

export const useProviderStore = create<ProviderStore>((set, get) => ({
  activeType: (getStored('type', 'GOOGLE_GEMINI') as ProviderType),
  endpoint: getStored('endpoint', 'https://generativelanguage.googleapis.com'),
  apiKey: getStored('api_key', ''),
  selectedModel: getStored('model', 'gemini-2.0-flash'),
  availableModels: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  ollamaStatus: {
    is_available: false,
    status: 'OFFLINE',
    models: [],
  },
  isDetecting: false,
  testStatus: null,

  detectOllama: async () => {
    set({ isDetecting: true });
    try {
      const res = await invokeCommand<OllamaStatus>('detect_ollama', {
        endpoint: get().endpoint,
      });

      set({
        ollamaStatus: res,
        availableModels: res.models,
        selectedModel: res.models.length > 0 && get().activeType === 'LOCAL_OLLAMA' ? res.models[0] : get().selectedModel,
        isDetecting: false,
      });
    } catch {
      set({
        ollamaStatus: { is_available: false, status: 'OFFLINE', models: [] },
        isDetecting: false,
      });
    }
  },

  setActiveType: (type) => {
    setStored('type', type);
    let defaultEndpoint = get().endpoint;
    let defaultModel = get().selectedModel;

    if (type === 'LOCAL_OLLAMA') {
      defaultEndpoint = 'http://localhost:11434';
      defaultModel = 'qwen2.5-coder:latest';
    } else if (type === 'OPENAI') {
      defaultEndpoint = 'https://api.openai.com/v1';
      defaultModel = 'gpt-4o';
    } else if (type === 'GOOGLE_GEMINI') {
      defaultEndpoint = 'https://generativelanguage.googleapis.com';
      defaultModel = 'gemini-1.5-flash';
    } else if (type === 'OPENAI_COMPATIBLE') {
      defaultEndpoint = 'http://localhost:8000/v1';
      defaultModel = 'deepseek-chat';
    } else if (type === 'CUSTOM') {
      defaultEndpoint = '';
      defaultModel = 'offline-deterministic';
    }

    set({ activeType: type, endpoint: defaultEndpoint, selectedModel: defaultModel, testStatus: null });
    setStored('endpoint', defaultEndpoint);
    setStored('model', defaultModel);
  },

  setEndpoint: (url) => {
    setStored('endpoint', url);
    set({ endpoint: url });
  },

  setApiKey: (key) => {
    setStored('api_key', key);
    set({ apiKey: key });
  },

  setSelectedModel: (model) => {
    setStored('model', model);
    set({ selectedModel: model });
  },

  testConnection: async () => {
    set({ testStatus: { testing: true } });
    try {
      const res = await invokeCommand<string>('test_ai_connection', {
        request: {
          provider_type: get().activeType,
          endpoint: get().endpoint,
          model: get().selectedModel,
          api_key: get().apiKey || null,
          prompt: 'ping',
        },
      });

      const outcome = { success: true, message: res || 'Connection verified successfully!' };
      set({ testStatus: { testing: false, success: true, message: outcome.message } });
      return outcome;
    } catch (err: any) {
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Connection test failed';
      set({ testStatus: { testing: false, success: false, message: errorMsg } });
      return { success: false, message: errorMsg };
    }
  },
}));
