import { describe, it, expect, beforeEach } from 'vitest';
import { usePermissionStore } from '../src/stores/usePermissionStore';

describe('Permission Engine & Security Isolation', () => {
  beforeEach(() => {
    usePermissionStore.setState({
      level: 'SAFE_EDIT',
      pendingRequest: null,
      allowedScopes: new Set<string>(),
    });
  });

  it('allows safe reads and edits in SAFE_EDIT mode', async () => {
    const store = usePermissionStore.getState();
    expect(store.level).toBe('SAFE_EDIT');
  });

  it('immediately permits requests if level is AUTONOMOUS', async () => {
    usePermissionStore.setState({ level: 'AUTONOMOUS' });
    const store = usePermissionStore.getState();

    const allowed = await store.requestPermission({
      id: 'req_1',
      toolName: 'run_command',
      target: 'cargo test',
      description: 'Run tests autonomously',
    });

    expect(allowed).toBe(true);
  });

  it('prompts user and permits when allowed for task/project', async () => {
    const store = usePermissionStore.getState();

    // Start permission request
    const promise = store.requestPermission({
      id: 'req_2',
      toolName: 'run_command',
      target: 'npm run build',
      description: 'Run build command',
    });

    expect(usePermissionStore.getState().pendingRequest).not.toBeNull();

    // User approves for task
    store.resolveRequest(true, 'task');

    const result = await promise;
    expect(result).toBe(true);
    expect(usePermissionStore.getState().allowedScopes.has('run_command:npm run build')).toBe(true);
  });

  it('blocks request when user clicks Deny', async () => {
    const store = usePermissionStore.getState();

    const promise = store.requestPermission({
      id: 'req_3',
      toolName: 'delete_file',
      target: 'src/main.rs',
      description: 'Delete source file',
    });

    store.resolveRequest(false);

    const result = await promise;
    expect(result).toBe(false);
  });
});
