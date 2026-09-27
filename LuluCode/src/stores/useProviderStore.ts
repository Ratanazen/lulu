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

  detectOllama: () => Promise<void>;
  setActiveType: (type: ProviderType) => void;
  setEndpoint: (url: string) => void;
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
}

export const useProviderStore = create<ProviderStore>((set, get) => ({
  activeType: 'LOCAL_OLLAMA',
  endpoint: 'http://localhost:11434',
  apiKey: '',
  selectedModel: 'qwen2.5-coder:latest',
  availableModels: [],
  ollamaStatus: {
    is_available: false,
    status: 'OFFLINE',
    models: [],
  },
  isDetecting: false,

  detectOllama: async () => {
    set({ isDetecting: true });
    try {
      const res = await invokeCommand<OllamaStatus>('detect_ollama', {
        endpoint: get().endpoint,
      });

      set({
        ollamaStatus: res,
        availableModels: res.models,
        selectedModel: res.models.length > 0 ? res.models[0] : get().selectedModel,
        isDetecting: false,
      });
    } catch {
      set({
        ollamaStatus: { is_available: false, status: 'OFFLINE', models: [] },
        isDetecting: false,
      });
    }
  },

  setActiveType: (type) => set({ activeType: type }),
  setEndpoint: (url) => set({ endpoint: url }),
  setApiKey: (key) => set({ apiKey: key }),
  setSelectedModel: (model) => set({ selectedModel: model }),
}));
