import { MoodType, SpeechCategory, SpeechMessage } from '../types';

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

export class SpeechSystem {
  private currentMessage: SpeechMessage | null = null;
  private messageHistory: Set<string> = new Set();
  private lastMessageTime: number = 0;
  private minIntervalMs: number = 12000; // at least 12s between spontaneous speech
  private timer: number | null = null;

  public getRandomMessage(
    category: SpeechCategory,
    mood: MoodType = 'calm',
    durationMs: number = 8000
  ): SpeechMessage {
    const pool = SPEECH_POOLS[category] || SPEECH_POOLS.idle;

    // Pick one not recently used if possible
    const available = pool.filter((msg) => !this.messageHistory.has(msg));
    const chosenText =
      available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : pool[Math.floor(Math.random() * pool.length)];

    this.messageHistory.add(chosenText);
    if (this.messageHistory.size > 20) {
      this.messageHistory.clear();
    }

    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: chosenText,
      mood,
      priority: 1,
      durationMs,
      category,
      dismissible: true,
      createdAt: Date.now(),
    };
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

  private onExpireCallback?: () => void;
  private remainingTimeMs: number = 8000;
  private timerStartedAt: number = 0;
  private isPaused: boolean = false;

  public setMessage(msg: SpeechMessage, onExpire?: () => void): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.currentMessage = msg;
    this.lastMessageTime = Date.now();
    this.onExpireCallback = onExpire;
    this.remainingTimeMs = msg.durationMs || 8000;
    this.timerStartedAt = Date.now();
    this.isPaused = false;

    this.timer = window.setTimeout(() => {
      this.currentMessage = null;
      this.timer = null;
      if (this.onExpireCallback) this.onExpireCallback();
    }, this.remainingTimeMs);
  }

  public pause(): void {
    if (this.timer && !this.isPaused) {
      clearTimeout(this.timer);
      this.timer = null;
      const elapsed = Date.now() - this.timerStartedAt;
      this.remainingTimeMs = Math.max(2500, this.remainingTimeMs - elapsed);
      this.isPaused = true;
    }
  }

  public resume(): void {
    if (this.isPaused && this.currentMessage) {
      this.isPaused = false;
      this.timerStartedAt = Date.now();
      this.timer = window.setTimeout(() => {
        this.currentMessage = null;
        this.timer = null;
        if (this.onExpireCallback) this.onExpireCallback();
      }, this.remainingTimeMs);
    }
  }

  public getCurrentMessage(): SpeechMessage | null {
    return this.currentMessage;
  }

  public dismiss(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.currentMessage = null;
    this.isPaused = false;
  }
}
