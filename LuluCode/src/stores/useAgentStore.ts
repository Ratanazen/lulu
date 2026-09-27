import { create } from 'zustand';
import { AgentState, AgentTimelineEvent, PlanStep, TaskRecord } from '../types/agent';
import { invokeCommand } from '../services/tauriBridge';
import { useTerminalStore } from './useTerminalStore';
import { useWorkspaceStore } from './useWorkspaceStore';
import { usePermissionStore } from './usePermissionStore';
import { useProviderStore } from './useProviderStore';
import { useDiagnosticsStore } from './useDiagnosticsStore';
import { useEditorStore } from './useEditorStore';

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

const SYSTEM_TOOL_INSTRUCTIONS = `You are Lulu Code, an expert autonomous software engineering agent.
You have direct access to native project tools.

To invoke a tool, output a fenced action block:
\`\`\`action
{"tool": "<tool_name>", "args": { ... }}
\`\`\`

Available Tools:
1. read_file: {"path": "src/main.rs", "startLine": 1, "endLine": 50}
2. write_file: {"path": "src/file.ts", "content": "..."}
3. apply_patch: {"path": "src/auth.rs", "targetContent": "...", "replacementContent": "..."}
4. create_file: {"path": "src/new.ts", "content": "..."}
5. delete_file: {"path": "temp/foo.log"}
6. list_directory: {"path": "src", "maxDepth": 2}
7. search_text: {"query": "fn authenticate", "isRegex": false}
8. run_command: {"command": "cargo check", "timeoutSecs": 60}
9. run_tests: {"testFilter": ""}
10. git_status: {}
11. git_diff: {"staged": false}
12. git_commit: {"message": "fix: resolve compiler error"}

When formulating actions, inspect repository code first, make minimal safe patches, and verify using tests.`;

interface ToolActionCall {
  tool: string;
  args: Record<string, any>;
}

