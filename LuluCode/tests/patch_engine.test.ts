import { describe, it, expect } from 'vitest';

function applyPatchInMemory(original: string, target: string, replacement: string): { success: boolean; content?: string; error?: string } {
  if (!original.includes(target)) {
    return { success: false, error: 'FILE_CHANGED_EXTERNALLY: Target content does not match current file contents.' };
  }

  const occurrences = original.split(target).length - 1;
  if (occurrences > 1) {
    return { success: false, error: `Ambiguous match: Target content found ${occurrences} times.` };
  }

  return { success: true, content: original.replace(target, replacement) };
}

describe('Patch Engine & Safe Editing', () => {
  const sampleCode = `
fn main() {
    let message = "Hello World";
    println!("{}", message);
}
  `.trim();

  it('safely applies targeted single replacement', () => {
    const result = applyPatchInMemory(sampleCode, 'let message = "Hello World";', 'let message = "Hello Lulu Code";');
    expect(result.success).toBe(true);
    expect(result.content).toContain('let message = "Hello Lulu Code";');
    expect(result.content).not.toContain('let message = "Hello World";');
  });

  it('rejects patch when target string is missing (FILE_CHANGED_EXTERNALLY)', () => {
    const result = applyPatchInMemory(sampleCode, 'let message = "Nonexistent Line";', 'replacement');
    expect(result.success).toBe(false);
    expect(result.error).toContain('FILE_CHANGED_EXTERNALLY');
  });

  it('rejects patch when target string matches multiple locations without context', () => {
    const multi = `println!("ok");\nprintln!("ok");`;
    const result = applyPatchInMemory(multi, `println!("ok");`, `println!("done");`);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Ambiguous match');
  });
});
