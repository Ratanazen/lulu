import React, { useState } from 'react';
import { useProviderStore } from '../../stores/useProviderStore';
import { usePermissionStore } from '../../stores/usePermissionStore';
import { ProviderType } from '../../types/provider';
import { PermissionLevel } from '../../types/permissions';
import { X, Cpu, Shield, Keyboard, Zap, RefreshCw, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'permissions' | 'shortcuts' | 'performance'>('ai');
  const [showApiKey, setShowApiKey] = useState(false);

  const {
    activeType,
    setActiveType,
    endpoint,
    setEndpoint,
    apiKey,
    setApiKey,
    selectedModel,
    setSelectedModel,
    availableModels,
    ollamaStatus,
    detectOllama,
    isDetecting,
    testConnection,
    testStatus,
  } = useProviderStore();

  const { level, setLevel } = usePermissionStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#181b22] border border-[#2b313e] rounded-xl shadow-2xl max-w-xl w-full h-[520px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1f232d] border-b border-[#2b313e]">
          <h2 className="text-sm font-semibold text-gray-100">Lulu Code Settings</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-40 bg-[#14161d] border-r border-[#2b313e] p-2 space-y-1 select-none">
            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'ai' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1f232d] hover:text-gray-200'
              }`}
            >
              <Cpu size={14} /> AI Provider
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'permissions' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1f232d] hover:text-gray-200'
              }`}
            >
              <Shield size={14} /> Permissions
            </button>
            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'shortcuts' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1f232d] hover:text-gray-200'
              }`}
            >
              <Keyboard size={14} /> Shortcuts
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'performance' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1f232d] hover:text-gray-200'
              }`}
            >
              <Zap size={14} /> Performance
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-5 overflow-y-auto text-xs space-y-4">
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 font-medium mb-1.5">AI Engine Provider</label>
                  <select
                    value={activeType}
                    onChange={(e) => setActiveType(e.target.value as ProviderType)}
                    className="w-full bg-[#12141a] border border-[#2b313e] rounded-lg px-3 py-2 text-gray-100 outline-none focus:border-blue-500"
                  >
                    <option value="LOCAL_OLLAMA">Local Ollama (Offline First, 0 Cloud)</option>
                    <option value="OPENAI">OpenAI / Codex API (GPT-4o, o1, Codex)</option>
                    <option value="GOOGLE_GEMINI">Google Gemini API (Gemini 1.5/2.0 Flash & Pro)</option>
                    <option value="OPENAI_COMPATIBLE">OpenAI-Compatible (DeepSeek, OpenRouter, vLLM)</option>
                    <option value="CUSTOM">Standalone Deterministic Offline Heuristics</option>
                  </select>
                </div>

                {/* Provider specific inputs */}
                {activeType !== 'CUSTOM' && (
                  <div className="space-y-3">
                    {/* Endpoint */}
                    {activeType !== 'GOOGLE_GEMINI' && (
                      <div>
                        <label className="block text-gray-400 font-medium mb-1">
                          {activeType === 'LOCAL_OLLAMA' ? 'Ollama Endpoint' : 'Base API URL'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={endpoint}
                            onChange={(e) => setEndpoint(e.target.value)}
                            className="flex-1 bg-[#12141a] border border-[#2b313e] rounded-lg px-3 py-1.5 text-gray-100 outline-none focus:border-blue-500"
                          />
                          {activeType === 'LOCAL_OLLAMA' && (
                            <button
                              onClick={() => detectOllama()}
                              disabled={isDetecting}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition disabled:opacity-50"
                            >
                              <RefreshCw size={12} className={isDetecting ? 'animate-spin' : ''} /> Detect
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* API Key */}
                    {activeType !== 'LOCAL_OLLAMA' && (
                      <div>
                        <label className="block text-gray-400 font-medium mb-1">API Key</label>
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={activeType === 'GOOGLE_GEMINI' ? 'AIzaSy...' : 'sk-...'}
                            className="w-full bg-[#12141a] border border-[#2b313e] rounded-lg px-3 py-1.5 pr-8 text-gray-100 outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-200"
                          >
                            {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Model name / selector */}
                    <div>
                      <label className="block text-gray-400 font-medium mb-1">Model Name</label>
                      {activeType === 'LOCAL_OLLAMA' && availableModels.length > 0 ? (
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full bg-[#12141a] border border-[#2b313e] rounded-lg px-3 py-1.5 text-gray-100 outline-none"
                        >
                          {availableModels.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          placeholder={
                            activeType === 'OPENAI'
                              ? 'gpt-4o'
                              : activeType === 'GOOGLE_GEMINI'
                              ? 'gemini-1.5-flash'
                              : 'qwen2.5-coder:latest'
                          }
                          className="w-full bg-[#12141a] border border-[#2b313e] rounded-lg px-3 py-1.5 text-gray-100 outline-none focus:border-blue-500 font-mono"
                        />
                      )}
                    </div>

                    {/* Test Connection Button */}
                    <div className="pt-1">
                      <button
                        onClick={() => testConnection()}
                        disabled={testStatus?.testing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f232d] hover:bg-[#2b313e] border border-[#3b4354] text-gray-200 font-medium transition disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={testStatus?.testing ? 'animate-spin text-blue-400' : ''} />
                        {testStatus?.testing ? 'Testing connection...' : 'Test Connection'}
                      </button>

                      {testStatus && !testStatus.testing && (
                        <div
                          className={`mt-2 p-2.5 rounded-lg border flex items-start gap-2 ${
                            testStatus.success
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-red-500/10 border-red-500/30 text-red-300'
                          }`}
                        >
                          {testStatus.success ? (
                            <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                          )}
                          <span className="leading-snug break-all">{testStatus.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeType === 'CUSTOM' && (
                  <div className="p-3 rounded-lg bg-[#12141a] border border-[#2b313e] text-gray-400 leading-relaxed text-[11px]">
                    Lulu Code will run completely offline using native workspace heuristics, diagnostics regex parsers, and safe atomic patch generation without external network calls.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 font-medium mb-1.5">Default Permission Policy</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as PermissionLevel)}
                    className="w-full bg-[#12141a] border border-[#2b313e] rounded-lg px-3 py-2 text-gray-100 outline-none"
                  >
                    <option value="READ_ONLY">READ_ONLY — Inspect only, never write or execute</option>
                    <option value="SAFE_EDIT">SAFE_EDIT — Edit files and run safe tests, confirm commands (Recommended)</option>
                    <option value="FULL_EDIT">FULL_EDIT — Full file access, confirm dangerous operations</option>
                    <option value="COMMAND_CONFIRM">COMMAND_CONFIRM — Confirm every shell command</option>
                    <option value="AUTONOMOUS">AUTONOMOUS — Fully autonomous within workspace sandbox</option>
                  </select>
                </div>
                <div className="p-3 rounded-lg bg-[#12141a] border border-[#2b313e] text-gray-400 leading-relaxed text-[11px]">
                  Protected files (such as <code className="text-cyan-400">.env</code>, SSH private keys, and root files) and dangerous shell commands (<code className="text-red-400">sudo</code>, <code className="text-red-400">rm -rf /</code>) are always shielded regardless of mode.
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-[#2b313e]">
                  <span className="text-gray-400">Save File</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#12141a] border border-[#2b313e] text-gray-300 font-mono">Ctrl+S</kbd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#2b313e]">
                  <span className="text-gray-400">Run Active Task</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#12141a] border border-[#2b313e] text-gray-300 font-mono">Ctrl+Enter</kbd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#2b313e]">
                  <span className="text-gray-400">Stop Agent</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#12141a] border border-[#2b313e] text-gray-300 font-mono">Esc</kbd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#2b313e]">
                  <span className="text-gray-400">Toggle Terminal</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#12141a] border border-[#2b313e] text-gray-300 font-mono">Ctrl+`</kbd>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#12141a] border border-[#2b313e]">
                  <h4 className="font-semibold text-gray-200 mb-1">Old Computer / Low-End Hardware Mode</h4>
                  <p className="text-gray-400 leading-relaxed text-[11px]">
                    Lulu Code uses zero-idle CPU loops, debounced file tree scans, and event-driven terminal buffers to run silently and smoothly on low-end dual-core laptops with 4GB/8GB RAM.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
