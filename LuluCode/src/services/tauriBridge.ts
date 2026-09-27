// Safe Tauri invoke bridge with web/test mocks

export async function invokeCommand<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<T>(cmd, args);
    } catch (e) {
      console.error(`[TauriBridge] Error invoking ${cmd}:`, e);
      throw e;
    }
  }

  // Fallback for test/browser environments
  return mockInvoke<T>(cmd, args);
}

function mockInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  switch (cmd) {
    case 'open_workspace':
    case 'detect_project':
      return Promise.resolve({
        name: 'mock-project',
        path: (args?.path as string) || '/home/reny/Documents/Lulu/LuluCode',
        language: 'TypeScript/JavaScript',
        build_tool: 'npm/pnpm',
        test_runner: 'pnpm test',
        is_git: true,
        has_lulu_spec: true,
        lulu_instructions: '# Lulu Code Rules\n1. Minimal clean changes.\n2. Verify with tests.',
      } as unknown as T);

    case 'list_directory':
      return Promise.resolve([
        { name: 'src', path: 'src', is_dir: true, children: [] },
        { name: 'package.json', path: 'package.json', is_dir: false, size: 500 },
        { name: 'README.md', path: 'README.md', is_dir: false, size: 200 },
      ] as unknown as T);

    case 'read_file':
      return Promise.resolve('// Mock file content\nconsole.log("Hello from Lulu Code");' as unknown as T);

    case 'write_file':
    case 'apply_patch':
    case 'create_file':
    case 'delete_file':
      return Promise.resolve('OK' as unknown as T);

    case 'run_process':
      return Promise.resolve({
        exit_code: 0,
        stdout: 'Mock execution finished cleanly.\nExit 0',
        stderr: '',
        duration_ms: 120,
        timed_out: false,
      } as unknown as T);

    case 'git_status':
      return Promise.resolve({
        branch: 'main',
        staged_files: [],
        unstaged_files: ['src/App.tsx'],
        untracked_files: [],
        is_clean: false,
      } as unknown as T);

    case 'detect_ollama':
      return Promise.resolve({
        is_available: false,
        status: 'OFFLINE',
        models: [],
      } as unknown as T);

    case 'chat_ai':
      return Promise.resolve({
        text: '### Lulu Code Plan\n1. [x] Inspect workspace\n2. [ ] Run tests\n3. [ ] Verify result',
        model_used: 'Lulu-Local-Deterministic',
        is_offline_fallback: true,
      } as unknown as T);

    case 'get_tasks':
      return Promise.resolve([] as unknown as T);

    case 'get_messages':
      return Promise.resolve([] as unknown as T);

    default:
      return Promise.resolve({} as unknown as T);
  }
}
