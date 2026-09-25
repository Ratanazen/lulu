// Memory Subsystem Types

export type MemoryCategory = 'preference' | 'fact' | 'work' | 'personal' | 'topic' | 'custom';

export interface MemoryItem {
  id: string;
  key: string;
  value: string;
  category: MemoryCategory;
  importance: number; // 1 - 5
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}
