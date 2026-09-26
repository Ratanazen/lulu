let tauriInvoke: (<T = any>(cmd: string, args?: Record<string, unknown>) => Promise<T>) | null = null;

async function getInvoke() {
  if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
    return null;
  }
  if (tauriInvoke) return tauriInvoke;
  try {
    const core = await import('@tauri-apps/api/core');
    tauriInvoke = core.invoke;
    return tauriInvoke;
  } catch {
    return null;
  }
}

export class StorageService {
  private static memoryCache = new Map<string, any>();

  public static clearCache(): void {
    this.memoryCache.clear();
  }

  public static async get<T>(key: string, defaultValue: T): Promise<T> {
    if (typeof localStorage !== 'undefined' && localStorage.length === 0 && this.memoryCache.size > 0) {
      this.memoryCache.clear();
    }

    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) as T;
    }

    const invoke = await getInvoke();
    if (invoke) {
      try {
        const val = await invoke<string | null>('storage_get', { key });
        if (val !== null && val !== undefined) {
          const parsed = JSON.parse(val) as T;
          this.memoryCache.set(key, parsed);
          return parsed;
        }
      } catch (e) {
        console.warn(`[StorageService] SQLite get failed for key "${key}", checking localStorage fallback:`, e);
      }
    }

    if (typeof localStorage !== 'undefined') {
      const local = localStorage.getItem(`lulu_${key}`);
      if (local) {
        try {
          const parsed = JSON.parse(local) as T;
          this.memoryCache.set(key, parsed);
          return parsed;
        } catch {
          // ignore parse error
        }
      }
    }

    this.memoryCache.set(key, defaultValue);
    return defaultValue;
  }

  public static async set<T>(key: string, value: T): Promise<void> {
    this.memoryCache.set(key, value);
    const jsonStr = JSON.stringify(value);
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('storage_set', { key, value: jsonStr });
      } catch (e) {
        console.warn(`[StorageService] SQLite set failed for key "${key}":`, e);
      }
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`lulu_${key}`, jsonStr);
      } catch {
        // ignore
      }
    }
  }


  public static async exportBackup(): Promise<string> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        return await invoke<string>('storage_export');
      } catch (e) {
        console.warn('[StorageService] SQLite backup export failed, generating from localStorage fallback:', e);
      }
    }

    // Fallback export from localStorage
    const dump: Record<string, any> = {};
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('lulu_')) {
          dump[k.replace('lulu_', '')] = localStorage.getItem(k);
        }
      }
    }
    return JSON.stringify({ version: 1, createdAt: new Date().toISOString(), fallbackData: dump }, null, 2);
  }

  public static async importBackup(backupJson: string): Promise<boolean> {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('storage_import', { json: backupJson });
        return true;
      } catch (e) {
        console.warn('[StorageService] SQLite backup import failed:', e);
      }
    }

    // Fallback import
    try {
      const parsed = JSON.parse(backupJson);
      if (parsed.fallbackData && typeof localStorage !== 'undefined') {
        for (const [k, v] of Object.entries(parsed.fallbackData)) {
          localStorage.setItem(`lulu_${k}`, v as string);
        }
      }
      return true;
    } catch {
      return false;
    }
  }
}

// --- Phase 1.3: Expanded Storage APIs with Fallback ---

// Settings
export async function getAllSettings(): Promise<[string, string][]> {
  const invoke = await getInvoke();
  if (invoke) {
    try { return await invoke<[string, string][]>('get_all_settings'); }
    catch (e) { console.warn('SQLite getAllSettings failed', e); }
  }
  const result: [string, string][] = [];
  if (typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('lulu_setting_')) {
        const keyName = k.replace('lulu_setting_', '');
        const val = localStorage.getItem(k);
        if (val !== null) result.push([keyName, val]);
      }
    }
  }
  return result;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    try { await invoke('set_setting', { key, value }); return; }
    catch (e) { console.warn('SQLite setSetting failed', e); }
  }
  if (typeof localStorage !== 'undefined') localStorage.setItem(`lulu_setting_${key}`, value);
}

export async function getSetting(key: string): Promise<string | null> {
  const invoke = await getInvoke();
  if (invoke) {
    try { return await invoke<string | null>('get_setting', { key }); }
    catch (e) { console.warn('SQLite getSetting failed', e); }
  }
  if (typeof localStorage !== 'undefined') return localStorage.getItem(`lulu_setting_${key}`);
  return null;
}

