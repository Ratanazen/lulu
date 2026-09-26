import { MoodType, SpeechCategory, SpeechMessage, SpeechPriority, SpeechBubbleState } from '../types';
import { calculateMessageDuration, paginateText } from '../utils/readingTime';

export const SPEECH_POOLS: Record<SpeechCategory, string[]> = {
  greeting: [
    "Hi there! Ready for a wonderful day?",
    "Hello friend! Lulu is happy to see you ✨",
    "Sparkling greetings from your desktop companion!",
    "Welcome back! Let's get things done together.",
  ],
  idle: [
    "Just gazing out across your screen...",
    "The desktop breeze feels nice today.",
    "Watching you work inspires me!",
    "Did you know? Stars twinkle because of atmosphere.",
    "A quiet moment to recharge ✨",
  ],
  success: [
    "Awesome job! High five!",
    "You nailed it! So proud of you!",
    "Woohoo! That was brilliant!",
    "Starlight victory! Keep going!",
  ],
  failure: [
    "Don't worry, every try makes us stronger!",
    "Shake it off! We've got this next time.",
    "Even stars stumble before they shine ✨",
  ],
  game: [
    "Ready, set, go! Let's play!",
    "Your reflexes are getting so fast!",
    "That was super fun! Another round?",
    "Great focus!",
  ],
  music: [
    "Ooh, love this rhythm! 🎵",
    "Lulu is grooving to the beat 🎶",
    "Music makes the starlight dance!",
    "Listening with you... ✨",
  ],
  exploration: [
    "Let's check out this new monitor corner!",
    "So much open window space to wander...",
    "Exploring the digital frontier!",
  ],
  encouragement: [
    "Remember to stay hydrated!",
    "Time for a gentle stretch?",
    "You're doing great, take a breath.",
    "Rest your eyes for 20 seconds, friend.",
  ],
  sleep: [
    "Zzz... soft dreams of glowing nebulas...",
    "Recharging my starlight batteries...",
    "Sleepy paws... goodnight for now...",
  ],
  settings: [
    "Customizing my habitat? Love it!",
    "New look for Lulu!",
    "Settings saved and cozy.",
  ],
  morning: [
    "Good morning, friend! The stars have made way for a bright new dawn ✨",
    "Rise and shine! Lulu has fresh morning starlight ready for you ☀️",
    "Early sunrise vibes! Let's make today wonderfully productive.",
    "A warm morning to you! Have you had some water or tea yet?",
  ],
  night: [
    "The screen is glowing soft against the dark night... don't stay up too late ✨",
    "Nighttime whispers from the cosmos... sleepy paws need rest soon 🌙",
    "Look up at the stars tonight! Lulu is right here keeping you company.",
    "Late night coding? Lulu gives you a quiet celestial blessing ✨",
  ],
  study: [
    "Deep focus mode activated! Lulu will keep super quiet 📚",
    "You're absorbing so much knowledge! Keep up the brilliant momentum.",
    "Taking notes from the universe... learning looks wonderful on you!",
    "One page at a time, one line of code at a time ✨",
  ],
  weather: [
    "A celestial breeze is drifting past the monitor edges today ⛅",
    "Cosmic forecast: 100% chance of starlight and pleasant vibes!",
    "Rain or shine, your desktop is a warm and cozy home ✨",
    "Look outside your window! How does the sky look today?",
  ],
  break: [
    "Time for the 20-20-20 rule! Look 20 feet away for 20 seconds 👀",
    "Gentle reminder: stretch your back and relax your shoulders ✨",
    "Take a deep breath in... and exhale. You're doing amazing.",
    "How about a sip of water? Lulu is cheering on your wellness 💧",
  ],
};

export interface QueuedSpeechItem {
  message: SpeechMessage;
  onExpire?: () => void;
}

export type SpeechStateListener = (
  state: SpeechBubbleState,
  message: SpeechMessage | null
) => void;

export class SpeechSystem {
  private currentMessage: SpeechMessage | null = null;
  private state: SpeechBubbleState = 'HIDDEN';
  private queue: QueuedSpeechItem[] = [];
  private readonly maxQueueSize: number = 5;

  private messageHistory: Set<string> = new Set();
  private recentTextTimestamps: Map<string, number> = new Map();
  private lastMessageTime: number = 0;
  private minIntervalMs: number = 12000; // at least 12s between spontaneous speech

  // Reading countdown timer tracking
  private readTimer: any = null;
  private timerStartedAt: number = 0;
  private remainingTimeMs: number = 0;
  private onCurrentExpireCallback?: () => void;

  // Persistent recent message memory
  public lastMessage: SpeechMessage | null = null;
  public lastMessageTimestamp: number = 0;
  public lastMessageType: SpeechCategory | 'idle' = 'idle';

  // Listeners
  private listeners: Set<SpeechStateListener> = new Set();

