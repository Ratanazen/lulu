#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, execSync } from 'child_process';

const home = os.homedir();
const installedBin = path.join(home, '.local', 'bin', 'lulu');
const localReleaseBin = path.resolve('src-tauri/target/release/lulu');
const localDebugBin = path.resolve('src-tauri/target/debug/lulu');

console.log('\n🐾 ========================================================');
console.log('   LULU DESKTOP COMPANION — APPLICATION LAUNCHER');
console.log('========================================================\n');

// Determine which binary to run
let binaryToRun = null;

if (fs.existsSync(localReleaseBin)) {
  binaryToRun = localReleaseBin;
} else if (fs.existsSync(installedBin)) {
  binaryToRun = installedBin;
} else if (fs.existsSync(localDebugBin)) {
  binaryToRun = localDebugBin;
}

if (!binaryToRun) {
  console.log('⚡ No compiled binary found. Compiling Lulu Desktop now (First Run)...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    execSync('npx tauri build', { stdio: 'inherit' });
    if (fs.existsSync(localReleaseBin)) {
      binaryToRun = localReleaseBin;
    }
  } catch (err) {
    console.error('❌ Failed to compile Lulu Desktop automatically:', err.message);
    process.exit(1);
  }
}

if (!binaryToRun || !fs.existsSync(binaryToRun)) {
  console.error('❌ Executable binary could not be found.');
  console.error('Please run: npm run build:full');
  process.exit(1);
}

// Ensure execution bit
try {
  fs.chmodSync(binaryToRun, 0o755);
} catch (e) {
  // Ignore permission errors if not owner
}

const display = process.env.WAYLAND_DISPLAY || process.env.DISPLAY || 'default';
console.log(`✨ Target Binary: ${binaryToRun}`);
console.log(`✨ Display Server: ${display}`);
console.log(`✨ Architecture: Linux Desktop (Wayland / X11 / Hyprland / KDE / GNOME)`);
console.log('✨ Transparent Screen Companion Window: Initializing...');
console.log('\n--------------------------------------------------------');
console.log('🐾 Lulu is now running on your desktop!');
console.log('   • Click & Drag Lulu anywhere across your monitors.');
console.log('   • Right-click Lulu or use the System Tray to open Control Center.');
console.log('   • Press Ctrl+C in this terminal anytime to exit.');
console.log('========================================================\n');

const child = spawn(binaryToRun, process.argv.slice(2), {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Enable Wayland and X11 compat, prioritizing Wayland when running under Wayland compositors
    GDK_BACKEND: process.env.GDK_BACKEND || (process.env.WAYLAND_DISPLAY ? 'wayland,x11' : 'x11'),
  },
});

child.on('error', (err) => {
  console.error('❌ Error executing Lulu Desktop:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.log(`\n🐾 Lulu received signal: ${signal}. Exiting cleanly.`);
  } else {
    console.log(`\n🐾 Lulu exited with code: ${code}`);
  }
  process.exit(code || 0);
});

// Forward termination signals
process.on('SIGINT', () => {
  child.kill('SIGINT');
});
process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
