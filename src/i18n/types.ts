export type Locale = 'en' | 'km';

export interface Translations {
  // Actions
  feed: string;
  play: string;
  clean: string;
  sleep: string;
  wander: string;
  pet: string;
  chat: string;
  quickActions: string;
  controlCenter: string;
  
  // Status
  energy: string;
  hunger: string;
  happiness: string;
  hygiene: string;
  fun: string;
  level: string;
  streak: string;
  mood: string;

  // Dialog & Greetings
  greeting: string;
  fedHappy: string;
  playedExcited: string;
  cleanedRefreshed: string;
  goingToSleep: string;

  // Settings & Tabs
  overview: string;
  characterStudio: string;
  aiModels: string;
  memoryStorage: string;
  voiceSpeech: string;
  themeEngine: string;
  systemMonitor: string;
  aboutLulu: string;
}
