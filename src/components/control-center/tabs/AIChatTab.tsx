import React, { useState } from 'react';
import { 
  Bot, 
  Cpu, 
  Key, 
  Globe, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw,
  Sparkles,
  Eye,
  EyeOff,
  Terminal
} from 'lucide-react';
import { AIProviderId, ProviderConfig } from '../../../features/ai/types';
import { aiProviderManager } from '../../../features/ai/AIProviderManager';
import { AiCliService, AiCliStatus, AiCliExecutionResult } from '../../../features/ai/AiCliService';

export const AIChatTab: React.FC = () => {
  const [activeProvider, setActiveProvider] = useState<AIProviderId>(
    aiProviderManager.getActiveProviderId()
  );
  const [configs, setConfigs] = useState<Record<AIProviderId, ProviderConfig>>(
    aiProviderManager.getAllConfigs()
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; models?: string[] } | null>(null);

  // Native AI CLI status state
  const [cliProviders, setCliProviders] = useState<AiCliStatus[]>([]);
  const [loadingCli, setLoadingCli] = useState(false);
  const [executingCli, setExecutingCli] = useState<string | null>(null);
  const [cliResult, setCliResult] = useState<{ provider: string; result: AiCliExecutionResult } | null>(null);

  React.useEffect(() => {
    loadCliProviders();
  }, []);

  const loadCliProviders = async (force = false) => {
    setLoadingCli(true);
    try {
      const detected = await AiCliService.detectProviders(force);
      setCliProviders(detected);
    } catch (err) {
      console.error('Failed to probe AI CLI providers:', err);
    } finally {
      setLoadingCli(false);
    }
  };

  const handleTestCli = async (providerId: string) => {
    setExecutingCli(providerId);
    setCliResult(null);
    try {
      const res = await AiCliService.executeCli(providerId, ['--version']);
      setCliResult({ provider: providerId, result: res });
    } catch (err: any) {
      setCliResult({
        provider: providerId,
        result: {
          success: false,
          stdout: '',
          stderr: err?.message || String(err),
          exitCode: -1,
          executionTimeMs: 0,
        },
      });
    } finally {
      setExecutingCli(null);
    }
  };

  const currentConfig = configs[activeProvider];

  const handleProviderSelect = (id: AIProviderId) => {
    setActiveProvider(id);
    aiProviderManager.setActiveProviderId(id);
    setTestResult(null);
  };

  const handleConfigChange = (partial: Partial<ProviderConfig>) => {
    const updated = { ...currentConfig, ...partial };
    setConfigs((prev) => ({ ...prev, [activeProvider]: updated }));
    aiProviderManager.updateConfig(activeProvider, partial);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const provider = aiProviderManager.getProvider(activeProvider);
      if (!provider) {
        setTestResult({ success: true, message: 'Built-in offline engine is always active!' });
        return;
      }
      const res = await provider.testConnection(currentConfig);
      setTestResult(res);
      if (res.models && res.models.length > 0) {
        handleConfigChange({
          availableModels: res.models,
          selectedModel: res.models[0],
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Test failed' });
    } finally {
      setTestingConnection(false);
    }
  };

  const providers: { id: AIProviderId; label: string; icon: string; desc: string }[] = [
    { id: 'agy', label: 'Antigravity (AGY)', icon: '🚀', desc: 'Google OAuth session, Gemini 3.8 & Claude' },
    { id: 'ollama', label: 'Ollama (Local AI)', icon: '🦙', desc: '100% private, free, offline local LLM' },
    { id: 'openai', label: 'OpenAI', icon: '⚡', desc: 'GPT-4o, GPT-4o-mini' },
    { id: 'gemini', label: 'Google Gemini', icon: '✨', desc: 'Gemini 1.5 Flash & Pro' },
    { id: 'anthropic', label: 'Anthropic Claude', icon: '🧠', desc: 'Claude 3.5 Sonnet & Haiku' },
    { id: 'custom', label: 'Custom Endpoint', icon: '🌐', desc: 'LM Studio, vLLM, OpenRouter' },
    { id: 'offline', label: 'Offline Rulebook', icon: '📦', desc: 'No network or keys needed' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818CF8', fontSize: '12px', fontWeight: 700 }}>
          <Bot size={15} />
          <span>INTELLIGENCE & LLM ENGINE</span>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>AI Provider Configuration</h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted, #94A3B8)', marginTop: '2px' }}>
          Connect local Ollama or your favorite cloud AI provider. Lulu adapts seamlessly to any model.
        </p>
      </div>

      {/* Provider Selector Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {providers.map((p) => {
          const isSelected = activeProvider === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleProviderSelect(p.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--color-bg-card, #1E293B)',
                border: `1.5px solid ${isSelected ? '#818CF8' : 'var(--color-border, #334155)'}`,
                color: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '20px' }}>{p.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#818CF8' : '#F8FAFC' }}>
                  {p.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #94A3B8)', marginTop: '2px' }}>
                  {p.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Provider Details Card */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="#818CF8" />
            <span>{currentConfig.name} Settings</span>
          </h3>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid #818CF8',
              color: '#818CF8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: testingConnection ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCw size={13} className={testingConnection ? 'spin' : ''} />
            <span>{testingConnection ? 'Testing...' : 'Test Connection'}</span>
          </button>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${testResult.success ? '#10B981' : '#EF4444'}`,
              color: testResult.success ? '#10B981' : '#EF4444',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Base URL (if applicable) */}
        {currentConfig.baseUrl !== undefined && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted, #94A3B8)', marginBottom: '6px' }}>
              Base API URL
            </label>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <Globe size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
              <input
                type="text"
                value={currentConfig.baseUrl || ''}
                onChange={(e) => handleConfigChange({ baseUrl: e.target.value })}
                placeholder="e.g. http://localhost:11434"
                style={inputFieldStyle}
              />
            </div>
          </div>
        )}

        {/* API Key (if cloud provider requiring keys) */}
        {activeProvider !== 'ollama' && activeProvider !== 'offline' && activeProvider !== 'agy' && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted, #94A3B8)', marginBottom: '6px' }}>
              API Key (stored locally and encrypted)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <Key size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
              <input
                type={showApiKey ? 'text' : 'password'}
                value={currentConfig.apiKey || ''}
                onChange={(e) => handleConfigChange({ apiKey: e.target.value })}
                placeholder="sk-..."
                style={{ ...inputFieldStyle, paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                }}
              >
                {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        )}

        {/* Antigravity OAuth Session Notice */}
        {activeProvider === 'agy' && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '20px' }}>🔐</span>
            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
              <div style={{ fontWeight: 600, color: '#C7D2FE' }}>Zero API Keys Required</div>
              <div style={{ color: 'var(--color-text-muted, #94A3B8)' }}>
                Lulu communicates directly with your local Antigravity CLI Google OAuth session (<code>~/.gemini/antigravity-cli/antigravity-oauth-token</code>).
              </div>
            </div>
          </div>
        )}

        {/* Selected Model */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted, #94A3B8)', marginBottom: '6px' }}>
            Model Selection
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {currentConfig.availableModels && currentConfig.availableModels.length > 0 ? (
              <select
                value={currentConfig.selectedModel}
                onChange={(e) => handleConfigChange({ selectedModel: e.target.value })}
                style={{ ...inputFieldStyle, paddingLeft: '12px', flex: 1 }}
              >
                {currentConfig.availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={currentConfig.selectedModel}
                onChange={(e) => handleConfigChange({ selectedModel: e.target.value })}
                placeholder="Model name"
                style={{ ...inputFieldStyle, paddingLeft: '12px', flex: 1 }}
              />
            )}
          </div>
        </div>

        {/* Sliders (Temperature & Max Tokens) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600 }}>Creativity (Temperature)</span>
              <span style={{ color: '#818CF8', fontWeight: 700 }}>{currentConfig.temperature}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              value={currentConfig.temperature}
              onChange={(e) => handleConfigChange({ temperature: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#818CF8' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600 }}>Max Tokens</span>
              <span style={{ color: '#818CF8', fontWeight: 700 }}>{currentConfig.maxTokens}</span>
            </div>
            <input
              type="range"
              min="256"
              max="4096"
              step="256"
              value={currentConfig.maxTokens}
              onChange={(e) => handleConfigChange({ maxTokens: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#818CF8' }}
            />
          </div>
        </div>
      </div>

      {/* Native Host AI CLI Integration */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Terminal size={16} color="#38BDF8" />
              <span>Native Host AI CLI Tools</span>
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8' }}>
              Authentic detection of official CLI tools directly installed on your Linux system.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadCliProviders(true)}
            disabled={loadingCli}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38BDF8',
              color: '#38BDF8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: loadingCli ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCw size={13} className={loadingCli ? 'spin' : ''} />
            <span>{loadingCli ? 'Scanning...' : 'Re-scan PATH'}</span>
          </button>
        </div>

        {/* CLI Providers Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {cliProviders.map((cli) => {
            const isInstalled = cli.status === 'INSTALLED' || cli.status === 'RUNNING';
            return (
              <div
                key={cli.id}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${isInstalled ? 'rgba(16, 185, 129, 0.4)' : '#334155'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>{cli.name}</span>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                      Binary: <code>{cli.id}</code>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      backgroundColor: isInstalled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: isInstalled ? '#10B981' : '#F59E0B',
                      border: `1px solid ${isInstalled ? '#10B981' : '#F59E0B'}`,
                    }}
                  >
                    {cli.status}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {cli.executablePath ? (
                    <div>
                      <span style={{ color: '#94A3B8' }}>Path: </span>
                      <code style={{ color: '#38BDF8' }}>{cli.executablePath}</code>
                    </div>
                  ) : (
                    <div style={{ color: '#94A3B8' }}>Not found in current $PATH</div>
                  )}
                  {cli.version && (
                    <div>
                      <span style={{ color: '#94A3B8' }}>Version: </span>
                      <span>{cli.version}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                  {isInstalled ? (
                    <button
                      type="button"
                      onClick={() => handleTestCli(cli.id)}
                      disabled={executingCli === cli.id}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#1E293B',
                        border: '1px solid #334155',
                        color: '#F8FAFC',
                        fontSize: '12px',
                        cursor: executingCli === cli.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Terminal size={12} />
                      <span>{executingCli === cli.id ? 'Probing...' : 'Probe CLI Version'}</span>
                    </button>
                  ) : (
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(30, 41, 59, 0.8)',
                        fontSize: '11px',
                        color: '#94A3B8',
                        lineHeight: '1.4',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#E2E8F0', marginBottom: '2px' }}>Installation:</div>
                      <code>{cli.installGuidance}</code>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CLI Test Output Terminal */}
        {cliResult && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              fontFamily: 'monospace',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
              <span>$ {cliResult.provider} --version</span>
              <span style={{ color: cliResult.result.success ? '#10B981' : '#EF4444' }}>
                Exit: {cliResult.result.exitCode ?? 'N/A'} ({cliResult.result.executionTimeMs}ms)
              </span>
            </div>
            {cliResult.result.stdout && (
              <pre style={{ margin: 0, color: '#10B981', whiteSpace: 'pre-wrap' }}>
                {cliResult.result.stdout}
              </pre>
            )}
            {cliResult.result.stderr && (
              <pre style={{ margin: 0, color: '#EF4444', whiteSpace: 'pre-wrap' }}>
                {cliResult.result.stderr}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const inputFieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px 10px 38px',
  borderRadius: '10px',
  backgroundColor: 'var(--color-bg, #0F172A)',
  border: '1px solid var(--color-border, #334155)',
  color: '#FFFFFF',
  fontSize: '13px',
  outline: 'none',
};
