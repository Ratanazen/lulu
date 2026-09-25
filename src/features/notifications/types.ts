export interface DesktopNotification {
  id: string;
  appName: string;
  appIcon: string;
  summary: string;
  body: string;
  timestamp: number;
}

export interface NotificationSettings {
  enabled: boolean;
  visualReaction: boolean;
  voiceNotification: boolean;
  readMessageContent: boolean; // Default FALSE for privacy
  showAppName: boolean;
  whitelistedApps: string[];
}