  public subscribe(listener: SpeechStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state, this.currentMessage);
    return () => this.listeners.delete(listener);
  }

  private emitState(): void {
    for (const l of this.listeners) {
      try {
        l(this.state, this.currentMessage);
      } catch (err) {
        console.error('[SpeechSystem] Error in state listener:', err);
      }
    }
  }

  public getState(): SpeechBubbleState {
    return this.state;
  }

  public getCurrentMessage(): SpeechMessage | null {
    return this.currentMessage;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Generates a random speech message with calculated duration
   */
  public getRandomMessage(
    category: SpeechCategory,
    mood: MoodType = 'calm',
    customDuration?: number
  ): SpeechMessage {
    const pool = SPEECH_POOLS[category] || SPEECH_POOLS.idle;

    const available = pool.filter((msg) => !this.messageHistory.has(msg));
    const chosenText =
      available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : pool[Math.floor(Math.random() * pool.length)];

    this.messageHistory.add(chosenText);
    if (this.messageHistory.size > 20) {
      this.messageHistory.clear();
    }

    const priority =
      category === 'failure'
        ? SpeechPriority.SYSTEM
        : category === 'music'
        ? SpeechPriority.MUSIC
        : SpeechPriority.IDLE;

    const durationMs = customDuration ?? calculateMessageDuration(chosenText, category, priority);

    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: chosenText,
      mood,
      priority,
      durationMs,
      category,
      dismissible: true,
      createdAt: Date.now(),
    };
  }

  /**
   * Main entry point to enqueue or immediately display a message.
   * Includes deduplication, priority queueing, and preemption.
   */
  public enqueue(msg: SpeechMessage, onExpire?: () => void, bypassDeduplication: boolean = false): boolean {
    const now = Date.now();

    // 1. Deduplication check (10-second cooldown on identical text)
    if (!bypassDeduplication && !msg.id.startsWith('msg_reopen_')) {
      const normalizedText = msg.text.trim().toLowerCase();
      const lastSentTime = this.recentTextTimestamps.get(normalizedText);
      if (lastSentTime && now - lastSentTime < 10000 && msg.priority < SpeechPriority.CRITICAL) {
        return false; // Drop duplicate spam
      }
      this.recentTextTimestamps.set(normalizedText, now);
    }

    // Clean up old timestamps
    if (this.recentTextTimestamps.size > 30) {
      for (const [k, t] of this.recentTextTimestamps.entries()) {
        if (now - t > 30000) this.recentTextTimestamps.delete(k);
      }
    }

    // 2. Ensure smart duration is calculated
    if (!msg.durationMs || msg.durationMs < 4000) {
      msg.durationMs = calculateMessageDuration(msg.text, msg.category, msg.priority);
    }

    // 3. Ensure pagination is initialized for long messages
    if (!msg.pages || msg.pages.length === 0) {
      msg.pages = paginateText(msg.text, 160);
      msg.currentPage = 0;
    }

    // 4. Preemption or immediate display
    if (!this.currentMessage || this.state === 'HIDDEN' || this.state === 'FADING') {
      this.displayMessage(msg, onExpire);
      return true;
    }

    // Preemption: Critical messages interrupt lower-priority messages immediately
    if (msg.priority >= SpeechPriority.CRITICAL && this.currentMessage.priority < SpeechPriority.CRITICAL) {
      // Re-queue the interrupted message if it hasn't expired yet
      if (this.currentMessage) {
        this.queue.unshift({
          message: this.currentMessage,
          onExpire: this.onCurrentExpireCallback,
        });
      }
      this.clearTimer();
      this.displayMessage(msg, onExpire);
      return true;
    }

    // 5. Insert into priority queue
    // High priority first; if equal priority, FIFO (stable)
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      if (msg.priority > this.queue[i].message.priority) {
        insertIndex = i;
        break;
      }
    }
    this.queue.splice(insertIndex, 0, { message: msg, onExpire });

    // 6. Enforce max queue capacity by dropping oldest low-priority message
    if (this.queue.length > this.maxQueueSize) {
      // Find lowest priority message near the end of the queue
      let lowestIdx = this.queue.length - 1;
      let lowestPrio = this.queue[lowestIdx].message.priority;
      for (let i = this.queue.length - 1; i >= 0; i--) {
        if (this.queue[i].message.priority < lowestPrio) {
          lowestPrio = this.queue[i].message.priority;
          lowestIdx = i;
        }
      }
      this.queue.splice(lowestIdx, 1);
    }

    return true;
  }

  /**
   * Compatibility alias for setMessage
   */
  public setMessage(msg: SpeechMessage, onExpire?: () => void): void {
    this.enqueue(msg, onExpire);
  }

  /**
   * Displays the specified message, transitioning states SHOWING -> TYPING
   */
  private displayMessage(msg: SpeechMessage, onExpire?: () => void): void {
    this.clearTimer();

    this.currentMessage = msg;
    this.onCurrentExpireCallback = onExpire;
    this.lastMessage = msg;
    this.lastMessageTimestamp = Date.now();
    this.lastMessageType = msg.category || 'idle';
    this.lastMessageTime = Date.now();

    this.state = 'SHOWING';
    this.emitState();
  }

  /**
   * Called by SpeechBubble when typewriter finishes typing current page
   */
  public onTypewriterFinished(): void {
    if (!this.currentMessage) return;

    this.state = 'VISIBLE';
    this.emitState();

    // Start reading countdown timer only AFTER typing is completely finished!
    this.startReadCountdown();
  }

  /**
   * Advances to next page or finishes message reading time
   */
  public nextPage(): boolean {
    if (!this.currentMessage || !this.currentMessage.pages) return false;
    const cur = this.currentMessage.currentPage ?? 0;
    if (cur + 1 < this.currentMessage.pages.length) {
      this.clearTimer();
      this.currentMessage.currentPage = cur + 1;
      this.state = 'SHOWING';
      this.emitState();
      return true;
    }
    return false;
  }

  /**
   * Starts the reading countdown timer
   */
  private startReadCountdown(durationMs?: number): void {
    this.clearTimer();
    if (!this.currentMessage) return;

    // Critical messages persist until dismissed
    if (this.currentMessage.priority >= SpeechPriority.CRITICAL || this.currentMessage.durationMs === Infinity) {
      return;
    }

    const duration = durationMs !== undefined ? durationMs : (this.currentMessage.durationMs || 4000);
    this.remainingTimeMs = duration;
    this.timerStartedAt = Date.now();

    this.readTimer = setTimeout(() => {
      this.handleMessageExpired();
    }, this.remainingTimeMs);
  }

  private handleMessageExpired(): void {
    // If multi-page message, advance to next page automatically
    if (this.currentMessage?.pages && (this.currentMessage.currentPage ?? 0) + 1 < this.currentMessage.pages.length) {
      this.nextPage();
      return;
    }

    this.dismiss();
  }

  /**
   * Pauses the reading timer on hover or click
   */
  public pause(): void {
    if (this.state === 'VISIBLE' && this.readTimer) {
      clearTimeout(this.readTimer);
      this.readTimer = null;
      const elapsed = Date.now() - this.timerStartedAt;
      this.remainingTimeMs = Math.max(500, this.remainingTimeMs - elapsed);
      this.state = 'PAUSED';
      this.emitState();
    }
  }

  /**
   * Resumes the reading timer on mouse leave or click
   */
  public resume(): void {
    if (this.state === 'PAUSED' && this.currentMessage) {
      this.state = 'VISIBLE';
      this.emitState();
      this.startReadCountdown(this.remainingTimeMs);
    }
  }

  /**
   * Toggles pause/resume
   */
  public togglePause(): void {
    if (this.state === 'PAUSED') {
      this.resume();
    } else if (this.state === 'VISIBLE') {
      this.pause();
    }
  }

  /**
   * Dismisses the active message and transitions to next in queue
   */
  public dismiss(): void {
    this.clearTimer();

    if (this.onCurrentExpireCallback) {
      try {
        this.onCurrentExpireCallback();
      } catch (err) {
        console.error('[SpeechSystem] Error in expire callback:', err);
      }
      this.onCurrentExpireCallback = undefined;
    }

    this.state = 'FADING';
    this.emitState();

    // After fade-out animation (320ms), advance queue
    setTimeout(() => {
      this.currentMessage = null;
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        this.displayMessage(next.message, next.onExpire);
      } else {
        this.state = 'HIDDEN';
        this.emitState();
      }
    }, 320);
  }

  /**
   * Clears the active read countdown timer
   */
  private clearTimer(): void {
    if (this.readTimer) {
      clearTimeout(this.readTimer);
      this.readTimer = null;
    }
  }

  /**
   * Reopens the last displayed message if still recent (< 60 seconds)
   */
  public reopenLastMessage(): boolean {
    if (this.currentMessage && this.state !== 'HIDDEN' && this.state !== 'FADING') {
      return false; // Already showing a message
    }

    if (!this.lastMessage) return false;
    const elapsed = Date.now() - this.lastMessageTimestamp;
    if (elapsed > 60000) return false; // Stale

    // Clone and re-enqueue
    const reopened: SpeechMessage = {
      ...this.lastMessage,
      id: `msg_reopen_${Date.now()}`,
      createdAt: Date.now(),
      currentPage: 0,
    };

    return this.enqueue(reopened, undefined, true);
  }

  public shouldSpeakSpontaneously(now: number = Date.now(), frequency: 'low' | 'normal' | 'high' = 'normal'): boolean {
    const interval =
      frequency === 'low' ? 30000 : frequency === 'high' ? 8000 : this.minIntervalMs;
    return now - this.lastMessageTime >= interval;
  }

  public getSuggestedSpontaneousCategory(hour: number = new Date().getHours()): SpeechCategory {
    const roll = Math.random();
    if (hour >= 6 && hour < 10 && roll < 0.6) {
      return 'morning';
    }
    if ((hour >= 22 || hour < 4) && roll < 0.6) {
      return 'night';
    }
    if (roll < 0.25) return 'break';
    if (roll < 0.45) return 'weather';
    if (roll < 0.65) return 'encouragement';
    return 'idle';
  }
}
