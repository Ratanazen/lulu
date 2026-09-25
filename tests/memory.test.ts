import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryManager } from '../src/features/memory/MemoryManager';

describe('MemoryManager', () => {
  let memory: MemoryManager;

  beforeEach(() => {
    memory = new MemoryManager();
    memory.clearAll();
  });

  it('stores and retrieves new memories', () => {
    const item = memory.remember('Preferred Language', 'TypeScript and Rust', 'preference', 5, true);
    expect(item.id).toBeDefined();
    expect(item.key).toBe('Preferred Language');
    expect(item.value).toBe('TypeScript and Rust');
    expect(item.importance).toBe(5);
    expect(item.pinned).toBe(true);

    const all = memory.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].key).toBe('Preferred Language');
  });

  it('updates existing memory if same key is remembered', () => {
    memory.remember('Favorite Drink', 'Green Tea', 'preference');
    memory.remember('Favorite Drink', 'Matcha Latte', 'preference');

    const all = memory.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].value).toBe('Matcha Latte');
  });

  it('searches memories by query', () => {
    memory.remember('Project Lulu', 'AI desktop virtual pet', 'work');
    memory.remember('Meeting', 'Friday 3pm with team', 'work');
    memory.remember('Cat Name', 'Mochi', 'personal');

    const searchResults = memory.search('desktop');
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].key).toBe('Project Lulu');
  });

  it('deletes specific memory with forget()', () => {
    const item = memory.remember('Temporary Note', 'Delete me soon', 'work');
    expect(memory.getAll()).toHaveLength(1);

    const deleted = memory.forget(item.id);
    expect(deleted).toBe(true);
    expect(memory.getAll()).toHaveLength(0);
  });

  it('generates formatted system prompt context', () => {
    memory.remember('User Name', 'Alex', 'fact');
    memory.remember('Focus', 'Writing a compiler', 'work');

    const context = memory.buildMemoryPromptContext();
    expect(context).toContain('[USER RECALLED MEMORIES & FACTS]');
    expect(context).toContain('User Name: Alex');
    expect(context).toContain('Focus: Writing a compiler');
  });

  it('exports and imports memories safely as JSON', () => {
    memory.remember('Key 1', 'Val 1', 'fact');
    memory.remember('Key 2', 'Val 2', 'preference');

    const json = memory.exportJson();
    expect(json).toContain('Key 1');

    const newManager = new MemoryManager();
    const result = newManager.importJson(json);
    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(2);
    expect(newManager.getAll()).toHaveLength(2);
  });
});
