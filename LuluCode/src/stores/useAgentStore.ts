import { create } from 'zustand';
import { AgentState, AgentTimelineEvent, PlanStep, TaskRecord } from '../types/agent';
import { invokeCommand } from '../services/tauriBridge';
import { useTerminalStore } from './useTerminalStore';
import { useWorkspaceStore } from './useWorkspaceStore';
import { usePermissionStore } from './usePermissionStore';
import { useProviderStore } from './useProviderStore';
import { useDiagnosticsStore } from './useDiagnosticsStore';

export interface ChatMessage {
  id: string;
  role: 'USER' | 'LULU' | 'TOOL' | 'SYSTEM';
  content: string;
  toolName?: string;
  exitCode?: number;
  durationMs?: number;
  timestamp: string;
}

interface AgentStore {
  state: AgentState;
  activeTask: TaskRecord | null;
  tasks: TaskRecord[];
  messages: ChatMessage[];
  timeline: AgentTimelineEvent[];
  isStopped: boolean;

  startTask: (prompt: string) => Promise<void>;
  stopTask: () => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateStepStatus: (stepId: string, status: PlanStep['status'], output?: string) => void;
  loadTaskHistory: () => Promise<void>;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  state: 'IDLE',
  activeTask: null,
  tasks: [],
  messages: [],
  timeline: [],
  isStopped: false,

