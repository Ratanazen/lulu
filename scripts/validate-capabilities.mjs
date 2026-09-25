#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';

console.log('\n🔍 ========================================');
console.log('   LULU CAPABILITY MATRIX VALIDATOR & CI   ');
console.log('========================================\n');

const capabilitiesFilePath = path.resolve('docs/capabilities.json');
const reportFilePath = path.resolve('docs/capability-report.json');

if (!fs.existsSync(capabilitiesFilePath)) {
  console.error('\x1b[31m[ERROR]\x1b[0m docs/capabilities.json does not exist!');
  process.exit(1);
}

let catalog;
try {
  const content = fs.readFileSync(capabilitiesFilePath, 'utf8');
  catalog = JSON.parse(content);
} catch (err) {
  console.error(`\x1b[31m[ERROR]\x1b[0m JSON parse error in docs/capabilities.json: ${err.message}`);
  process.exit(1);
}

const errors = [];
const warnings = [];

// 1. Validate schema version & application
if (typeof catalog.schema_version !== 'number' || catalog.schema_version < 1) {
  errors.push('Missing or invalid "schema_version" (must be >= 1)');
}
if (!catalog.application || catalog.application !== 'Lulu') {
  errors.push('Missing or invalid "application" (must be "Lulu")');
}
if (!catalog.platforms || typeof catalog.platforms !== 'object') {
  errors.push('Missing or invalid "platforms" object');
}

// 2. Validate capabilities array
if (!Array.isArray(catalog.capabilities) || catalog.capabilities.length === 0) {
  errors.push('Missing or empty "capabilities" array');
}

const allowedStatuses = new Set([
  'supported',
  'partial',
  'unsupported',
  'experimental',
  'disabled',
  'requires_permission',
  'requires_dependency',
]);

const allowedPrivacyLevels = new Set([
  'local_only',
  'user_controlled',
  'requires_permission',
  'network_required',
]);

const seenIds = new Set();
const capabilityReport = {};

if (Array.isArray(catalog.capabilities)) {
  for (let i = 0; i < catalog.capabilities.length; i++) {
    const cap = catalog.capabilities[i];
    const prefix = `Capability [${i}] (id: ${cap.id || 'undefined'})`;

    if (!cap.id || typeof cap.id !== 'string') {
      errors.push(`${prefix}: Missing or non-string "id"`);
    } else {
      if (seenIds.has(cap.id)) {
        errors.push(`${prefix}: Duplicate capability id "${cap.id}"`);
      }
      seenIds.add(cap.id);
    }

    if (!cap.name || typeof cap.name !== 'string') {
      errors.push(`${prefix}: Missing or non-string "name"`);
    }

    if (!cap.category || typeof cap.category !== 'string') {
      errors.push(`${prefix}: Missing or non-string "category"`);
    }

    if (!cap.platforms || typeof cap.platforms !== 'object') {
      errors.push(`${prefix}: Missing or invalid "platforms" declaration`);
    }

    if (!Array.isArray(cap.requires)) {
      errors.push(`${prefix}: "requires" must be an array of strings`);
    }

    if (typeof cap.optional !== 'boolean') {
      errors.push(`${prefix}: "optional" must be a boolean`);
    }

    if (!cap.status || !allowedStatuses.has(cap.status)) {
      errors.push(
        `${prefix}: Invalid status "${cap.status}". Allowed: ${Array.from(allowedStatuses).join(', ')}`
      );
    }

    if (!cap.fallback || typeof cap.fallback !== 'string') {
      errors.push(`${prefix}: Missing or non-string "fallback" field`);
    }

    if (!cap.privacy || !allowedPrivacyLevels.has(cap.privacy)) {
      errors.push(
        `${prefix}: Invalid privacy "${cap.privacy}". Allowed: ${Array.from(allowedPrivacyLevels).join(', ')}`
      );
    }

    if (cap.id && cap.status) {
      capabilityReport[cap.id] = cap.status;
    }
  }
}

// Summary evaluation
if (errors.length > 0) {
  console.log(`\x1b[31m[FAILED]\x1b[0m ${errors.length} validation errors found:\n`);
  for (const err of errors) {
    console.log(`  ❌ ${err}`);
  }
  process.exit(1);
}

// 3. Generate Build Report: docs/capability-report.json
const currentPlatform = `${os.platform()}-${os.arch()}`;
const report = {
  application: catalog.application,
  version: '0.1.0',
  build_platform: currentPlatform,
  generated_at: new Date().toISOString(),
  total_capabilities: seenIds.size,
  capabilities: capabilityReport,
};

fs.writeFileSync(reportFilePath, JSON.stringify(report, null, 2), 'utf8');

console.log(`\x1b[32m[PASS]\x1b[0m All ${seenIds.size} capabilities valid!`);
console.log(`\x1b[32m[REPORT]\x1b[0m Generated ${reportFilePath} for platform ${currentPlatform}.\n`);
console.log('========================================\n');
process.exit(0);
