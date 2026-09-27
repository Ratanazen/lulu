import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  ArrowUpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  GitBranch, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Database,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { updateService, UpdateCheckResult, UpdateTaskResult } from '../../../services/updateService';

export const AboutTab: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [taskResult, setTaskResult] = useState<UpdateTaskResult | null>(null);
  const [showLog, setShowLog] = useState<boolean>(false);

  useEffect(() => {
    handleCheckUpdates();
  }, []);

  const handleCheckUpdates = async () => {
    setIsChecking(true);
    try {
      const res = await updateService.checkForUpdates();
      setUpdateInfo(res);
    } catch (err) {
      console.error('Update check failed:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRunUpdate = async () => {
    setIsUpdating(true);
    setShowLog(true);
    try {
      const res = await updateService.runUpdateTask();
      setTaskResult(res);
      // Re-check status after update
      await handleCheckUpdates();
    } catch (err: any) {
      setTaskResult({
        success: false,
        message: `Task execution failed: ${err?.message || String(err)}`,
        outputLog: `Error: ${err?.message || String(err)}`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img
          src="/icons/lulu-icon.svg"
          alt="Lulu Mascot"
          style={{ width: '64px', height: '64px', filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.4))' }}
        />
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--color-text, #F8FAFC)' }}>
            Lulu Desktop Companion
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--color-primary, #818CF8)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span>Version {updateInfo?.currentVersion || '0.1.0'}</span>
            <span>•</span>
            <span>Offline-First Native Platform</span>
            {updateInfo?.currentCommit && (
              <>
                <span>•</span>
                <span style={{ fontFamily: 'monospace', opacity: 0.8 }}>#{updateInfo.currentCommit}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '18px 20px',
          fontSize: '13px',
          lineHeight: '1.6',
          color: 'var(--color-text, #F8FAFC)',
        }}
      >
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>Lulu</strong> is a modern, offline-first, interactive desktop companion engineered from the ground up with Tauri 2, Rust, React, TypeScript, and SQLite.
        </p>
        <p style={{ margin: 0 }}>
          Unlike conventional overlays, Lulu lives in a true native OS transparent frameless window, moves using real OS coordinates, supports complex multi-monitor workspaces, and executes game and behavior logic locally with zero cloud telemetry.
        </p>
      </div>

      {/* UPDATE TASK & PIPELINE CARD */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#818CF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowUpCircle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: '#F8FAFC' }}>
                Application Update & Build Pipeline
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #94A3B8)' }}>
                Inspect git status, pull upstream changes, and compile release binary.
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {updateInfo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: isUpdating
                  ? 'rgba(56, 189, 248, 0.15)'
                  : updateInfo.hasUpdate
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(16, 185, 129, 0.15)',
                color: isUpdating
                  ? '#38BDF8'
                  : updateInfo.hasUpdate
                  ? '#F59E0B'
                  : '#10B981',
                border: `1px solid ${
                  isUpdating
                    ? 'rgba(56, 189, 248, 0.3)'
                    : updateInfo.hasUpdate
                    ? 'rgba(245, 158, 11, 0.3)'
                    : 'rgba(16, 185, 129, 0.3)'
                }`,
              }}
            >
              {isUpdating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Updating Lulu...</span>
                </>
              ) : updateInfo.hasUpdate ? (
                <>
                  <AlertCircle size={14} />
                  <span>{updateInfo.commitsBehind} commit(s) available</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Up to Date</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Update Details Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: '#94A3B8' }}>Local Commit</span>
            <span style={{ fontFamily: 'monospace', color: '#F8FAFC', fontWeight: 600 }}>
              {updateInfo?.currentCommit || 'Scanning...'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: '#94A3B8' }}>Remote Tracking</span>
            <span style={{ fontFamily: 'monospace', color: '#F8FAFC', fontWeight: 600 }}>
              {updateInfo?.remoteCommit || 'Checking...'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: '#94A3B8' }}>Repository Clean</span>
            <span style={{ color: updateInfo?.isClean ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
              {updateInfo ? (updateInfo.isClean ? 'Clean' : 'Modified files detected') : 'Scanning...'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: '#94A3B8' }}>Status</span>
            <span style={{ color: '#CBD5E1' }}>
              {updateInfo?.statusMessage || 'Awaiting update status check...'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCheckUpdates}
            disabled={isChecking || isUpdating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid var(--color-border, #334155)',
              color: '#F8FAFC',
              cursor: isChecking || isUpdating ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? 'Checking...' : 'Check for Updates'}</span>
          </button>

          <button
            onClick={handleRunUpdate}
            disabled={isUpdating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: isUpdating ? '#475569' : '#10B981',
              border: 'none',
              color: '#FFFFFF',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: isUpdating ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)',
            }}
          >
            <ArrowUpCircle size={15} />
            <span>{isUpdating ? 'Executing Update Pipeline...' : 'Run Update Task'}</span>
          </button>

          {(taskResult || isUpdating) && (
            <button
              onClick={() => setShowLog(!showLog)}
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border, #334155)',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              <Terminal size={14} />
              <span>{showLog ? 'Hide Log' : 'View Output Log'}</span>
              {showLog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        {/* Live Execution Output Terminal */}
        {showLog && (
          <div
            style={{
              marginTop: '4px',
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '14px',
              fontFamily: 'monospace',
              fontSize: '12px',
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '6px' }}>
              <span style={{ color: '#38BDF8', fontWeight: 600 }}>Update Pipeline Console Output</span>
              {taskResult && (
                <span style={{ color: taskResult.success ? '#10B981' : '#EF4444', fontSize: '11px' }}>
                  {taskResult.success ? '✓ SUCCESS' : '✕ FAILED'}
                </span>
              )}
            </div>

            {isUpdating && !taskResult && (
              <div style={{ color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                <RefreshCw size={14} className="animate-spin" />
                <span>Running update task (pulling upstream, building assets, compiling binary)...</span>
              </div>
            )}

            {taskResult && (
              <pre style={{ margin: 0, color: '#E2E8F0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {taskResult.outputLog || taskResult.message}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Info Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div style={infoBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', marginBottom: '6px', color: '#F8FAFC' }}>
            <ShieldCheck size={16} color="#38BDF8" />
            <span>Security First</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
            Strict IPC validation and sandboxed plugin limits.
          </div>
        </div>

        <div style={infoBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', marginBottom: '6px', color: '#F8FAFC' }}>
            <Cpu size={16} color="#818CF8" />
            <span>Zero-Idle Pacing</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
            0.0% CPU idle footprint and decoupled movement loops.
          </div>
        </div>

        <div style={infoBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', marginBottom: '6px', color: '#F8FAFC' }}>
            <Database size={16} color="#10B981" />
            <span>Local SQLite</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
            Automated schema migrations and disaster recovery.
          </div>
        </div>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '10px' }}>
        Licensed under the MIT License • Built with pride for companion developers everywhere.
      </div>
    </div>
  );
};

const infoBoxStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-bg-card, #1E293B)',
  border: '1px solid var(--color-border, #334155)',
  borderRadius: '12px',
  padding: '14px',
};
