import { describe, it, expect, beforeEach } from 'vitest';
import { GoogleOAuthService } from '../src/services/googleOAuthService';

describe('GoogleOAuthService', () => {
  let auth: GoogleOAuthService;

  beforeEach(() => {
    auth = new GoogleOAuthService();
  });

  it('starts in REQUIRES_CONFIGURATION status when clientId is empty', () => {
    expect(auth.getStatus()).toBe('REQUIRES_CONFIGURATION');
  });

  it('generates minimal least-privilege scopes by default without accessing Gmail or Drive', () => {
    const scopes = auth.getEffectiveScopes();
    expect(scopes).toEqual(['openid', 'email', 'profile']);
    expect(scopes.some((s) => s.includes('gmail'))).toBe(false);
    expect(scopes.some((s) => s.includes('drive'))).toBe(false);
  });

  it('adds sensitive scopes only when explicitly enabled', async () => {
    await auth.updateScope('gmail', true);
    const scopesWithGmail = auth.getEffectiveScopes();
    expect(scopesWithGmail.some((s) => s.includes('gmail'))).toBe(true);
    expect(scopesWithGmail.some((s) => s.includes('drive'))).toBe(false);
  });

  it('refuses to initiate connection without client ID and reports missing configuration', async () => {
    const res = await auth.connectGoogle();
    expect(res.success).toBe(false);
    expect(res.message).toContain('not configured');
  });

  it('generates valid official authorization URL when configured with a Client ID', async () => {
    await auth.updateConfig({ clientId: 'test-client-id-123.apps.googleusercontent.com' });
    const res = await auth.connectGoogle();
    expect(res.success).toBe(true);
    expect(res.authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(res.authUrl).toContain('test-client-id-123.apps.googleusercontent.com');
  });
});
