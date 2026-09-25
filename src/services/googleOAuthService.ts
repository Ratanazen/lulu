import { StorageService } from './storageService';

export type GoogleAuthStatus =
  | 'DISCONNECTED'
  | 'REQUIRES_CONFIGURATION'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ERROR';

export interface GoogleAccountProfile {
  email: string;
  displayName: string;
  avatarUrl?: string;
  scopes: string[];
  connectedAt: string;
}

export interface GoogleOAuthScopeSettings {
  basicProfile: boolean; // true
  gmail: boolean;        // default false
  drive: boolean;        // default false
  calendar: boolean;     // default false
  contacts: boolean;     // default false
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: GoogleOAuthScopeSettings;
}

export const DEFAULT_GOOGLE_CONFIG: GoogleOAuthConfig = {
  clientId: '',
  clientSecret: '',
  redirectUri: 'http://127.0.0.1:1420/oauth/callback',
  scopes: {
    basicProfile: true,
    gmail: false,
    drive: false,
    calendar: false,
    contacts: false,
  },
};

export class GoogleOAuthService {
  private config: GoogleOAuthConfig = { ...DEFAULT_GOOGLE_CONFIG };
  private status: GoogleAuthStatus = 'REQUIRES_CONFIGURATION';
  private currentProfile: GoogleAccountProfile | null = null;
  private listeners = new Set<(status: GoogleAuthStatus) => void>();

  constructor() {
    this.loadSettings();
  }

  public async loadSettings(): Promise<void> {
    const savedConfig = await StorageService.get<GoogleOAuthConfig>('google_oauth_config', DEFAULT_GOOGLE_CONFIG);
    if (savedConfig) {
      this.config = { ...DEFAULT_GOOGLE_CONFIG, ...savedConfig };
    }

    const savedProfile = await StorageService.get<GoogleAccountProfile | null>('google_account_profile', null);
    this.currentProfile = savedProfile;

    this.recomputeStatus();
  }

  public getStatus(): GoogleAuthStatus {
    return this.status;
  }

  public getConfig(): GoogleOAuthConfig {
    return { ...this.config };
  }

  public getAccountProfile(): GoogleAccountProfile | null {
    return this.currentProfile;
  }

  public async updateConfig(partial: Partial<GoogleOAuthConfig>): Promise<void> {
    this.config = { ...this.config, ...partial };
    await StorageService.set('google_oauth_config', this.config);
    this.recomputeStatus();
  }

  public async updateScope(scopeKey: keyof GoogleOAuthScopeSettings, enabled: boolean): Promise<void> {
    this.config.scopes[scopeKey] = enabled;
    await StorageService.set('google_oauth_config', this.config);
  }

  /**
   * Builds the official least-privilege scope list based only on explicitly toggled capabilities
   */
  public getEffectiveScopes(): string[] {
    const scopes: string[] = ['openid', 'email', 'profile'];

    if (this.config.scopes.gmail) {
      scopes.push('https://www.googleapis.com/auth/gmail.readonly');
    }
    if (this.config.scopes.drive) {
      scopes.push('https://www.googleapis.com/auth/drive.readonly');
    }
    if (this.config.scopes.calendar) {
      scopes.push('https://www.googleapis.com/auth/calendar.readonly');
    }
    if (this.config.scopes.contacts) {
      scopes.push('https://www.googleapis.com/auth/contacts.readonly');
    }

    return scopes;
  }

  /**
   * Generates the official Google OAuth 2.0 authorization URL and opens the system browser
   */
  public async connectGoogle(): Promise<{ success: boolean; message: string; authUrl?: string }> {
    if (!this.config.clientId.trim()) {
      this.status = 'REQUIRES_CONFIGURATION';
      this.notify();
      return {
        success: false,
        message: 'Google Client ID is not configured. Please supply a valid Google Cloud OAuth 2.0 Client ID in settings.',
      };
    }

    const scopes = encodeURIComponent(this.getEffectiveScopes().join(' '));
    const redirect = encodeURIComponent(this.config.redirectUri);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      this.config.clientId.trim()
    )}&redirect_uri=${redirect}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent`;

    this.status = 'CONNECTING';
    this.notify();

    // Open in native system browser
    if (typeof window !== 'undefined') {
      window.open(authUrl, '_blank');
    }

    return {
      success: true,
      message: 'Opened official Google OAuth login in your default web browser.',
      authUrl,
    };
  }

  public async disconnectGoogle(): Promise<void> {
    this.currentProfile = null;
    await StorageService.set('google_account_profile', null);
    this.recomputeStatus();
  }

  public async revokeAuthorization(): Promise<void> {
    // Drop all local credentials
    await this.disconnectGoogle();
  }

  public subscribe(listener: (status: GoogleAuthStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private recomputeStatus(): void {
    if (this.currentProfile) {
      this.status = 'CONNECTED';
    } else if (!this.config.clientId.trim()) {
      this.status = 'REQUIRES_CONFIGURATION';
    } else {
      this.status = 'DISCONNECTED';
    }
    this.notify();
  }

  private notify(): void {
    for (const l of this.listeners) {
      l(this.status);
    }
  }
}

export const googleOAuthService = new GoogleOAuthService();