export async function setSettingsBulk(settings: [string, string][]): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    try { await invoke('set_settings_bulk', { settings }); return; }
    catch (e) { console.warn('SQLite setSettingsBulk failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    settings.forEach(([k, v]) => localStorage.setItem(`lulu_setting_${k}`, v));
  }
}

// Conversations
export interface ConversationRecord { id: string; title: string; provider_id: string; model: string; created_at: string; updated_at: string; }
export async function getConversations(limit?: number, offset?: number): Promise<ConversationRecord[]> {
  const invoke = await getInvoke();
  if (invoke) {
    try { return await invoke<ConversationRecord[]>('get_conversations', { limit, offset }); }
    catch (e) { console.warn('SQLite getConversations failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('lulu_conversations_list');
    if (raw) {
      try {
        const list = JSON.parse(raw) as ConversationRecord[];
        const off = offset || 0;
        const lim = limit || list.length;
        return list.slice(off, off + lim);
      } catch { /* ignore */ }
    }
  }
  return [];
}

export async function createConversation(id: string, title: string, providerId: string, model: string): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    try { await invoke('create_conversation', { id, title, providerId, model }); return; }
    catch (e) { console.warn('SQLite createConversation failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('lulu_conversations_list');
    const list: ConversationRecord[] = raw ? JSON.parse(raw) : [];
    list.unshift({
      id,
      title,
      provider_id: providerId,
      model,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    localStorage.setItem('lulu_conversations_list', JSON.stringify(list));
  }
}

export async function deleteConversation(id: string): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    try { await invoke('delete_conversation', { id }); return; }
    catch (e) { console.warn('SQLite deleteConversation failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('lulu_conversations_list');
    if (raw) {
      const list: ConversationRecord[] = JSON.parse(raw);
      localStorage.setItem('lulu_conversations_list', JSON.stringify(list.filter((c) => c.id !== id)));
    }
    localStorage.removeItem(`lulu_messages_${id}`);
  }
}

// Messages
export interface MessageRecord { id: string; conversation_id: string; role: string; content: string; tool_calls_json: string; timestamp: number; }
export async function getMessages(conversationId: string, limit?: number): Promise<MessageRecord[]> {
  const invoke = await getInvoke();
  if (invoke) {
    try { return await invoke<MessageRecord[]>('get_messages', { conversationId, limit }); }
    catch (e) { console.warn('SQLite getMessages failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(`lulu_messages_${conversationId}`);
    if (raw) {
      try {
        const msgs = JSON.parse(raw) as MessageRecord[];
        return limit ? msgs.slice(-limit) : msgs;
      } catch { /* ignore */ }
    }
  }
  return [];
}

export async function saveMessage(id: string, conversationId: string, role: string, content: string, toolCallsJson?: string): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    try { await invoke('save_message', { id, conversationId, role, content, toolCallsJson: toolCallsJson || null }); return; }
    catch (e) { console.warn('SQLite saveMessage failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(`lulu_messages_${conversationId}`);
    const msgs: MessageRecord[] = raw ? JSON.parse(raw) : [];
    msgs.push({
      id,
      conversation_id: conversationId,
      role,
      content,
      tool_calls_json: toolCallsJson || '[]',
      timestamp: Date.now(),
    });
    localStorage.setItem(`lulu_messages_${conversationId}`, JSON.stringify(msgs));
  }
}

// Memories
export interface MemoryRecord { id: string; title: string; content: string; category: string; importance: number; user_defined: boolean; created_at: string; }
export async function getMemories(search?: string, category?: string): Promise<MemoryRecord[]> {
  const invoke = await getInvoke();
  if (invoke) {
    try { return await invoke<MemoryRecord[]>('get_memories', { search, category }); }
    catch (e) { console.warn('SQLite getMemories failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('lulu_memories_list');
    if (raw) {
      try {
        let mems = JSON.parse(raw) as MemoryRecord[];
        if (category) {
          mems = mems.filter((m) => m.category === category);
        }
        if (search) {
          const q = search.toLowerCase();
          mems = mems.filter((m) => m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q));
        }
        return mems;
      } catch { /* ignore */ }
    }
  }
  return [];
}

export async function saveMemory(id: string, title: string, content: string, category: string, importance: number, userDefined: boolean): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    try { await invoke('save_memory', { id, title, content, category, importance, userDefined }); return; }
    catch (e) { console.warn('SQLite saveMemory failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('lulu_memories_list');
    const mems: MemoryRecord[] = raw ? JSON.parse(raw) : [];
    const idx = mems.findIndex((m) => m.id === id);
    const item: MemoryRecord = {
      id,
      title,
      content,
      category,
      importance,
      user_defined: userDefined,
      created_at: new Date().toISOString(),
    };
    if (idx >= 0) mems[idx] = item;
    else mems.push(item);
    localStorage.setItem('lulu_memories_list', JSON.stringify(mems));
  }
}

export async function deleteMemory(id: string): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    try { await invoke('delete_memory', { id }); return; }
    catch (e) { console.warn('SQLite deleteMemory failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('lulu_memories_list');
    if (raw) {
      const mems: MemoryRecord[] = JSON.parse(raw);
      localStorage.setItem('lulu_memories_list', JSON.stringify(mems.filter((m) => m.id !== id)));
    }
  }
}

// Game Scores
export interface GameHighScore { game_id: string; high_score: number; total_plays: number; last_played: string; }
export async function getGameScores(): Promise<GameHighScore[]> {
  const invoke = await getInvoke();
  if (invoke) {
    try { return await invoke<GameHighScore[]>('get_game_scores'); }
    catch (e) { console.warn('SQLite getGameScores failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('lulu_game_scores_list');
    if (raw) {
      try { return JSON.parse(raw) as GameHighScore[]; }
      catch { /* ignore */ }
    }
  }
  return [];
}

export async function saveGameRecord(gameId: string, score: number): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    try { await invoke('save_game_record', { gameId, score }); return; }
    catch (e) { console.warn('SQLite saveGameRecord failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('lulu_game_scores_list');
    const list: GameHighScore[] = raw ? JSON.parse(raw) : [];
    const existing = list.find((g) => g.game_id === gameId);
    if (existing) {
      existing.high_score = Math.max(existing.high_score, score);
      existing.total_plays += 1;
      existing.last_played = new Date().toISOString();
    } else {
      list.push({
        game_id: gameId,
        high_score: score,
        total_plays: 1,
        last_played: new Date().toISOString(),
      });
    }
    localStorage.setItem('lulu_game_scores_list', JSON.stringify(list));
  }
}

// Notifications
export interface NotificationRecord { id: string; app_name: string; title: string; body: string; icon: string; received_at: number; }
export async function getRecentNotifications(limit?: number): Promise<NotificationRecord[]> {
  const invoke = await getInvoke();
  if (invoke) {
    try { return await invoke<NotificationRecord[]>('get_recent_notifications', { limit }); }
    catch (e) { console.warn('SQLite getRecentNotifications failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('lulu_notifications_list');
    if (raw) {
      try {
        const notifs = JSON.parse(raw) as NotificationRecord[];
        return limit ? notifs.slice(0, limit) : notifs;
      } catch { /* ignore */ }
    }
  }
  return [];
}

export async function saveNotification(id: string, appName: string, title: string, body: string, icon: string): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    try { await invoke('save_notification', { id, appName, title, body, icon }); return; }
    catch (e) { console.warn('SQLite saveNotification failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('lulu_notifications_list');
    const notifs: NotificationRecord[] = raw ? JSON.parse(raw) : [];
    notifs.unshift({
      id,
      app_name: appName,
      title,
      body,
      icon,
      received_at: Date.now(),
    });
    if (notifs.length > 100) notifs.pop();
    localStorage.setItem('lulu_notifications_list', JSON.stringify(notifs));
  }
}

// Achievements
export interface AchievementRecord { id: string; unlocked_at: string; progress: number; }
export async function getAchievements(): Promise<AchievementRecord[]> {
  const invoke = await getInvoke();
  if (invoke) {
    try { return await invoke<AchievementRecord[]>('get_achievements'); }
    catch (e) { console.warn('SQLite getAchievements failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('lulu_achievements_list');
    if (raw) {
      try { return JSON.parse(raw) as AchievementRecord[]; }
      catch { /* ignore */ }
    }
  }
  return [];
}

export async function unlockAchievement(id: string, progress: number): Promise<void> {
  const invoke = await getInvoke();
  if (invoke) {
    try { await invoke('unlock_achievement', { id, progress }); return; }
    catch (e) { console.warn('SQLite unlockAchievement failed', e); }
  }
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('lulu_achievements_list');
    const list: AchievementRecord[] = raw ? JSON.parse(raw) : [];
    const existing = list.find((a) => a.id === id);
    if (existing) {
      existing.progress = progress;
    } else {
      list.push({ id, unlocked_at: new Date().toISOString(), progress });
    }
    localStorage.setItem('lulu_achievements_list', JSON.stringify(list));
  }
}
