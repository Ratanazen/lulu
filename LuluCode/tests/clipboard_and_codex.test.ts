import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyToClipboard } from '../src/utils/clipboard';
import { useProviderStore } from '../src/stores/useProviderStore';

describe('System Clipboard & Codex Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully copies text via clipboard utility', async () => {
    // Mock navigator.clipboard
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    const res = await copyToClipboard('const answer = 42;');
    expect(res).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('const answer = 42;');
  });

  it('handles provider switching across OpenAI, Gemini, Ollama, and Custom', () => {
    const store = useProviderStore.getState();

    // 1. Switch to OpenAI
    store.setActiveType('OPENAI');
    expect(useProviderStore.getState().activeType).toBe('OPENAI');
    expect(useProviderStore.getState().endpoint).toBe('https://api.openai.com/v1');
    expect(useProviderStore.getState().selectedModel).toBe('gpt-4o');

    // 2. Switch to Google Gemini
    store.setActiveType('GOOGLE_GEMINI');
    expect(useProviderStore.getState().activeType).toBe('GOOGLE_GEMINI');
    expect(useProviderStore.getState().endpoint).toBe('https://generativelanguage.googleapis.com');
    expect(useProviderStore.getState().selectedModel).toBe('gemini-1.5-flash');

    // 3. Switch to Local Ollama
    store.setActiveType('LOCAL_OLLAMA');
    expect(useProviderStore.getState().activeType).toBe('LOCAL_OLLAMA');
    expect(useProviderStore.getState().endpoint).toBe('http://localhost:11434');

    // 4. Switch to Custom Offline
    store.setActiveType('CUSTOM');
    expect(useProviderStore.getState().activeType).toBe('CUSTOM');
    expect(useProviderStore.getState().selectedModel).toBe('offline-deterministic');
  });

  it('updates API key and custom models correctly', () => {
    const store = useProviderStore.getState();
    store.setApiKey('test-sk-key-12345');
    expect(useProviderStore.getState().apiKey).toBe('test-sk-key-12345');

    store.setSelectedModel('o1-preview');
    expect(useProviderStore.getState().selectedModel).toBe('o1-preview');
  });
});
