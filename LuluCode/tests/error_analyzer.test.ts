import { describe, it, expect } from 'vitest';
import { Diagnostic } from '../src/types/diagnostics';

function parseDiagnosticsFromOutput(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Rust compiler error regex: --> src/main.rs:14:5
  const rustRe = /-->\s+([^\s:]+):(\d+):(\d+)/g;
  let match;
  while ((match = rustRe.exec(output)) !== null) {
    diagnostics.push({
      file: match[1],
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
      severity: 'error',
      message: 'Mismatched types or compilation failure',
      source: 'rustc',
    });
  }

  // TypeScript error regex: src/App.tsx:12:5 - error TS2322
  const tsRe = /([^\s:(]+):(\d+):(\d+)\s*-\s*(error|warning)\s+([A-Z0-9]+):\s+(.*)/g;
  while ((match = tsRe.exec(output)) !== null) {
    diagnostics.push({
      file: match[1],
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
      severity: match[4] as 'error' | 'warning',
      message: `${match[5]}: ${match[6]}`,
      source: 'tsc',
    });
  }

  return diagnostics;
}

describe('Error Analyzer & Diagnostics Parser', () => {
  it('parses rustc compiler errors into structured diagnostics', () => {
    const output = `
error[E0308]: mismatched types
  --> src/auth.rs:42:13
   |
42 |     let x: u32 = "hello";
    `;
    const diags = parseDiagnosticsFromOutput(output);
    expect(diags.length).toBe(1);
    expect(diags[0].file).toBe('src/auth.rs');
    expect(diags[0].line).toBe(42);
    expect(diags[0].column).toBe(13);
    expect(diags[0].source).toBe('rustc');
  });

  it('parses TypeScript tsc errors into structured diagnostics', () => {
    const output = `src/components/Editor.tsx:18:7 - error TS2322: Type 'string' is not assignable to type 'number'.`;
    const diags = parseDiagnosticsFromOutput(output);
    expect(diags.length).toBe(1);
    expect(diags[0].file).toBe('src/components/Editor.tsx');
    expect(diags[0].line).toBe(18);
    expect(diags[0].column).toBe(7);
    expect(diags[0].source).toBe('tsc');
  });
});
