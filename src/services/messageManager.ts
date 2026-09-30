import { eventBus } from './eventBus';

export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

export type BubbleState = 'HIDDEN' | 'SHOWING' | 'TYPING' | 'VISIBLE' | 'PAUSED' | 'FADING';

export interface LuluMessage {
  id: string;
  text: string;
  source: 'notification' | 'music' | 'lyrics' | 'system' | 'interaction' | 'startup' | 'error';
  priority: MessagePriority;
  timestamp: number;
}

export type MessageListener = (
  text: string | null,
  state: BubbleState,
  isPaused: boolean,
  fullText: string | null
) => void;

class MessageManager {
  private queue: LuluMessage[] = [];
  private currentMessage: LuluMessage | null = null;
  private lastMessage: LuluMessage | null = null;
  private lastQueuedText: string = '';
  private lastQueuedTime: number = 0;

  private state: BubbleState = 'HIDDEN';
  private isPaused: boolean = false;
  private displayedText: string = '';
  private targetText: string = '';

  private typeTimer: any = null;
  private hideTimer: any = null;
  private remainingDuration: number = 0;
  private hideStartedAt: number = 0;

  private listeners: Set<MessageListener> = new Set();

  constructor() {
    // Listen for external bus events
    eventBus.on('notification:received', (notif: { app_name: string; title: string }) => {
      this.enqueue(
        `${notif.app_name}: ${notif.title}`,
        'critical',
        'notification'
      );
    });

    eventBus.on('music:playback_changed', (info: { status: string; title?: string }) => {
      if (info.status === 'Playing' && info.title) {
        this.enqueue(`🎵 Now Playing: ${info.title}`, 'high', 'music');
      }
    });
  }

  subscribe(listener: MessageListener): () => void {
    this.listeners.add(listener);
    // Initial emit
    listener(
      this.displayedText || null,
      this.state,
      this.isPaused,
      this.currentMessage ? this.currentMessage.text : null
    );
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(
        this.displayedText || null,
        this.state,
        this.isPaused,
        this.currentMessage ? this.currentMessage.text : null
      );
    }
  }

  public enqueue(
    text: string,
    priority: MessagePriority = 'normal',
    source: LuluMessage['source'] = 'interaction'
  ): void {
    if (!text || text.trim().length === 0) return;

    const trimmed = text.trim();
    const now = Date.now();

    // Deduplicate repeated messages within 3 seconds
    if (this.lastQueuedText === trimmed && now - this.lastQueuedTime < 3000) {
      return;
    }
    this.lastQueuedText = trimmed;
    this.lastQueuedTime = now;

    const message: LuluMessage = {
      id: Math.random().toString(36).substring(2, 9),
      text: trimmed,
      source,
      priority,
      timestamp: now,
    };

    // If critical and currently playing a lower priority message, interrupt
    if (priority === 'critical' && this.currentMessage && this.currentMessage.priority !== 'critical') {
      this.clearAllTimers();
      this.currentMessage = message;
      this.lastMessage = message;
      this.startDisplay(message);
      return;
    }

    // Normal queue limit: max 5 items
    if (this.queue.length >= 5) {
      // Drop lowest priority
      const lowestIndex = this.queue.findIndex((m) => m.priority === 'low');
      if (lowestIndex !== -1) {
        this.queue.splice(lowestIndex, 1);
      } else {
        this.queue.shift();
      }
    }

    this.queue.push(message);

    if (this.state === 'HIDDEN' || !this.currentMessage) {
      this.processNext();
    }
  }

  private processNext(): void {
    if (this.queue.length === 0) {
      this.currentMessage = null;
      this.state = 'HIDDEN';
      this.displayedText = '';
      this.notify();
      return;
    }

    // Sort queue by priority
    const priorityWeight: Record<MessagePriority, number> = {
      critical: 4,
      high: 3,
      normal: 2,
      low: 1,
    };

    this.queue.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    const nextMsg = this.queue.shift()!;
    this.currentMessage = nextMsg;
    this.lastMessage = nextMsg;
    this.startDisplay(nextMsg);
  }

  private startDisplay(msg: LuluMessage): void {
    this.clearAllTimers();
    this.targetText = msg.text;
    this.displayedText = '';
    this.state = 'TYPING';
    this.isPaused = false;
    this.notify();

    // Typewriter effect: 35ms per character
    let charIndex = 0;
    const typeSpeedMs = 35;

    this.typeTimer = setInterval(() => {
      if (charIndex < this.targetText.length) {
        charIndex++;
        this.displayedText = this.targetText.slice(0, charIndex);
        this.notify();
      } else {
        clearInterval(this.typeTimer);
        this.typeTimer = null;
        this.onTypingComplete();
      }
    }, typeSpeedMs);
  }

  private onTypingComplete(): void {
    this.state = 'VISIBLE';
    const duration = this.calculateDuration(this.targetText);
    this.remainingDuration = duration;
    this.hideStartedAt = Date.now();
    this.notify();

    if (!this.isPaused) {
      this.startHideTimer(duration);
    }
  }

  private calculateDuration(text: string): number {
    const len = text.length;
    if (len <= 20) return 4500;
    if (len <= 50) return 6500;
    if (len <= 100) return 8500;
    return 11000;
  }

  private startHideTimer(durationMs: number): void {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideStartedAt = Date.now();
    this.remainingDuration = durationMs;

    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      this.state = 'FADING';
      this.notify();

      setTimeout(() => {
        this.processNext();
      }, 300);
    }, Math.max(durationMs, 4000));
  }

  // Hover Interaction
  public pause(): void {
    if (this.state === 'VISIBLE' || this.state === 'TYPING') {
      this.isPaused = true;
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
        const elapsed = Date.now() - this.hideStartedAt;
        this.remainingDuration = Math.max(this.remainingDuration - elapsed, 1000);
      }
      this.state = 'PAUSED';
      this.notify();
    }
  }

  public resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      this.state = 'VISIBLE';
      this.notify();
      this.startHideTimer(this.remainingDuration);
    }
  }

  public togglePause(): void {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  public dismiss(): void {
    this.clearAllTimers();
    this.processNext();
  }

  public reopenLatest(): void {
    if (this.lastMessage) {
      this.enqueue(this.lastMessage.text, this.lastMessage.priority, this.lastMessage.source);
    }
  }

  private clearAllTimers(): void {
    if (this.typeTimer) {
      clearInterval(this.typeTimer);
      this.typeTimer = null;
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}

export const messageManager = new MessageManager();
