// Workspace Boundary Validator for Lulu Desktop
// Ensures all agent operations, file edits, and tool calls are strictly confined
// within the designated workspace root directory, blocking path traversals.

import { WorkspaceValidationResult } from './types';

/**
 * Normalizes a path string by collapsing redundant slashes, '.' and '..' segments.
 * Works purely with string manipulation for cross-platform/browser runtime compatibility.
 */
export function normalizePath(p: string): string {
  if (!p) return '/';
  
  // Replace backslashes
  let clean = p.replace(/\\/g, '/');

  // Check for null byte injection
  if (clean.includes('\0')) {
    throw new Error('Null byte detected in file path');
  }

  const isAbsolute = clean.startsWith('/');
  const parts = clean.split('/').filter(Boolean);
  const resolvedParts: string[] = [];

  for (const part of parts) {
    if (part === '.') {
      continue;
    } else if (part === '..') {
      if (resolvedParts.length > 0 && resolvedParts[resolvedParts.length - 1] !== '..') {
        resolvedParts.pop();
      } else if (!isAbsolute) {
        resolvedParts.push('..');
      }
    } else {
      resolvedParts.push(part);
    }
  }

  let result = (isAbsolute ? '/' : '') + resolvedParts.join('/');
  if (isAbsolute && result === '') {
    result = '/';
  }
  return result || '.';
}

/**
 * Validates whether a candidate path falls safely inside the workspace root.
 * Blocks directory traversal ('../'), absolute escapes, and prefix collisions.
 */
export function validateWorkspacePath(candidatePath: string, workspaceRoot: string): WorkspaceValidationResult {
  if (!workspaceRoot || workspaceRoot.trim() === '') {
    return {
      valid: false,
      error: 'Workspace root is not configured or empty',
    };
  }

  if (!candidatePath || candidatePath.trim() === '') {
    return {
      valid: false,
      error: 'Candidate path is empty',
    };
  }

  try {
    const normRoot = normalizePath(workspaceRoot);
    
    // Resolve candidate against root if candidate is relative
    let fullCandidate: string;
    if (candidatePath.startsWith('/')) {
      fullCandidate = normalizePath(candidatePath);
    } else {
      fullCandidate = normalizePath(`${normRoot}/${candidatePath}`);
    }

    // Must be either exactly the workspace root or inside it
    const isExactMatch = fullCandidate === normRoot;
    const isSubPath = fullCandidate.startsWith(normRoot === '/' ? '/' : `${normRoot}/`);

    if (!isExactMatch && !isSubPath) {
      return {
        valid: false,
        error: `Path traversal violation: Target '${fullCandidate}' escapes workspace root '${normRoot}'`,
      };
    }

    return {
      valid: true,
      canonicalPath: fullCandidate,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Path validation error: ${err?.message || String(err)}`,
    };
  }
}

/**
 * Asserts that a candidate path is inside the workspace root.
 * Throws an explicit SecurityViolation Error if outside.
 */
export function ensureInsideWorkspace(candidatePath: string, workspaceRoot: string): string {
  const check = validateWorkspacePath(candidatePath, workspaceRoot);
  if (!check.valid || !check.canonicalPath) {
    throw new Error(`SecurityViolation: ${check.error || 'Path is outside workspace bounds'}`);
  }
  return check.canonicalPath;
}
