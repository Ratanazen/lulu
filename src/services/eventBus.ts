import { LuluEvent, LuluEventType } from '../types';

type EventHandler<T = any> = (event: LuluEvent<T>) => void;

class EventBusService {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private eventHistory: LuluEvent[] = [];
  private readonly maxHistory = 150;

  public subscribe<T = any>(type: LuluEventType | '*', handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler);

    return () => {
      const set = this.handlers.get(type);
      if (set) {
        set.delete(handler as EventHandler);
        if (set.size === 0) {
          this.handlers.delete(type);
        }
      }
    };
  }

  public on<T = any>(type: LuluEventType | '*', handler: EventHandler<T>): () => void {
    return this.subscribe(type, handler);
  }

  public emit<T = any>(type: LuluEventType, source: string, payload: T): void {
    const event: LuluEvent<T> = {
      type,
      source,
      timestamp: Date.now(),
      payload,
    };

    // Keep rolling history
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.pop();
    }

    // Call specific handlers
    const specificHandlers = this.handlers.get(type);
    if (specificHandlers) {
      for (const handler of specificHandlers) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventBus] Error in handler for ${type}:`, err);
        }
      }
    }

    // Call wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler(event);
        } catch (err) {
          console.error('[EventBus] Error in wildcard handler:', err);
        }
      }
    }
  }

  public getHistory(): LuluEvent[] {
    return [...this.eventHistory];
  }

  public clearHistory(): void {
    this.eventHistory = [];
  }
}

export const eventBus = new EventBusService();
