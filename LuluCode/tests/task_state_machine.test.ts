import { describe, it, expect } from 'vitest';
import { AgentState } from '../src/types/agent';

class AgentStateMachine {
  maxRetries = 5;

  nextState(current: AgentState, success: boolean, retries: { count: number }): AgentState {
    switch (current) {
      case 'IDLE': return 'PLANNING';
      case 'PLANNING': return 'INSPECTING';
      case 'INSPECTING': return 'EXECUTING';
      case 'EXECUTING':
        if (success) return 'TESTING';
        retries.count++;
        return retries.count >= this.maxRetries ? 'COMPLETE' : 'RECOVERY';
      case 'TESTING':
        return success ? 'VERIFYING' : 'ANALYZING';
      case 'ANALYZING':
        return 'FIXING';
      case 'FIXING':
        retries.count++;
        return retries.count >= this.maxRetries ? 'COMPLETE' : 'TESTING';
      case 'VERIFYING': return 'COMPLETE';
      case 'RECOVERY': return 'ANALYZING';
      case 'COMPLETE': return 'COMPLETE';
      case 'CANCELLED': return 'CANCELLED';
    }
  }
}

describe('Agent State Machine Lifecycle', () => {
  it('follows standard successful path (Plan -> Inspect -> Execute -> Test -> Verify -> Complete)', () => {
    const sm = new AgentStateMachine();
    const retries = { count: 0 };

    let s: AgentState = 'IDLE';
    s = sm.nextState(s, true, retries);
    expect(s).toBe('PLANNING');

    s = sm.nextState(s, true, retries);
    expect(s).toBe('INSPECTING');

    s = sm.nextState(s, true, retries);
    expect(s).toBe('EXECUTING');

    s = sm.nextState(s, true, retries);
    expect(s).toBe('TESTING');

    s = sm.nextState(s, true, retries);
    expect(s).toBe('VERIFYING');

    s = sm.nextState(s, true, retries);
    expect(s).toBe('COMPLETE');
  });

  it('routes failed tests into Analyze -> Fix -> Test cycle', () => {
    const sm = new AgentStateMachine();
    const retries = { count: 0 };

    let s: AgentState = 'TESTING';
    s = sm.nextState(s, false, retries);
    expect(s).toBe('ANALYZING');

    s = sm.nextState(s, true, retries);
    expect(s).toBe('FIXING');

    s = sm.nextState(s, true, retries);
    expect(s).toBe('TESTING');
    expect(retries.count).toBe(1);
  });

  it('stops at 5 retries to prevent infinite loops', () => {
    const sm = new AgentStateMachine();
    const retries = { count: 0 };
    let s: AgentState = 'TESTING';

    let iterations = 0;
    while (s !== 'COMPLETE' && iterations < 30) {
      s = sm.nextState(s, false, retries);
      iterations++;
    }

    expect(s).toBe('COMPLETE');
    expect(retries.count).toBeGreaterThanOrEqual(5);
    expect(iterations).toBeLessThan(30);
  });
});
