import React, { useState } from 'react';
import { notificationManager } from '../../../features/notifications/NotificationManager';
import { NotificationSettings } from '../../../features/notifications/types';
import { Bell, Shield, Send, CheckCircle2, AlertCircle, Eye, EyeOff, Radio } from 'lucide-react';

export const NotificationsTab: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>(notificationManager.getSettings());
  const [testApp, setTestApp] = useState('Telegram');
  const [testSummary, setTestSummary] = useState('New message from Team Lead');
  const [testBody, setTestBody] = useState('Hey, let us review the release notes today!');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const history = notificationManager.getHistory();

  const handleUpdate = (updates: Partial<NotificationSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    notificationManager.updateSettings(updates);
  };

  const toggleWhitelistApp = (app: string) => {
    const current = settings.whitelistedApps;
    const exists = current.includes(app);
    const updated = exists ? current.filter((a) => a !== app) : [...current, app];
    handleUpdate({ whitelistedApps: updated });
  };

  const handleSendTest = async () => {
    setStatusMsg('Sending test notification via Linux D-Bus / notify-send...');
    await notificationManager.sendTestNotification(testApp, testSummary, testBody);
    setTimeout(() => {
      setStatusMsg('Notification emitted! Watch Lulu react on desktop 🐾');
      setTimeout(() => setStatusMsg(null), 3000);
    }, 400);
  };

  const commonApps = [
    { id: 'Telegram', label: 'Telegram', icon: '✈️' },
    { id: 'Discord', label: 'Discord', icon: '🎮' },
    { id: 'Slack', label: 'Slack', icon: '💼' },
    { id: 'Email', label: 'Email', icon: '✉️' },
    { id: 'Browser', label: 'Browser', icon: '🌐' },
    { id: 'VS Code', label: 'VS Code', icon: '💻' },
    { id: 'Terminal', label: 'Terminal', icon: '🖥️' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={20} color="#818CF8" />
          <span>Linux Desktop Notification Center</span>
        </h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
          Native D-Bus (<code>org.freedesktop.Notifications</code>) integration with companion reactions.
        </p>
      </div>

      {/* D-Bus Status Banner */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '12px',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Radio size={18} color="#10B981" />
        <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
          D-Bus Notification Listener Active: Monitoring session notifications without cloud APIs.
        </div>
      </div>

      {/* Privacy & Master Controls */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={16} color="#818CF8" />
          <span>Notification & Privacy Controls</span>
        </div>

        {/* Master Enabled */}
        <div style={settingRowStyle}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>Enable Desktop Notifications</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Allow Lulu to detect desktop notifications.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleUpdate({ enabled: e.target.checked })}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
        </div>

        {/* Visual Reaction */}
        <div style={settingRowStyle}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>Companion Visual Reaction</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Lulu enters alert/surprised animation and speech bubble.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.visualReaction}
            onChange={(e) => handleUpdate({ visualReaction: e.target.checked })}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
        </div>

        {/* Read Message Content (Default OFF) */}
        <div style={settingRowStyle}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Read Message Content</span>
              {settings.readMessageContent ? (
                <Eye size={14} color="#FBBF24" />
              ) : (
                <EyeOff size={14} color="#10B981" />
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              When OFF, Lulu only identifies the application name for total privacy.
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.readMessageContent}
            onChange={(e) => handleUpdate({ readMessageContent: e.target.checked })}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
        </div>

        {/* Voice Notification */}
        <div style={settingRowStyle}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>Voice Chime Notification</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Play procedural audio chime when notifications arrive.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.voiceNotification}
            onChange={(e) => handleUpdate({ voiceNotification: e.target.checked })}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* App Whitelist */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>
          Application Filter Whitelist
        </div>
        <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#94A3B8' }}>
          Leave all unselected to react to any application, or select specific apps to monitor:
        </p>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {commonApps.map((app) => {
            const isSelected = settings.whitelistedApps.includes(app.id);
            return (
              <button
                key={app.id}
                onClick={() => toggleWhitelistApp(app.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid #818CF8' : '1px solid var(--color-border, #334155)',
                  backgroundColor: isSelected ? 'rgba(129, 140, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? '#818CF8' : '#94A3B8',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{app.icon}</span>
                <span>{app.label}</span>
                {isSelected && <CheckCircle2 size={12} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Test Notification Generator */}
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
        <div style={{ fontWeight: 600, fontSize: '14px' }}>Send Test Notification</div>

        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
          <select
            value={testApp}
            onChange={(e) => setTestApp(e.target.value)}
            style={{
              padding: '8px 10px',
              backgroundColor: 'var(--color-bg, #0F172A)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '12px',
            }}
          >
            {commonApps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={testSummary}
            onChange={(e) => setTestSummary(e.target.value)}
            placeholder="Notification Title / Summary"
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--color-bg, #0F172A)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '12px',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleSendTest}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary, #818CF8)',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Send size={14} />
            <span>Emit Test D-Bus Notification</span>
          </button>

          {statusMsg && (
            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 500 }}>
              {statusMsg}
            </span>
          )}
        </div>
      </div>

      {/* Recent Activity Log */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Notification History ({history.length})</div>
          {history.length > 0 && (
            <button
              onClick={() => {
                notificationManager.clearHistory();
                setSettings({ ...settings });
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Clear Log
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
            No desktop notifications captured yet. Send a test notification above to verify!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
            {history.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-bg, #0F172A)',
                  border: '1px solid var(--color-border, #334155)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: '#818CF8' }}>[{n.appName}]</span>{' '}
                  <span style={{ color: '#E2E8F0' }}>{n.summary}</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748B' }}>
                  {new Date(n.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const settingRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
};
