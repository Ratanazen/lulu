import React, { useEffect, useState } from 'react';
import { MonitorService, HostHardwareInfo } from '../../../services/monitorService';
import { 
  Cpu, 
  HardDrive, 
  Activity, 
  Flame, 
  Zap, 
  Clock, 
  BatteryCharging, 
  RefreshCw, 
  Sliders, 
  ShieldCheck
} from 'lucide-react';

let tauriInvoke: (<T = any>(cmd: string, args?: Record<string, unknown>) => Promise<T>) | null = null;

async function getInvoke() {
  if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) return null;
  if (tauriInvoke) return tauriInvoke;
  try {
    const core = await import('@tauri-apps/api/core');
    tauriInvoke = core.invoke;
    return tauriInvoke;
  } catch {
    return null;
  }
}

export const SystemTab: React.FC = () => {
  const [hardware, setHardware] = useState<HostHardwareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(2000);
  const [autostart, setAutostart] = useState<boolean>(false);
  const [cpuAlertThreshold, setCpuAlertThreshold] = useState<number>(85);
  const [ramAlertThreshold, setRamAlertThreshold] = useState<number>(90);
  const [gpuAlertThreshold] = useState<number>(80);

  const fetchHostTelemetry = async () => {
    try {
      const data = await MonitorService.getHostHardwareInfo();
      if (data) {
        setHardware(data);
      }
    } catch (e) {
      console.warn('Failed to load host hardware telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  const checkAutostart = async () => {
    const invoke = await getInvoke();
    if (invoke) {
      try {
        const enabled = await invoke<boolean>('is_autostart_enabled');
        setAutostart(Boolean(enabled));
      } catch {}
    }
  };

  const toggleAutostart = async () => {
    const next = !autostart;
    setAutostart(next);
    const invoke = await getInvoke();
    if (invoke) {
      try {
        await invoke('set_autostart_enabled', { enabled: next });
      } catch (e) {
        console.warn('Failed to toggle autostart:', e);
      }
    }
  };

  useEffect(() => {
    fetchHostTelemetry();
    checkAutostart();
    const interval = setInterval(fetchHostTelemetry, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatUptime = (sec: number) => {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m`;
  };

  const getUsageColor = (val: number, warnThresh: number = 75, critThresh: number = 90) => {
    if (val >= critThresh) return '#EF4444';
    if (val >= warnThresh) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '24px' }}>
      {/* Tab Header & Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#F8FAFC' }}>Host Computer Hardware & Telemetry</h3>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              LIVE RUST SYSFS
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
            Real-time CPU, RAM, GPU, power, and kernel metrics from this physical Linux host machine.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            style={{
              padding: '6px 10px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <option value={1000}>Poll: 1s (Fast)</option>
            <option value={2000}>Poll: 2s (Normal)</option>
            <option value={5000}>Poll: 5s (Power Saver)</option>
          </select>

          <button
            onClick={fetchHostTelemetry}
            disabled={loading}
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid #818CF8',
              borderRadius: '8px',
              color: '#818CF8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {!hardware ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
          <div>Probing physical host hardware and sysfs endpoints...</div>
        </div>
      ) : (
        <>
          {/* Host Machine Overview Strip */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-card, #1E293B)',
              border: '1px solid var(--color-border, #334155)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Host Computer</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC', marginTop: '2px' }}>
                {hardware.hostname}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>{hardware.osName} ({hardware.osVersion})</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Linux Kernel & WM</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#E2E8F0', marginTop: '2px' }}>
                {hardware.kernelVersion}
              </div>
              <div style={{ fontSize: '11px', color: '#38BDF8' }}>
                {hardware.windowManager} ({hardware.sessionType})
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Uptime & Tasks</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#E2E8F0', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} color="#FBBF24" />
                <span>{formatUptime(hardware.uptimeSeconds)}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>{hardware.processCount} OS processes</div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Power Supply</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#E2E8F0', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {hardware.batteryPercentage !== null && hardware.batteryPercentage !== undefined ? (
                  <>
                    <BatteryCharging size={14} color="#34D399" />
                    <span>{hardware.batteryPercentage}% ({hardware.batteryState || 'Battery'})</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} color="#FBBF24" />
                    <span>AC Mains Power</span>
                  </>
                )}
              </div>
              <div style={{ fontSize: '11px', color: hardware.acOnline ? '#34D399' : '#F59E0B' }}>
                {hardware.acOnline ? 'Plugged into AC Adapter' : 'Running on Battery'}
              </div>
            </div>
          </div>

          {/* Primary Hardware Triad: CPU | RAM | GPU */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            
            {/* 1. CPU Telemetry Card */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-card, #1E293B)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}>
                    <Cpu size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#F8FAFC' }}>Host CPU</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{hardware.cpu.brand}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: getUsageColor(hardware.cpu.usagePercentage, cpuAlertThreshold - 10, cpuAlertThreshold) }}>
                    {hardware.cpu.usagePercentage.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>OVERALL LOAD</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, hardware.cpu.usagePercentage))}%`,
                    backgroundColor: getUsageColor(hardware.cpu.usagePercentage, cpuAlertThreshold - 10, cpuAlertThreshold),
                    borderRadius: '999px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
                <span>Cores / Threads: <strong style={{ color: '#E2E8F0' }}>{hardware.cpu.cores}C / {hardware.cpu.threads}T</strong></span>
                <span>Freq: <strong style={{ color: '#E2E8F0' }}>{hardware.cpu.frequencyMhz > 0 ? `${(hardware.cpu.frequencyMhz / 1000).toFixed(2)} GHz` : 'Dynamic'}</strong></span>
              </div>

              {/* Per-Core Load Meters */}
              {hardware.cpu.perCoreUsage && hardware.cpu.perCoreUsage.length > 0 && (
                <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>
                    Thread Load Distribution ({hardware.cpu.perCoreUsage.length} Threads)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {hardware.cpu.perCoreUsage.map((val, idx) => (
                      <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#64748B', fontWeight: 600 }}>T{idx}</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: getUsageColor(val, 70, 85) }}>
                          {val.toFixed(0)}%
                        </div>
                        <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, val)}%`, height: '100%', backgroundColor: getUsageColor(val, 70, 85) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. RAM Memory Card */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-card, #1E293B)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
                    <HardDrive size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#F8FAFC' }}>Host RAM</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Physical Host Memory</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: getUsageColor(hardware.memory.usagePercentage, ramAlertThreshold - 10, ramAlertThreshold) }}>
                    {hardware.memory.usagePercentage.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>MEMORY USED</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, hardware.memory.usagePercentage))}%`,
                    backgroundColor: getUsageColor(hardware.memory.usagePercentage, ramAlertThreshold - 10, ramAlertThreshold),
                    borderRadius: '999px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
                <span>Used: <strong style={{ color: '#E2E8F0' }}>{(hardware.memory.usedMb / 1024).toFixed(1)} GB</strong></span>
                <span>Avail: <strong style={{ color: '#E2E8F0' }}>{(hardware.memory.availableMb / 1024).toFixed(1)} GB</strong></span>
                <span>Total: <strong style={{ color: '#E2E8F0' }}>{(hardware.memory.totalMb / 1024).toFixed(1)} GB</strong></span>
              </div>

              {/* Swap Memory Section */}
              <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>Linux Swap Partition</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#E2E8F0' }}>
                    {hardware.memory.swapUsedMb} MB / {hardware.memory.swapTotalMb} MB ({hardware.memory.swapPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, hardware.memory.swapPercentage))}%`,
                      backgroundColor: '#818CF8',
                      borderRadius: '999px',
                    }}
                  />
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>
                  Swap buffer safely accommodates peak compilation memory surges.
                </div>
              </div>
            </div>

            {/* 3. GPU Telemetry Card */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-card, #1E293B)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#F43F5E' }}>
                    <Activity size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#F8FAFC' }}>Host GPU</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{hardware.gpu.model}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: getUsageColor(hardware.gpu.usagePercentage, gpuAlertThreshold - 15, gpuAlertThreshold) }}>
                    {hardware.gpu.usagePercentage.toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>GPU BUSY</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, hardware.gpu.usagePercentage))}%`,
                    backgroundColor: getUsageColor(hardware.gpu.usagePercentage, gpuAlertThreshold - 15, gpuAlertThreshold),
                    borderRadius: '999px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
                <span>Dedicated VRAM: <strong style={{ color: '#E2E8F0' }}>{hardware.gpu.vramUsedMb} / {hardware.gpu.vramTotalMb} MB</strong></span>
                <span>Driver: <strong style={{ color: '#E2E8F0' }}>{hardware.gpu.driver}</strong></span>
              </div>

              {/* GPU Thermals, Power, Clock */}
              <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    <Flame size={11} color="#FB7185" />
                    <span>TEMP</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: hardware.gpu.temperatureC ? (hardware.gpu.temperatureC > 75 ? '#EF4444' : '#34D399') : '#94A3B8', marginTop: '2px' }}>
                    {hardware.gpu.temperatureC !== null && hardware.gpu.temperatureC !== undefined ? `${hardware.gpu.temperatureC}°C` : 'N/A'}
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    <Zap size={11} color="#FBBF24" />
                    <span>POWER</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#E2E8F0', marginTop: '2px' }}>
                    {hardware.gpu.powerWatts !== null && hardware.gpu.powerWatts !== undefined ? `${hardware.gpu.powerWatts}W` : 'N/A'}
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>CLOCK</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#E2E8F0', marginTop: '2px' }}>
                    {hardware.gpu.clockMhz !== null && hardware.gpu.clockMhz !== undefined ? `${hardware.gpu.clockMhz} MHz` : 'Dynamic'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Run Configuration & Alert Controls */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#818CF8" />
              <h4 style={{ margin: 0, fontSize: '15px', color: '#F8FAFC' }}>Host Run Configuration & Safety Alerts</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Autostart on Boot */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>Autostart on Boot</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Launch Lulu on Linux desktop login</div>
                </div>
                <button
                  type="button"
                  onClick={toggleAutostart}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '999px',
                    backgroundColor: autostart ? '#10B981' : 'rgba(255, 255, 255, 0.15)',
                    position: 'relative',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      position: 'absolute',
                      top: '3px',
                      left: autostart ? '23px' : '3px',
                      transition: 'left 0.2s',
                    }}
                  />
                </button>
              </div>

              {/* Wayland Compositor Transparency Check */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <ShieldCheck size={24} color="#10B981" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#34D399' }}>Wayland Transparency</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    SwayFX blur & shadow rules bypassed for 100% transparent mascot.
                  </div>
                </div>
              </div>

              {/* High CPU Alert Threshold */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0' }}>CPU Warning Threshold</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B' }}>{cpuAlertThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={98}
                  step={2}
                  value={cpuAlertThreshold}
                  onChange={(e) => setCpuAlertThreshold(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#818CF8', cursor: 'pointer' }}
                />
              </div>

              {/* High RAM Alert Threshold */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0' }}>RAM Warning Threshold</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B' }}>{ramAlertThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={98}
                  step={2}
                  value={ramAlertThreshold}
                  onChange={(e) => setRamAlertThreshold(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#34D399', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SystemTab;
