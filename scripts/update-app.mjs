#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('\n🚀 ========================================================');
console.log('   LULU DESKTOP COMPANION — APPLICATION UPDATE TASK');
console.log('========================================================\n');

const repoRoot = process.cwd();

// Step 1: Inspect Repository Status
console.log('📦 [1/5] Inspecting repository and git state...');
try {
  const status = execSync('git status --porcelain', { cwd: repoRoot }).toString().trim();
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoRoot }).toString().trim();
  const currentCommit = execSync('git rev-parse --short HEAD', { cwd: repoRoot }).toString().trim();
  console.log(`   Branch: ${branch}`);
  console.log(`   Current Commit: ${currentCommit}`);

  // Step 2: Check remote updates
  console.log('🌐 [2/5] Checking for upstream changes...');
  try {
    execSync('git fetch --dry-run', { cwd: repoRoot, stdio: 'pipe' });
    const count = execSync('git rev-list --count HEAD..@{u} 2>/dev/null || echo 0', { cwd: repoRoot }).toString().trim();
    if (parseInt(count, 10) > 0) {
      console.log(`   Found ${count} new commit(s). Pulling updates...`);
      execSync('git pull --ff-only', { cwd: repoRoot, stdio: 'inherit' });
    } else {
      console.log('   Upstream is up to date.');
    }
  } catch (fetchErr) {
    console.log('   Running in local/offline development mode (no remote pull needed).');
  }

  // Step 3: Build frontend production assets
  console.log('⚡ [3/5] Building frontend assets...');
  execSync('npm run build', { cwd: repoRoot, stdio: 'inherit' });

  // Step 4: Compile embedded release binary
  console.log('🦀 [4/5] Compiling native release binary...');
  execSync('npx tauri build --no-bundle', { cwd: repoRoot, stdio: 'inherit' });

  // Step 5: Install desktop binary & launcher
  console.log('📥 [5/5] Re-installing binary and desktop entries...');
  execSync('node scripts/install-desktop.mjs', { cwd: repoRoot, stdio: 'inherit' });

  // Step 6: Restart running process if active
  const isRunning = execSync('pgrep -x lulu 2>/dev/null || true').toString().trim();
  if (isRunning) {
    console.log('🔄 Restarting running Lulu companion instance...');
    execSync('killall -9 lulu 2>/dev/null || true');
    setTimeout(() => {
      execSync('/home/reny/.local/bin/lulu &');
    }, 1000);
  }

  console.log('\n========================================================');
  console.log('🎉 Lulu update task completed successfully!');
  console.log('========================================================\n');
} catch (err) {
  console.error('\n❌ Update task failed:', err.message);
  process.exit(1);
}
