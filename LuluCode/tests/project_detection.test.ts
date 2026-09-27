import { describe, it, expect } from 'vitest';

function detectProjectRunner(files: string[]): { language: string; testRunner: string } {
  if (files.includes('Cargo.toml')) {
    return { language: 'Rust', testRunner: 'cargo test' };
  }
  if (files.includes('package.json')) {
    if (files.includes('pnpm-lock.yaml')) return { language: 'TypeScript/JavaScript', testRunner: 'pnpm test' };
    if (files.includes('yarn.lock')) return { language: 'TypeScript/JavaScript', testRunner: 'yarn test' };
    return { language: 'TypeScript/JavaScript', testRunner: 'npm test' };
  }
  if (files.includes('pyproject.toml') || files.includes('requirements.txt')) {
    return { language: 'Python', testRunner: 'pytest' };
  }
  if (files.includes('go.mod')) {
    return { language: 'Go', testRunner: 'go test ./...' };
  }
  if (files.includes('CMakeLists.txt')) {
    return { language: 'C/C++', testRunner: 'ctest' };
  }
  return { language: 'Generic', testRunner: 'NO_TEST_RUNNER_DETECTED' };
}

describe('Project Detection Engine', () => {
  it('detects Rust project and cargo test', () => {
    const res = detectProjectRunner(['Cargo.toml', 'src/main.rs']);
    expect(res.language).toBe('Rust');
    expect(res.testRunner).toBe('cargo test');
  });

  it('detects Node pnpm project and pnpm test', () => {
    const res = detectProjectRunner(['package.json', 'pnpm-lock.yaml', 'src/index.ts']);
    expect(res.language).toBe('TypeScript/JavaScript');
    expect(res.testRunner).toBe('pnpm test');
  });

  it('detects Python project and pytest', () => {
    const res = detectProjectRunner(['requirements.txt', 'app.py']);
    expect(res.language).toBe('Python');
    expect(res.testRunner).toBe('pytest');
  });

  it('detects Go project and go test', () => {
    const res = detectProjectRunner(['go.mod', 'main.go']);
    expect(res.language).toBe('Go');
    expect(res.testRunner).toBe('go test ./...');
  });

  it('reports NO_TEST_RUNNER_DETECTED for generic projects', () => {
    const res = detectProjectRunner(['notes.txt']);
    expect(res.language).toBe('Generic');
    expect(res.testRunner).toBe('NO_TEST_RUNNER_DETECTED');
  });
});
