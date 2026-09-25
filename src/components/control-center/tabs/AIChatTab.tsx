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
  EyeOff
} from 'lucide-react';
import { AIProviderId, ProviderConfig } from '../../../features/ai/types';
import { aiProviderManager } from '../../../features/ai/AIProviderManager';

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

        {/* API Key (if cloud provider) */}
        {activeProvider !== 'ollama' && activeProvider !== 'offline' && (
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
