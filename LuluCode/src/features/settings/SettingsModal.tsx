import React, { useState, useEffect } from 'react';
import { useProviderStore } from '../../stores/useProviderStore';
import { usePermissionStore } from '../../stores/usePermissionStore';
import { useSystemStore } from '../../stores/useSystemStore';
import { useCCppStore } from '../../stores/useCCppStore';
import { ProviderType } from '../../types/provider';
import { PermissionLevel } from '../../types/permissions';
import {
  X,
  Cpu,
  Shield,
  Keyboard,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Activity,
  Code2,
  Copy,
  Check,
  HardDrive,
  Monitor,
  BatteryCharging,
  Terminal,
  FileCode2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'system' | 'c_cpp' | 'permissions' | 'shortcuts' | 'performance'>('ai');
  const [showApiKey, setShowApiKey] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);

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
  const { systemInfo, isLoading: isSystemLoading, refreshSystemInfo, copyReport } = useSystemStore();
  const { toolchain, isLoading: isToolchainLoading, refreshToolchain } = useCCppStore();

  useEffect(() => {
    if (isOpen) {
      refreshSystemInfo();
      refreshToolchain();
    }
  }, [isOpen, refreshSystemInfo, refreshToolchain]);

  const handleCopyReport = async () => {
    const ok = await copyReport();
    if (ok) {
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-none p-4 select-none">
      <div className="bg-[#181b22] border border-[#2b313e] rounded-xl shadow-2xl max-w-2xl w-full h-[580px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1f232d] border-b border-[#2b313e] shrink-0">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-gray-100">Lulu Code Settings & Hardware</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-44 bg-[#14161d] border-r border-[#2b313e] p-2 space-y-1 select-none shrink-0">
            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'ai' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1f232d] hover:text-gray-200'
              }`}
            >
              <Cpu size={14} /> AI Provider
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'system' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1f232d] hover:text-gray-200'
              }`}
            >
              <Activity size={14} /> System Check
            </button>
            <button
              onClick={() => setActiveTab('c_cpp')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'c_cpp' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#1f232d] hover:text-gray-200'
              }`}
            >
              <Code2 size={14} /> C/C++ Toolchain
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
            {/* AI PROVIDER TAB */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 font-medium mb-1.5">AI Engine Provider</label>
                  <select
                    value={activeType}
                    onChange={(e) => setActiveType(e.target.value as ProviderType)}
                    className="w-full bg-[#12141a] border border-[#2b313e] rounded-lg px-3 py-2 text-gray-100 outline-none focus:border-blue-500"
                  >
                    <option value="GOOGLE_GEMINI">Google Gemini API (Gemini 2.0 / 1.5 Flash & Pro)</option>
                    <option value="LOCAL_OLLAMA">Local Ollama Server</option>
                    <option value="OPENAI">OpenAI API (GPT-4o / o1)</option>
                    <option value="OPENAI_COMPATIBLE">OpenAI-Compatible Local Endpoint</option>
                    <option value="CUSTOM">Standalone Deterministic Offline Heuristics</option>
                  </select>
                </div>

                {activeType !== 'CUSTOM' && (
                  <div className="space-y-3">
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
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition"
                            >
                              <RefreshCw size={12} className={isDetecting ? 'animate-spin' : ''} />
                              <span>Detect</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {activeType !== 'LOCAL_OLLAMA' && (
                      <div>
                        <label className="block text-gray-400 font-medium mb-1">API Key</label>
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter API Key"
                            className="w-full bg-[#12141a] border border-[#2b313e] rounded-lg px-3 py-1.5 pr-10 text-gray-100 outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-2 text-gray-400 hover:text-gray-200"
                          >
                            {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-gray-400 font-medium mb-1">Active Model</label>
                      <input
                        type="text"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-[#12141a] border border-[#2b313e] rounded-lg px-3 py-1.5 text-gray-100 outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        onClick={testConnection}
                        className="px-4 py-1.5 rounded-lg bg-[#1f232d] hover:bg-[#2b313e] text-gray-200 border border-[#2b313e] font-medium transition"
                      >
                        Test Connection
                      </button>
                      {testStatus && (
                        <span className={`text-xs ${testStatus.success ? 'text-emerald-400' : 'text-red-400'}`}>
                          {testStatus.message || (testStatus.testing ? 'Testing...' : '')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SYSTEM CHECK TAB */}
            {activeTab === 'system' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-200 text-sm">Lulu System Diagnostics</h3>
                    <p className="text-[11px] text-gray-400">Native non-root inspection of host CPU, RAM, GPU, and Display</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyReport}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f232d] hover:bg-[#2b313e] text-gray-200 border border-[#2b313e] transition text-xs"
                      title="Copy full non-secret report to clipboard"
                    >
                      {reportCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{reportCopied ? 'Copied' : 'Copy Report'}</span>
                    </button>
                    <button
                      onClick={refreshSystemInfo}
                      disabled={isSystemLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition text-xs font-medium"
                    >
                      <RefreshCw size={12} className={isSystemLoading ? 'animate-spin' : ''} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {systemInfo ? (
                  <div className="space-y-3 font-mono text-[11.5px]">
                    {/* Hardware Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* CPU */}
                      <div className="p-3 rounded-lg bg-[#12141a] border border-[#2b313e]">
                        <div className="text-gray-400 font-sans font-semibold mb-1 flex items-center gap-1.5 text-xs">
                          <Cpu size={13} className="text-blue-400" /> CPU
                        </div>
                        <div className="text-gray-200 font-medium truncate" title={systemInfo.cpu.model}>
                          {systemInfo.cpu.model}
                        </div>
                        <div className="text-gray-400 text-[11px] mt-0.5">
                          {systemInfo.cpu.logical_cores} cores • {systemInfo.cpu.frequency_mhz} MHz • {systemInfo.cpu.usage_percent.toFixed(1)}% usage
                        </div>
                      </div>

                      {/* RAM */}
                      <div className="p-3 rounded-lg bg-[#12141a] border border-[#2b313e]">
                        <div className="text-gray-400 font-sans font-semibold mb-1 flex items-center gap-1.5 text-xs">
                          <Zap size={13} className="text-amber-400" /> RAM & Memory
                        </div>
                        <div className="text-gray-200 font-medium">
                          {systemInfo.memory.total_mb} MB Total
                        </div>
                        <div className="text-gray-400 text-[11px] mt-0.5">
                          {systemInfo.memory.available_mb} MB available ({systemInfo.memory.used_mb} MB used)
                        </div>
                      </div>

                      {/* GPU */}
                      <div className="p-3 rounded-lg bg-[#12141a] border border-[#2b313e]">
                        <div className="text-gray-400 font-sans font-semibold mb-1 flex items-center gap-1.5 text-xs">
                          <Activity size={13} className="text-purple-400" /> GPU
                        </div>
                        <div className="text-gray-200 font-medium truncate" title={systemInfo.gpu.name}>
                          {systemInfo.gpu.name}
                        </div>
                        <div className="text-gray-400 text-[11px] mt-0.5">
                          {systemInfo.gpu.is_discrete ? 'Discrete' : 'Integrated'} • VRAM: {systemInfo.gpu.vram_mb ? `${systemInfo.gpu.vram_mb} MB` : 'Shared / N/A'}
                        </div>
                      </div>

                      {/* Display */}
                      <div className="p-3 rounded-lg bg-[#12141a] border border-[#2b313e]">
                        <div className="text-gray-400 font-sans font-semibold mb-1 flex items-center gap-1.5 text-xs">
                          <Monitor size={13} className="text-cyan-400" /> Display & Session
                        </div>
                        <div className="text-gray-200 font-medium">
                          {systemInfo.display.primary_resolution} @ {systemInfo.display.refresh_rate_hz} Hz
                        </div>
                        <div className="text-gray-400 text-[11px] mt-0.5">
                          {systemInfo.session.session_type} ({systemInfo.session.compositor})
                        </div>
                      </div>

                      {/* Disk */}
                      <div className="p-3 rounded-lg bg-[#12141a] border border-[#2b313e]">
                        <div className="text-gray-400 font-sans font-semibold mb-1 flex items-center gap-1.5 text-xs">
                          <HardDrive size={13} className="text-emerald-400" /> Disk Storage
                        </div>
                        <div className="text-gray-200 font-medium">
                          Root: {systemInfo.disk.root?.available_space_gb || 0} GB free
                        </div>
                        <div className="text-gray-400 text-[11px] mt-0.5">
                          Total: {systemInfo.disk.root?.total_space_gb || 0} GB ({systemInfo.disk.root?.filesystem || 'ext4'})
                        </div>
                      </div>

                      {/* Power */}
                      <div className="p-3 rounded-lg bg-[#12141a] border border-[#2b313e]">
                        <div className="text-gray-400 font-sans font-semibold mb-1 flex items-center gap-1.5 text-xs">
                          <BatteryCharging size={13} className="text-orange-400" /> Power State
                        </div>
                        <div className="text-gray-200 font-medium">
                          {systemInfo.power.source}
                        </div>
                        <div className="text-gray-400 text-[11px] mt-0.5">
                          {systemInfo.power.status_text}
                        </div>
                      </div>
                    </div>

                    {/* Performance Profile Card */}
                    <div className="p-3.5 rounded-lg bg-[#1f232d] border border-blue-500/30 flex items-center justify-between font-sans">
                      <div>
                        <span className="text-gray-400 text-[11px] block">Recommended Performance Profile:</span>
                        <span className="font-semibold text-blue-400 text-sm">{systemInfo.recommended_profile}</span>
                        <span className="text-gray-400 text-[11px] ml-2">
                          ({systemInfo.is_low_spec ? 'Low-Spec Optimization Active' : 'High Performance Enabled'})
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 font-mono text-[11px] border border-blue-500/30">
                        {systemInfo.is_low_spec ? 'Zero-Idle CPU' : 'Standard'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 italic">
                    Probing host system specifications...
                  </div>
                )}
              </div>
            )}

            {/* C/C++ TOOLCHAIN TAB */}
            {activeTab === 'c_cpp' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-200 text-sm">C / C++ Native Development Toolchain</h3>
                    <p className="text-[11px] text-gray-400">Compiler detection, build systems, debuggers, formatters & linters</p>
                  </div>
                  <button
                    onClick={refreshToolchain}
                    disabled={isToolchainLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition text-xs font-medium"
                  >
                    <RefreshCw size={12} className={isToolchainLoading ? 'animate-spin' : ''} />
                    <span>Detect Tools</span>
                  </button>
                </div>

                {toolchain ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* C Compiler */}
                      <div className="p-2.5 rounded-lg bg-[#12141a] border border-[#2b313e]">
                        <span className="text-gray-400 block text-[11px]">C Compiler</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-mono font-medium text-gray-200">{toolchain.c_compiler.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                            toolchain.c_compiler.is_available ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {toolchain.c_compiler.is_available ? 'AVAILABLE' : 'NOT INSTALLED'}
                          </span>
                        </div>
                        {toolchain.c_compiler.version && (
                          <div className="text-[10px] text-gray-500 truncate mt-0.5">{toolchain.c_compiler.version}</div>
                        )}
                      </div>

                      {/* C++ Compiler */}
                      <div className="p-2.5 rounded-lg bg-[#12141a] border border-[#2b313e]">
                        <span className="text-gray-400 block text-[11px]">C++ Compiler</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-mono font-medium text-gray-200">{toolchain.cpp_compiler.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                            toolchain.cpp_compiler.is_available ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {toolchain.cpp_compiler.is_available ? 'AVAILABLE' : 'NOT INSTALLED'}
                          </span>
                        </div>
                        {toolchain.cpp_compiler.version && (
                          <div className="text-[10px] text-gray-500 truncate mt-0.5">{toolchain.cpp_compiler.version}</div>
                        )}
                      </div>

                      {/* CMake */}
                      <div className="p-2.5 rounded-lg bg-[#12141a] border border-[#2b313e]">
                        <span className="text-gray-400 block text-[11px]">Build System: CMake</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-mono font-medium text-gray-200">cmake</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                            toolchain.build_cmake.is_available ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {toolchain.build_cmake.is_available ? 'AVAILABLE' : 'NOT INSTALLED'}
                          </span>
                        </div>
                        {toolchain.build_cmake.version && (
                          <div className="text-[10px] text-gray-500 truncate mt-0.5">{toolchain.build_cmake.version}</div>
                        )}
                      </div>

                      {/* Make */}
                      <div className="p-2.5 rounded-lg bg-[#12141a] border border-[#2b313e]">
                        <span className="text-gray-400 block text-[11px]">Build System: Make</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-mono font-medium text-gray-200">make</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                            toolchain.build_make.is_available ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {toolchain.build_make.is_available ? 'AVAILABLE' : 'NOT INSTALLED'}
                          </span>
                        </div>
                        {toolchain.build_make.version && (
                          <div className="text-[10px] text-gray-500 truncate mt-0.5">{toolchain.build_make.version}</div>
                        )}
                      </div>

                      {/* Debugger GDB */}
                      <div className="p-2.5 rounded-lg bg-[#12141a] border border-[#2b313e]">
                        <span className="text-gray-400 block text-[11px]">Debugger: GDB</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-mono font-medium text-gray-200">gdb</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                            toolchain.debugger_gdb.is_available ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {toolchain.debugger_gdb.is_available ? 'AVAILABLE' : 'NOT INSTALLED'}
                          </span>
                        </div>
                      </div>

                      {/* Formatter Clang-Format */}
                      <div className="p-2.5 rounded-lg bg-[#12141a] border border-[#2b313e]">
                        <span className="text-gray-400 block text-[11px]">Formatter: Clang-Format</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-mono font-medium text-gray-200">clang-format</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                            toolchain.formatter_clang_format.is_available ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {toolchain.formatter_clang_format.is_available ? 'AVAILABLE' : 'NOT INSTALLED'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Install Guide */}
                    <div className="p-3 rounded-lg bg-[#12141a] border border-[#2b313e] text-[11px]">
                      <span className="font-semibold text-gray-300 block mb-1">C/C++ Package Installation Commands:</span>
                      <div className="space-y-1 font-mono text-gray-400">
                        <div><strong className="text-gray-300">Arch / Garuda:</strong> <code>sudo pacman -S base-devel cmake gdb clang</code></div>
                        <div><strong className="text-gray-300">Debian / Ubuntu:</strong> <code>sudo apt install build-essential cmake gdb clang clang-format</code></div>
                        <div><strong className="text-gray-300">Fedora:</strong> <code>sudo dnf groupinstall "Development Tools" && sudo dnf install cmake gdb clang</code></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 italic">Detecting C/C++ toolchains...</div>
                )}
              </div>
            )}

            {/* PERMISSIONS TAB */}
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

            {/* SHORTCUTS TAB */}
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

            {/* PERFORMANCE TAB */}
            {activeTab === 'performance' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-[#12141a] border border-[#2b313e]">
                  <h4 className="font-semibold text-gray-200 mb-1">Old Computer / Low-End Hardware Mode</h4>
                  <p className="text-gray-400 leading-relaxed text-[11px]">
                    Lulu Code uses zero-idle CPU loops, debounced file tree scans, bounded terminal logs (5000 lines), and token batching to run silently and smoothly on low-end dual-core laptops with 4GB/8GB RAM.
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
