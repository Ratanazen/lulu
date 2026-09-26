import { describe, it, expect, vi } from 'vitest';
import { useLuluStore } from '../src/stores/useLuluStore';

describe('Chat UX & Slash Command Handling', () => {
  it('provides helpful guidance when an unknown slash command is entered', async () => {
    const store = useLuluStore.getState();
    await store.sendChatMessage('/teleport');

    const updatedMessages = useLuluStore.getState().chatMessages;
    const lastMsg = updatedMessages[updatedMessages.length - 1];

    expect(lastMsg).toBeDefined();
    expect(lastMsg.role).toBe('assistant');
    expect(lastMsg.content).toContain('Unknown command "/teleport"');
    expect(lastMsg.content).toContain('Available Commands:');
    expect(lastMsg.content).toContain('/calc');
    expect(lastMsg.content).toContain('/timer');
  });

  it('preserves valid tool command behavior', async () => {
    const store = useLuluStore.getState();
    await store.sendChatMessage('/calc 10 + 25');

    const updatedMessages = useLuluStore.getState().chatMessages;
    const lastMsg = updatedMessages[updatedMessages.length - 1];

    expect(lastMsg).toBeDefined();
    expect(lastMsg.role).toBe('assistant');
    expect(lastMsg.content).toContain('35');
  });
});