function parseActionBlock(text: string): ToolActionCall | null {
  // Check ```action ... ``` block
  const actionRegex = /```(?:action|json)\s*\n([\s\S]*?)\n```/;
  const match = text.match(actionRegex);
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.tool) {
        return { tool: parsed.tool, args: parsed.args || parsed.parameters || {} };
      }
      if (parsed.action) {
        return { tool: parsed.action, args: parsed.args || parsed.parameters || {} };
      }
    } catch {
      // not valid JSON
    }
  }

  // Check inline JSON with "tool": "..."
  const inlineMatch = text.match(/\{[\s\S]*?"tool"\s*:\s*"([a-zA-Z0-9_-]+)"[\s\S]*?\}/);
  if (inlineMatch) {
    try {
      const parsed = JSON.parse(inlineMatch[0]);
      return { tool: parsed.tool, args: parsed.args || parsed };
    } catch {
      // ignore
    }
  }

  return null;
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
        { id: '1', title: 'Inspect workspace & formulate plan', status: 'pending' },
        { id: '2', title: 'Execute tools & actions', status: 'pending' },
        { id: '3', title: 'Analyze diagnostics & changes', status: 'pending' },
        { id: '4', title: 'Verify test results & diff', status: 'pending' },
      ],
      filesChanged: [],
      retryCount: 0,
      maxRetries: 6,
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

    appendTimeline('PLANNING', 'Formulating action plan based on workspace...');
    get().updateStepStatus('1', 'running');

    let currentPrompt = prompt;
    let iteration = 0;
    const maxIterations = 6;
    let hasExecutedAnyTool = false;

    while (iteration < maxIterations && !get().isStopped) {
      iteration++;

      // Query AI Provider
      const provider = useProviderStore.getState();
      const aiResp = await invokeCommand<{ text: string; is_offline_fallback: boolean }>('chat_ai', {
        request: {
          provider_type: provider.activeType,
          endpoint: provider.endpoint,
          model: provider.selectedModel,
          api_key: provider.apiKey || null,
          prompt: currentPrompt,
          system_instruction: SYSTEM_TOOL_INSTRUCTIONS,
        },
      });

      get().addMessage({
        role: 'LULU',
        content: aiResp.text,
      });

      if (iteration === 1) {
        get().updateStepStatus('1', 'completed');
        get().updateStepStatus('2', 'running');
      }

      if (get().isStopped) break;

      // Check for structured tool action
      const action = parseActionBlock(aiResp.text);

      if (action) {
        hasExecutedAnyTool = true;
        set({ state: 'EXECUTING' });
        appendTimeline('EXECUTING', `Executing tool: ${action.tool}`, action.tool);

        // Check permission
        const permStore = usePermissionStore.getState();
        const targetDesc = JSON.stringify(action.args).slice(0, 80);
        const allowed = await permStore.requestPermission({
          id: 'perm_' + Date.now(),
          toolName: action.tool,
          target: targetDesc,
          description: `Execute ${action.tool} with arguments: ${targetDesc}`,
        });

        if (!allowed) {
          get().addMessage({
            role: 'SYSTEM',
            content: `Permission denied by user policy for tool: ${action.tool}`,
          });
          break;
        }

        // Execute tool natively
        let toolOutput = '';
        let toolExitCode = 0;

        try {
          switch (action.tool) {
            case 'read_file': {
              const res = await invokeCommand<string>('read_file', {
                workspace: rootPath,
                path: action.args.path,
                start_line: action.args.startLine,
                end_line: action.args.endLine,
              });
              toolOutput = res;
              // Open file in editor for user review
              await useEditorStore.getState().openFile(rootPath, action.args.path);
              break;
            }

            case 'write_file': {
              await invokeCommand('write_file', {
                workspace: rootPath,
                path: action.args.path,
                content: action.args.content,
              });
              toolOutput = `Successfully wrote ${action.args.content?.length || 0} bytes to ${action.args.path}`;
              await useEditorStore.getState().openFile(rootPath, action.args.path);
              await useWorkspaceStore.getState().refreshFileTree();
              break;
            }

            case 'apply_patch': {
              const res = await invokeCommand<string>('apply_patch', {
                workspace: rootPath,
                path: action.args.path,
                target_content: action.args.targetContent,
                replacement_content: action.args.replacementContent,
              });
              toolOutput = `Patch applied successfully:\n${res}`;
              await useEditorStore.getState().openFile(rootPath, action.args.path);
              break;
            }

            case 'create_file': {
              await invokeCommand('create_file', {
                workspace: rootPath,
                path: action.args.path,
                content: action.args.content || null,
              });
              toolOutput = `Created file ${action.args.path}`;
              await useWorkspaceStore.getState().refreshFileTree();
              break;
            }

            case 'delete_file': {
              await invokeCommand('delete_file', {
                workspace: rootPath,
                path: action.args.path,
              });
              toolOutput = `Deleted file ${action.args.path}`;
              await useWorkspaceStore.getState().refreshFileTree();
              break;
            }

            case 'list_directory': {
              const res = await invokeCommand<any[]>('list_directory', {
                workspace: rootPath,
                path: action.args.path || null,
                max_depth: action.args.maxDepth || 2,
              });
              toolOutput = JSON.stringify(res.map((n) => `${n.is_dir ? '[DIR]' : '[FILE]'} ${n.path}`), null, 2);
              break;
            }

            case 'search_text': {
              const res = await invokeCommand<any[]>('search_text', {
                workspace: rootPath,
                query: action.args.query,
                is_regex: action.args.isRegex || false,
              });
              toolOutput = res.length > 0
                ? res.map((m) => `${m.file}:${m.line_number}: ${m.line_content}`).join('\n')
                : 'No occurrences found.';
              break;
            }

            case 'run_command': {
              const termStore = useTerminalStore.getState();
              const cmdRes = await termStore.runCommandInTab('agent', action.args.command, rootPath);
              toolExitCode = cmdRes.exitCode;
              toolOutput = cmdRes.stdout || cmdRes.stderr || '(No output)';
              break;
            }

            case 'run_tests': {
              const runnerCmd = project?.test_runner && project.test_runner !== 'NO_TEST_RUNNER_DETECTED'
                ? project.test_runner
                : 'echo "No native test runner configured"';
              const termStore = useTerminalStore.getState();
              const testRes = await termStore.runCommandInTab('tests', runnerCmd, rootPath);
              toolExitCode = testRes.exitCode;
              toolOutput = `${testRes.stdout}\n${testRes.stderr}`.trim();
              await useDiagnosticsStore.getState().parseOutput(toolOutput);
              break;
            }

            case 'git_status': {
              const res = await invokeCommand<any>('git_status', { repo_path: rootPath });
              toolOutput = `Branch: ${res.branch}\nStaged: ${res.staged_files.join(', ') || 'none'}\nUnstaged: ${res.unstaged_files.join(', ') || 'none'}\nUntracked: ${res.untracked_files.join(', ') || 'none'}`;
              break;
            }

            case 'git_diff': {
              const res = await invokeCommand<string>('git_diff', {
                repo_path: rootPath,
                staged: action.args.staged || false,
              });
              toolOutput = res || 'No changes in working tree.';
              break;
            }

            case 'git_commit': {
              const res = await invokeCommand<string>('git_commit', {
                repo_path: rootPath,
                message: action.args.message,
              });
              toolOutput = `Committed: ${res}`;
              break;
            }

            default: {
              toolOutput = `Unknown tool: ${action.tool}`;
              toolExitCode = 1;
            }
          }
        } catch (err: any) {
          toolExitCode = 1;
          toolOutput = `Tool execution error: ${err}`;
        }

        get().addMessage({
          role: 'TOOL',
          content: toolOutput,
          toolName: action.tool,
          exitCode: toolExitCode,
        });

        // Feed tool output back to agent loop
        currentPrompt = `Tool "${action.tool}" output (exit code ${toolExitCode}):\n${toolOutput}\n\nPlease proceed with the next step or present the final resolution.`;
      } else {
        // No tool block requested.
        // If offline fallback mode was returned and user asked for tests/fix, run test runner heuristically:
        if (aiResp.is_offline_fallback && !hasExecutedAnyTool) {
          const pLower = prompt.toLowerCase();
          if (pLower.includes('test') || pLower.includes('fix') || pLower.includes('check')) {
            set({ state: 'TESTING' });
            get().updateStepStatus('2', 'running');
            const runnerCmd = project?.test_runner && project.test_runner !== 'NO_TEST_RUNNER_DETECTED'
              ? project.test_runner
              : 'echo "No native test runner configured"';

            appendTimeline('TESTING', `Running test suite: ${runnerCmd}`, 'run_tests');
            const termStore = useTerminalStore.getState();
            const testResult = await termStore.runCommandInTab('tests', runnerCmd, rootPath);

            get().addMessage({
              role: 'TOOL',
              content: testResult.stdout || testResult.stderr || 'Command completed.',
              toolName: runnerCmd,
              exitCode: testResult.exitCode,
            });

            if (testResult.exitCode !== 0) {
              set({ state: 'ANALYZING' });
              get().updateStepStatus('3', 'running');
              const combined = `${testResult.stdout}\n${testResult.stderr}`;
              await useDiagnosticsStore.getState().parseOutput(combined);
              const diags = useDiagnosticsStore.getState().diagnostics;
              appendTimeline('ANALYZING', `Identified ${diags.length} diagnostic items.`);
              get().updateStepStatus('3', 'completed');
            }
          }
        }
        break;
      }
    }

    get().updateStepStatus('2', 'completed');
    get().updateStepStatus('3', 'completed');
    get().updateStepStatus('4', 'completed');
    set({ state: 'COMPLETE' });
    appendTimeline('COMPLETE', 'Task execution and verification finished.');
  },
}));
