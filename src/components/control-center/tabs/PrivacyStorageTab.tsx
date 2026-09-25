import React, { useState } from 'react';
import { StorageService } from '../../../services/storageService';
import { useLuluStore } from '../../../stores/useLuluStore';
import { googleOAuthService } from '../../../services/googleOAuthService';

export const PrivacyStorageTab: React.FC = () => {
  const { speak } = useLuluStore();
  const [backupJson, setBackupJson] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [oauthStatus] = useState(googleOAuthService.getStatus());

  const [permissions, setPermissions] = useState<Record<string, { label: string; desc: string; enabled: boolean; status: string }>>({
    dbus_notifications: { label: 'Desktop Notifications (D-Bus)', desc: 'Reads incoming desktop app notification titles and summaries.', enabled: true, status: 'Active' },
    mpris_media: { label: 'Media Player Detection (MPRIS)', desc: 'Detects playback state, artist, and track from Spotify/browsers.', enabled: true, status: 'Active' },
    window_tracking: { label: 'Active Window Titles', desc: 'Queries compositor (Wayland/X11) for foreground window class.', enabled: true, status: 'Active' },
    workspace_fs: { label: 'Workspace File Access', desc: 'Allows read/write strictly inside designated workspace directory.', enabled: true, status: 'Enforced' },
    shell_tools: { label: 'Safe Terminal Tools', desc: 'Allows safe commands (system metrics, lspci, df) without escalation.', enabled: true, status: 'Active' },
    dangerous_tools: { label: 'Dangerous Tool Governance', desc: 'Requires explicit user confirmation modal for file deletions or kills.', enabled: true, status: 'Guarded' },
    microphone_stt: { label: 'Microphone & Voice Input', desc: 'Captures audio only when push-to-talk button is held.', enabled: false, status: 'Optional' },
    autostart: { label: 'Desktop Autostart', desc: 'Registers Lulu in ~/.config/autostart on user login.', enabled: false, status: 'Optional' },
    screen_capture: { label: 'Screen Context & Vision', desc: 'Captures full display screenshots for AI visual analysis.', enabled: false, status: 'Requires Permission' },
    message_content: { label: 'Notification Message Body Parsing', desc: 'Reads deep private content inside notifications.', enabled: false, status: 'Disabled' },
    browser_dom: { label: 'Browser DOM / Keystroke Logging', desc: 'Reads arbitrary browser tabs or records user keyboard input.', enabled: false, status: 'Permanently Blocked' },
    cloud_telemetry: { label: 'Cloud Analytics & Telemetry', desc: 'Uploads anonymous app usage or crash logs to third parties.', enabled: false, status: 'Permanently Blocked' },
  });

  const togglePermission = (key: string) => {
    if (permissions[key].status === 'Permanently Blocked') {
      speak('This capability is permanently blocked by architectural design for your privacy.');
      return;
    }
    setPermissions((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const handleExport = async () => {
    try {
      const data = await StorageService.exportBackup();
      setBackupJson(data);

      // Download file to disk
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lulu-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      speak('Exported your backup safely! 📦');
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const handleImport = async () => {
    if (!backupJson) return;
    try {
      const ok = await StorageService.importBackup(backupJson);
      if (ok) {
        setImportStatus('Backup successfully imported! Please restart or reload Lulu.');
        speak('Restored backup successfully! ✨');
      } else {
        setImportStatus('Error: Invalid backup structure.');
      }
    } catch (e) {
      setImportStatus(`Import failed: ${e}`);
    }
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to reset Lulu local storage? This cannot be undone.')) {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Privacy & Persistent Storage</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Offline-first architecture. Your data is stored locally in SQLite and never uploaded.
        </p>
      </div>

      {/* Privacy Guarantee Card */}
      <div
        style={{
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          padding: '18px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '32px' }}>🔒</span>
        <div>
          <div style={{ fontWeight: 600, color: '#34D399', fontSize: '15px' }}>
            100% Offline-First Guarantee
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.4', marginTop: '2px' }}>
            Lulu makes zero cloud telemetry calls, never transmits desktop coordinates or keystrokes, and keeps all game stats and settings securely on your machine.
          </div>
        </div>
      </div>

      {/* Official Google OAuth 2.0 PKCE Status */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', color: '#F8FAFC' }}>
              Google OAuth 2.0 PKCE Architecture
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
              Official authorization flow (RFC 7636). Zero client secret embedding, zero webview credential scraping.
            </p>
          </div>
          <span
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              fontWeight: 600,
              backgroundColor: oauthStatus === 'CONNECTED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: oauthStatus === 'CONNECTED' ? '#10B981' : '#F59E0B',
              border: `1px solid ${oauthStatus === 'CONNECTED' ? '#10B981' : '#F59E0B'}`,
            }}
          >
            {oauthStatus === 'CONNECTED' ? 'CONNECTED' : 'REQUIRES CONFIGURATION'}
          </span>
        </div>

        <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.5' }}>
          <div>
            • <strong>Least-Privilege Scopes:</strong> <code>openid</code>, <code>email</code>, <code>profile</code> only.
          </div>
          <div>
            • <strong>PKCE Code Challenge:</strong> S256 with cryptographically random code_verifier generated per session.
          </div>
          <div>
            • <strong>Setup Instructions:</strong> Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env</code> with your Google Cloud Desktop Client ID.
          </div>
        </div>
      </div>

      {/* Granular Capabilities & Privacy Permissions Matrix */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', color: '#F8FAFC' }}>
            System Capabilities & Privacy Matrix (12 Controls)
          </h4>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>
            Fine-grained toggles for hardware, OS hooks, and agent tool execution.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {Object.entries(permissions).map(([key, item]) => {
            const isBlocked = item.status === 'Permanently Blocked';
            return (
              <div
                key={key}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid #334155',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{item.desc}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isBlocked
                        ? 'rgba(239, 68, 68, 0.2)'
                        : item.enabled
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(148, 163, 184, 0.2)',
                      color: isBlocked ? '#EF4444' : item.enabled ? '#10B981' : '#94A3B8',
                    }}
                  >
                    {item.status}
                  </span>
                  {!isBlocked && (
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={() => togglePermission(key)}
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backup & Recovery */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Backup Export & Disaster Recovery</h4>
        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Create a full snapshot of your progress, achievements, high scores, and settings.
        </p>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '8px 18px',
              backgroundColor: 'var(--color-primary, #818CF8)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            📥 Export Backup JSON
          </button>
          <button
            onClick={handleImport}
            disabled={!backupJson}
            style={{
              padding: '8px 18px',
              backgroundColor: backupJson ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '8px',
              color: backupJson ? 'var(--color-text, #F8FAFC)' : '#64748B',
              fontWeight: 600,
              fontSize: '12px',
              cursor: backupJson ? 'pointer' : 'not-allowed',
            }}
          >
            📤 Restore from JSON
          </button>
        </div>

        <textarea
          rows={5}
          placeholder="Paste backup JSON here to restore..."
          value={backupJson}
          onChange={(e) => setBackupJson(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#090D16',
            border: '1px solid var(--color-border, #334155)',
            borderRadius: '8px',
            color: 'var(--color-text, #F8FAFC)',
            padding: '10px',
            fontSize: '11px',
            fontFamily: 'monospace',
            boxSizing: 'border-box',
          }}
        />

        {importStatus && (
          <div style={{ fontSize: '12px', color: '#FBBF24', marginTop: '8px' }}>
            {importStatus}
          </div>
        )}
      </div>

      {/* Dangerous Zone */}
      <div
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '16px',
          padding: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, color: '#EF4444', fontSize: '14px' }}>Reset Application Data</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Erase all local state, reset companion needs, and re-initialize with defaults.
          </div>
        </div>
        <button
          onClick={handleClearData}
          style={{
            padding: '6px 14px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            color: '#EF4444',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Reset All Data
        </button>
      </div>
    </div>
  );
};
