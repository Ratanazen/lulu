import { MemoryCategory, MemoryItem, ConversationSession } from './types';
import { StorageService, getMemories, saveMemory, deleteMemory } from '../../services/storageService';

export class MemoryManager {
  private memories: Map<string, MemoryItem> = new Map();
  private sessions: Map<string, ConversationSession> = new Map();
  private activeSessionId: string = 'session-default';

  async initialize(): Promise<void> {
    const savedMemories = await getMemories();
    this.memories.clear();
    for (const item of savedMemories) {
      this.memories.set(item.id, {
        id: item.id,
        key: item.title,
        value: item.content,
        category: item.category as MemoryCategory,
        importance: item.importance,
        pinned: item.user_defined,
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.created_at).getTime(),
      });
    }

    const savedSessions = await StorageService.get<ConversationSession[]>('lulu_chat_sessions', [
      {
        id: 'session-default',
        title: 'General Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
      },
    ]);
    this.sessions.clear();
    for (const session of savedSessions) {
      this.sessions.set(session.id, session);
    }
  }

  private async persist(): Promise<void> {
    // Only saving sessions here, memories are saved individually
    await StorageService.set('lulu_chat_sessions', Array.from(this.sessions.values()));
  }

  // --- Long-Term Memory CRUD ---

  remember(
    key: string,
    value: string,
    category: MemoryCategory = 'fact',
    importance: number = 3,
    pinned: boolean = false
  ): MemoryItem {
    let existing: MemoryItem | undefined;
    for (const item of this.memories.values()) {
      if (item.key.toLowerCase() === key.toLowerCase()) {
        existing = item;
        break;
      }
    }

    const now = Date.now();
    const item: MemoryItem = {
      id: existing ? existing.id : `mem-${now}-${Math.random().toString(36).substring(2, 7)}`,
      key: key.trim(),
      value: value.trim(),
      category,
      importance: Math.min(5, Math.max(1, importance)),
      pinned,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.memories.set(item.id, item);
    saveMemory(item.id, item.key, item.value, item.category, item.importance, item.pinned ?? false).catch(console.error);
    return item;
  }

  forget(id: string): boolean {
    const deleted = this.memories.delete(id);
    if (deleted) {
      deleteMemory(id).catch(console.error);
    }
    return deleted;
  }

  async searchMemories(query: string): Promise<MemoryItem[]> {
    const results = await getMemories(query);
    return results.map(item => ({
      id: item.id,
      key: item.title,
      value: item.content,
      category: item.category as MemoryCategory,
      importance: item.importance,
      pinned: item.user_defined,
      createdAt: new Date(item.created_at).getTime(),
      updatedAt: new Date(item.created_at).getTime(),
    }));
  }

  search(query: string): MemoryItem[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAll();

    return Array.from(this.memories.values())
      .filter(
        (m) =>
          m.key.toLowerCase().includes(q) ||
          m.value.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      )
      .sort((a, b) => (b.pinned ? 10 : b.importance) - (a.pinned ? 10 : a.importance));
  }

  getAll(): MemoryItem[] {
    return Array.from(this.memories.values()).sort(
      (a, b) => (b.pinned ? 10 : b.importance) - (a.pinned ? 10 : a.importance)
    );
  }

  clearAll(): void {
    for (const key of this.memories.keys()) {
      deleteMemory(key).catch(console.error);
    }
    this.memories.clear();
  }

  // Convert memories into concise system prompt context
  buildMemoryPromptContext(maxItems: number = 8): string {
    const items = this.getAll().slice(0, maxItems);
    if (items.length === 0) return '';

    const lines = items.map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`);
    return `\n\n[USER RECALLED MEMORIES & FACTS]:\n${lines.join('\n')}\nUse these remembered details naturally to personalize your answers.`;
  }

  // --- Export / Import ---

  exportJson(): string {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        memories: Array.from(this.memories.values()),
      },
      null,
      2
    );
  }

  importJson(jsonString: string): { success: boolean; importedCount: number; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!Array.isArray(data.memories)) {
        return { success: false, importedCount: 0, error: 'Invalid memory export format.' };
      }

      let count = 0;
      for (const item of data.memories) {
        if (item.key && item.value) {
          this.remember(item.key, item.value, item.category || 'fact', item.importance || 3, item.pinned);
          count++;
        }
      }

      return { success: true, importedCount: count };
    } catch (err: any) {
      return { success: false, importedCount: 0, error: err.message };
    }
  }

  // --- Session Management ---

  getActiveSessionId(): string {
    return this.activeSessionId;
  }

  setActiveSessionId(sessionId: string): void {
    this.activeSessionId = sessionId;
  }

  getSessions(): ConversationSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  createSession(title: string = 'New Conversation'): ConversationSession {
    const now = Date.now();
    const session: ConversationSession = {
      id: `session-${now}`,
      title,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };
    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;
    this.persist().catch(console.error);
    return session;
  }
}

export const memoryManager = new MemoryManager();
