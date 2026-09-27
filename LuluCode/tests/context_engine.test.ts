import { describe, it, expect } from 'vitest';

function redactSecrets(input: string): string {
  let output = input;
  output = output.replace(/(api[_-]?key|token|secret|password|auth)[ =:\t]+['"]?([a-zA-Z0-9_\-\.]{8,})['"]?/gi, '$1 = ********');
  output = output.replace(/ghp_[a-zA-Z0-9]{36}/g, '********');
  output = output.replace(/sk-[a-zA-Z0-9]{20,}/g, '********');
  output = output.replace(/Bearer\s+[a-zA-Z0-9_\-\.]{16,}/gi, 'Bearer ********');
  return output;
}

describe('Context Engine & Secret Protection', () => {
  it('redacts sensitive API keys and tokens before AI context', () => {
    const raw = 'OPENAI_API_KEY = sk-1234567890abcdef1234567890\nghp_abcdefghijklmnopqrstuvwxyz1234567890';
    const redacted = redactSecrets(raw);

    expect(redacted).not.toContain('sk-1234567890abcdef1234567890');
    expect(redacted).not.toContain('ghp_abcdefghijklmnopqrstuvwxyz1234567890');
    expect(redacted).toContain('********');
  });

  it('preserves normal code and identifiers while redacting secrets', () => {
    const raw = 'const tokenCount = 42;\nconst apiKey = "abcdef1234567890";';
    const redacted = redactSecrets(raw);

    expect(redacted).toContain('const tokenCount = 42;');
    expect(redacted).not.toContain('abcdef1234567890');
    expect(redacted).toContain('********');
  });
});
