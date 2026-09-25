import React, { useState } from 'react';
import { StorageService } from '../../../services/storageService';
import { useLuluStore } from '../../../stores/useLuluStore';

export const PrivacyStorageTab: React.FC = () => {
  const { speak } = useLuluStore();
  const [backupJson, setBackupJson] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

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
