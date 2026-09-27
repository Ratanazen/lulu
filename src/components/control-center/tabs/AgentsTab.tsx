import React, { useState } from 'react';
import { agentManager } from '../../../features/agents/AgentManager';
import { AgentDefinition, AgentId, AgentTask } from '../../../features/agents/types';

export const AgentsTab: React.FC = () => {
  const [agents] = useState<AgentDefinition[]>(agentManager.getAllAgents());
  const [workspaceRoot, setWorkspaceRoot] = useState<string>(agentManager.getWorkspace().rootPath);
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId | 'auto'>('auto');
  const [promptInput, setPromptInput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState<string | null>(null);

  const handleUpdateWorkspace = () => {
    try {
      agentManager.setWorkspaceRoot(workspaceRoot);
      setWorkspaceStatus('Workspace root updated and verified');
      setTimeout(() => setWorkspaceStatus(null), 3000);
    } catch (err: any) {
      setWorkspaceStatus(`Error: ${err?.message || String(err)}`);
    }
  };

  const handleRunTask = async () => {
    if (!promptInput.trim()) return;

    setIsExecuting(true);
    try {
      const explicitId = selectedAgentId === 'auto' ? undefined : selectedAgentId;
      const task = agentManager.createTask(promptInput, explicitId);
      setCurrentTask(task);

      await agentManager.executeTask(task.id, undefined, (updated) => {
        setCurrentTask({ ...updated });
      });
    } catch (err: any) {
      console.error('Task execution error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const autoDetectedAgent = promptInput.trim()
    ? agentManager.selectAgentForIntent(promptInput)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--color-text, #F8FAFC)' }}>
          Multi-Agent Orchestrator
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-muted, #94A3B8)' }}>
          10 specialized autonomous agents with strict workspace boundary enforcement and safety governance.
        </p>
      </div>

      {/* Workspace Boundary Configuration */}
      <div
        style={{
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid var(--color-border, #334155)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#38BDF8' }}>
            🔒 Workspace Boundary Containment
          </span>
          {workspaceStatus && (
            <span style={{ fontSize: '12px', color: '#10B981' }}>{workspaceStatus}</span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
          All file operations, script generation, and agent edits are strictly locked to this root path. Directory traversal (../) and system escapes are permanently blocked.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={workspaceRoot}
            onChange={(e) => setWorkspaceRoot(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #334155',
              color: '#F8FAFC',
              fontSize: '13px',
              fontFamily: 'monospace',
            }}
          />
          <button
            onClick={handleUpdateWorkspace}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
            }}
          >
            Update Root
          </button>
        </div>
      </div>

      {/* Task Launcher */}
      <div
        style={{
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid var(--color-border, #334155)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC' }}>
          🚀 Launch Agent Task
        </span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', color: '#94A3B8' }}>Assigned Agent:</label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value as any)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #334155',
              color: '#F8FAFC',
              fontSize: '12px',
            }}
          >
            <option value="auto">⚡ Auto-Route (Intelligent Intent Router)</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.avatar} {a.name} ({a.role})
              </option>
            ))}
          </select>
          {selectedAgentId === 'auto' && autoDetectedAgent && (
            <span style={{ fontSize: '12px', color: '#38BDF8' }}>
              Suggested: {autoDetectedAgent.avatar} {autoDetectedAgent.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Describe the task (e.g., 'Write unit tests for parser', 'Audit Linux D-Bus services', 'Review PR diff')..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunTask()}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #334155',
              color: '#F8FAFC',
              fontSize: '13px',
            }}
          />
          <button
            onClick={handleRunTask}
            disabled={isExecuting || !promptInput.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: isExecuting ? '#64748B' : '#10B981',
              color: '#FFFFFF',
              border: 'none',
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            {isExecuting ? 'Running...' : 'Execute Task'}
          </button>
        </div>

        {/* Quick Task Presets */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setSelectedAgentId('devops_agent');
              setPromptInput('Run application update task (pull upstream, rebuild assets & binary)');
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38BDF8',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            🚀 Update Application Task
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedAgentId('tester');
              setPromptInput('Run comprehensive test suites for Rust and Vitest');
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#10B981',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            🧪 Run Test Suites
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedAgentId('cybersecurity_agent');
              setPromptInput('Perform security boundary audit on workspace and IPC commands');
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(129, 140, 248, 0.1)',
              border: '1px solid rgba(129, 140, 248, 0.25)',
              color: '#818CF8',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            🛡️ Security Boundary Audit
          </button>
        </div>

        {/* Task Progress & Output */}
        {currentTask && (
          <div
            style={{
              marginTop: '10px',
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid #334155',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#38BDF8' }}>
                Task: {currentTask.title}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor:
                    currentTask.status === 'completed'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : currentTask.status === 'running'
                      ? 'rgba(56, 189, 248, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                  color:
                    currentTask.status === 'completed'
                      ? '#10B981'
                      : currentTask.status === 'running'
                      ? '#38BDF8'
                      : '#EF4444',
                }}
              >
                {currentTask.status.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              {currentTask.steps.map((s, idx) => (
                <div
                  key={s.id}
                  style={{
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: s.status === 'completed' ? '#10B981' : '#E2E8F0',
                  }}
                >
                  <span>{s.status === 'completed' ? '✓' : '⠇'}</span>
                  <span>{s.title}</span>
                  {s.detail && <span style={{ color: '#94A3B8', fontSize: '11px' }}>({s.detail})</span>}
                </div>
              ))}
            </div>

            {currentTask.output && (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  fontSize: '12px',
                  color: '#F8FAFC',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {currentTask.output}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 10 Specialized Agents Matrix */}
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#F8FAFC' }}>
          Specialized Agent Roster (10 Agents)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {agents.map((agent) => (
            <div
              key={agent.id}
              style={{
                padding: '14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid var(--color-border, #334155)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{agent.avatar}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC' }}>{agent.name}</div>
                  <div style={{ fontSize: '11px', color: '#38BDF8' }}>{agent.role}</div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', lineHeight: '1.4' }}>
                {agent.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: 'auto' }}>
                {agent.capabilities.map((c) => (
                  <span
                    key={c}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(51, 65, 85, 0.6)',
                      color: '#CBD5E1',
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
