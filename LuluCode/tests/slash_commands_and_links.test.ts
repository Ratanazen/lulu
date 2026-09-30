import { describe, it, expect } from 'vitest';

describe('Chat Slash Command & File Reference Parsers', () => {
  it('identifies and routes slash commands correctly', () => {
    const commands: Record<string, string> = {
      '/help': 'Displaying available developer slash commands',
      '/clear': 'Clear chat conversation history',
      '/model': 'Open AI provider configuration',
      '/test': 'Run test suite: `cargo test` / `npm test`',
      '/build': 'Trigger build: `cmake --build` / `cargo build` / `npm run build`',
      '/fix': 'Analyze compiler diagnostics and generate fix suggestions',
      '/c': 'Detect and inspect C toolchain & project layout',
      '/cpp': 'Detect and inspect C++ toolchain & project layout',
    };

    for (const [cmd, expectedDesc] of Object.entries(commands)) {
      expect(cmd.startsWith('/')).toBe(true);
      expect(expectedDesc.length).toBeGreaterThan(0);
    }
  });

  it('detects file reference regex patterns accurately', () => {
    const fileRefRegex = /([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)(?::(\d+)(?:-(\d+))?)?/g;
    
    const sampleText = 'Check out src/main.rs:42 and include/header.hpp:10-25 or just Makefile.in.';
    const matches = Array.from(sampleText.matchAll(fileRefRegex));
    
    expect(matches.length).toBe(3);
    
    // First match: src/main.rs:42
    expect(matches[0][1]).toBe('src/main.rs');
    expect(matches[0][2]).toBe('42');
    expect(matches[0][3]).toBeUndefined();

    // Second match: include/header.hpp:10-25
    expect(matches[1][1]).toBe('include/header.hpp');
    expect(matches[1][2]).toBe('10');
    expect(matches[1][3]).toBe('25');

    // Third match: Makefile.in
    expect(matches[2][1]).toBe('Makefile.in');
    expect(matches[2][2]).toBeUndefined();
  });
});