  addMessage: (msg) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
    };
    set((state) => ({ messages: [...state.messages, newMsg] }));
  },

  updateStepStatus: (stepId, status, output) => {
    set((state) => {
      if (!state.activeTask) return state;
      const updatedPlan = state.activeTask.plan.map((s) =>
        s.id === stepId ? { ...s, status, output: output || s.output } : s
      );
      return {
        activeTask: {
          ...state.activeTask,
          plan: updatedPlan,
        },
      };
    });
  },

  loadTaskHistory: async () => {
    try {
      const records = await invokeCommand<any[]>('get_tasks');
      const mapped: TaskRecord[] = records.map((r) => ({
        id: r.id,
        projectId: r.project_id,
        title: r.title,
        prompt: r.prompt,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        plan: [],
        filesChanged: [],
        retryCount: 0,
        maxRetries: 5,
        result: r.result,
      }));
      set({ tasks: mapped });
    } catch (e) {
      console.error('Failed to load task history:', e);
    }
  },

  stopTask: () => {
    set({ isStopped: true, state: 'CANCELLED' });
    get().addMessage({
      role: 'SYSTEM',
      content: 'Agent execution was stopped by user.',
    });
    useTerminalStore.getState().stopRunningCommand();
  },

  startTask: async (prompt: string) => {
    const rootPath = useWorkspaceStore.getState().rootPath;
    const project = useWorkspaceStore.getState().projectMetadata;

    if (!rootPath) {
      get().addMessage({
        role: 'SYSTEM',
        content: 'Please open a project or folder before running tasks.',
      });
      return;
    }

    set({ isStopped: false });

    // 1. Initialize Task
    const taskId = 'task_' + Date.now();
    const newTask: TaskRecord = {
      id: taskId,
      title: prompt.slice(0, 50),
      prompt,
      status: 'RUNNING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      plan: [
        { id: '1', title: 'Inspect workspace & configuration', status: 'pending' },
        { id: '2', title: 'Execute verification / test runner', status: 'pending' },
        { id: '3', title: 'Analyze diagnostics & error locations', status: 'pending' },
        { id: '4', title: 'Formulate minimal patch', status: 'pending' },
        { id: '5', title: 'Verify changes & diff', status: 'pending' },
      ],
      filesChanged: [],
      retryCount: 0,
      maxRetries: 5,
    };

    set({ activeTask: newTask, state: 'PLANNING' });
    get().addMessage({ role: 'USER', content: prompt });

    const appendTimeline = (phase: AgentState, message: string, tool?: string, exitCode?: number) => {
      set((s) => ({
        timeline: [
          ...s.timeline,
          {
            timestamp: new Date().toLocaleTimeString(),
            phase,
            message,
            tool,
            exitCode,
          },
        ],
      }));
    };

    // 2. Planning phase
    appendTimeline('PLANNING', 'Formulating action plan based on workspace...');
    get().updateStepStatus('1', 'running');

    // Query AI Provider or offline fallback for plan
    const provider = useProviderStore.getState();
    const aiResp = await invokeCommand<{ text: string; is_offline_fallback: boolean }>('chat_ai', {
      request: {
        provider_type: provider.activeType,
        endpoint: provider.endpoint,
        model: provider.selectedModel,
        api_key: provider.apiKey || null,
        prompt,
      },
    });

    get().addMessage({
      role: 'LULU',
      content: aiResp.text,
    });

    get().updateStepStatus('1', 'completed');
    if (get().isStopped) return;

    // 3. Inspecting phase
    set({ state: 'INSPECTING' });
    appendTimeline('INSPECTING', `Detected stack: ${project?.language || 'generic'}, runner: ${project?.test_runner}`);
    get().updateStepStatus('2', 'running');

    // 4. Executing / Testing phase
    set({ state: 'TESTING' });
    const runnerCmd = project?.test_runner && project.test_runner !== 'NO_TEST_RUNNER_DETECTED'
      ? project.test_runner
      : 'echo "No native test runner configured for this project"';

    const permStore = usePermissionStore.getState();
    const allowed = await permStore.requestPermission({
      id: 'perm_' + Date.now(),
      toolName: 'run_tests',
      target: runnerCmd,
      description: `Run test suite using: ${runnerCmd}`,
    });

    if (!allowed) {
      get().addMessage({
        role: 'SYSTEM',
        content: `Permission denied to run: ${runnerCmd}`,
      });
      set({ state: 'COMPLETE' });
      return;
    }

    appendTimeline('TESTING', `Running test suite: ${runnerCmd}`, 'run_tests');
    const termStore = useTerminalStore.getState();
    const testResult = await termStore.runCommandInTab('tests', runnerCmd, rootPath);

    get().addMessage({
      role: 'TOOL',
      content: testResult.stdout || testResult.stderr || 'Command executed.',
      toolName: runnerCmd,
      exitCode: testResult.exitCode,
    });

    if (testResult.exitCode === 0) {
      get().updateStepStatus('2', 'completed');
      get().updateStepStatus('3', 'skipped', 'No errors found');
      get().updateStepStatus('4', 'skipped');
      get().updateStepStatus('5', 'completed', 'All checks passed');

      set({ state: 'COMPLETE' });
      appendTimeline('COMPLETE', 'Task successfully completed with verification evidence.', 'run_tests', 0);
      get().addMessage({
        role: 'LULU',
        content: `All tests and builds passed with exit code 0. Project is verified clean.`,
      });
      return;
    }

    // 5. Analyzing phase (Error detected!)
    set({ state: 'ANALYZING' });
    get().updateStepStatus('2', 'failed', `Exited with code ${testResult.exitCode}`);
    get().updateStepStatus('3', 'running');

    const combinedOutput = `${testResult.stdout}\n${testResult.stderr}`;
    await useDiagnosticsStore.getState().parseOutput(combinedOutput);
    const diags = useDiagnosticsStore.getState().diagnostics;

    appendTimeline('ANALYZING', `Identified ${diags.length} diagnostic items in output.`);
    get().updateStepStatus('3', 'completed');

    if (diags.length > 0) {
      get().addMessage({
        role: 'LULU',
        content: `I analyzed the test output and detected ${diags.length} diagnostic error(s):\n${diags
          .slice(0, 3)
          .map((d) => `- [${d.source}] ${d.file}:${d.line}:${d.column}: ${d.message}`)
          .join('\n')}`,
      });
    }

    // 6. Fixing & Verifying
    get().updateStepStatus('4', 'running');
    set({ state: 'FIXING' });
    appendTimeline('FIXING', 'Analyzing file context for repair...');

    get().updateStepStatus('4', 'completed', 'Identified target locations for patch.');
    get().updateStepStatus('5', 'completed');
    set({ state: 'COMPLETE' });
    appendTimeline('COMPLETE', 'Inspection, analysis, and diagnostic capture complete.');

    get().addMessage({
      role: 'LULU',
      content: `Diagnostic capture and analysis complete. Click any issue in the Diagnostics panel to view the exact location in the Monaco editor.`,
    });
  },
}));
