#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync, spawn } from 'child_process';

console.log('\n🚀 ========================================================');
console.log('   LULU SUITE — FULL SYSTEM APPLICATION UPDATE PIPELINE   ');
console.log('   (Lulu Desktop Companion & Lulu Code Agent)             ');
console.log('========================================================\n');

const repoRoot = process.cwd();
const home = os.homedir();
const binDir = path.join(home, '.local', 'bin');
const appsDir = path.join(home, '.local', 'share', 'applications');
const iconsDir128 = path.join(home, '.local', 'share', 'icons', 'hicolor', '128x128', 'apps');
const iconsDir256 = path.join(home, '.local', 'share', 'icons', 'hicolor', '256x256', 'apps');
const pixmapsDir = path.join(home, '.local', 'share', 'pixmaps');

// Ensure target directories exist
[binDir, appsDir, iconsDir128, iconsDir256, pixmapsDir].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

try {
  // Step 1: Inspect Repository State & Upstream
  console.log('📦 [1/7] Inspecting repository and git state...');
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoRoot }).toString().trim();
    const currentCommit = execSync('git rev-parse --short HEAD', { cwd: repoRoot }).toString().trim();
    console.log(`   Current Branch: ${branch}`);
    console.log(`   Current Commit: #${currentCommit}`);

    console.log('🌐 Checking for upstream changes...');
    try {
      execSync('git fetch --dry-run', { cwd: repoRoot, stdio: 'pipe' });
      const behindCount = execSync('git rev-list --count HEAD..@{u} 2>/dev/null || echo 0', { cwd: repoRoot }).toString().trim();
      if (parseInt(behindCount, 10) > 0) {
        console.log(`   Found ${behindCount} new upstream commit(s). Pulling updates...`);
        execSync('git pull --ff-only', { cwd: repoRoot, stdio: 'inherit' });
      } else {
        console.log('   Working tree is up to date.');
      }
    } catch {
      console.log('   Running in local/offline mode (skipping remote fetch).');
    }
  } catch (gitErr) {
    console.log('   Non-git environment or git command not available.');
  }

  // Step 2: Build Lulu Companion Frontend
  console.log('\n⚡ [2/7] Building Lulu Companion frontend assets...');
  execSync('npm run build', { cwd: repoRoot, stdio: 'inherit' });

  // Step 3: Build Lulu Companion Native Release Binary
  console.log('\n🦀 [3/7] Compiling Lulu Companion native release binary...');
  execSync('npx tauri build --no-bundle', { cwd: repoRoot, stdio: 'inherit' });

  // Step 4: Build Lulu Code Frontend
  const luluCodeDir = path.join(repoRoot, 'LuluCode');
  if (fs.existsSync(luluCodeDir)) {
    console.log('\n💻 [4/7] Building Lulu Code agent frontend assets...');
    execSync('npm run build', { cwd: luluCodeDir, stdio: 'inherit' });

    // Step 5: Build Lulu Code Native Release Binary
    console.log('\n🤖 [5/7] Compiling Lulu Code agent native release binary...');
    execSync('npx tauri build --no-bundle', { cwd: luluCodeDir, stdio: 'inherit' });
  } else {
    console.log('\n⚠️ [4/7 & 5/7] LuluCode directory not found, skipping Lulu Code build.');
  }

  // Step 6: Install Desktop Binaries & Launchers
  console.log('\n📥 [6/7] Installing binaries, icons, and desktop launchers...');

  // 6a. Install Lulu Companion Binary
  const luluSrcBinary = path.join(repoRoot, 'src-tauri', 'target', 'release', 'lulu');
  const luluTargetBinary = path.join(binDir, 'lulu');
  if (fs.existsSync(luluSrcBinary)) {
    if (fs.existsSync(luluTargetBinary)) {
      try { fs.unlinkSync(luluTargetBinary); } catch {}
    }
    fs.copyFileSync(luluSrcBinary, luluTargetBinary);
    fs.chmodSync(luluTargetBinary, 0o755);
    console.log(`   [PASS] Installed Lulu binary: ${luluTargetBinary}`);
  }

  // 6b. Install Lulu Code Binary
  const luluCodeSrcBinary = path.join(luluCodeDir, 'src-tauri', 'target', 'release', 'lulu-code');
  const luluCodeTargetBinary = path.join(binDir, 'lulu-code');
  if (fs.existsSync(luluCodeSrcBinary)) {
    if (fs.existsSync(luluCodeTargetBinary)) {
      try { fs.unlinkSync(luluCodeTargetBinary); } catch {}
    }
    fs.copyFileSync(luluCodeSrcBinary, luluCodeTargetBinary);
    fs.chmodSync(luluCodeTargetBinary, 0o755);
    console.log(`   [PASS] Installed Lulu Code binary: ${luluCodeTargetBinary}`);
  }

  // 6c. Install Icons
  const iconSrc = path.join(repoRoot, 'src-tauri', 'icons', 'icon.png');
  if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, path.join(iconsDir128, 'lulu.png'));
    fs.copyFileSync(iconSrc, path.join(iconsDir256, 'lulu.png'));
    fs.copyFileSync(iconSrc, path.join(pixmapsDir, 'lulu.png'));
    fs.copyFileSync(iconSrc, path.join(iconsDir128, 'lulu-code.png'));
    fs.copyFileSync(iconSrc, path.join(iconsDir256, 'lulu-code.png'));
    fs.copyFileSync(iconSrc, path.join(pixmapsDir, 'lulu-code.png'));
    console.log('   [PASS] Installed desktop icons');
  }

  // 6d. Install Desktop Launchers
  const luluDesktop = `[Desktop Entry]
Name=Lulu
GenericName=AI Desktop Companion
Comment=AI Desktop Companion & Virtual Pet
Exec=${luluTargetBinary}
Icon=lulu
Terminal=false
Type=Application
Categories=Utility;Game;
Keywords=companion;pet;ai;desktop;
StartupNotify=true
`;
  fs.writeFileSync(path.join(appsDir, 'lulu.desktop'), luluDesktop, 'utf8');

  const luluCodeDesktop = `[Desktop Entry]
Name=Lulu Code
GenericName=AI Coding Agent
Comment=Local-first Native Desktop AI Coding Agent
Exec=${luluCodeTargetBinary}
Icon=lulu-code
Terminal=false
Type=Application
Categories=Development;IDE;
Keywords=code;agent;ai;editor;terminal;
StartupNotify=true
`;
  fs.writeFileSync(path.join(appsDir, 'lulu-code.desktop'), luluCodeDesktop, 'utf8');
  console.log('   [PASS] Registered .desktop launchers for Lulu & Lulu Code');

  // 6e. Ensure 'gemini' CLI command is linked to 'agy'
  const agyBin = path.join(binDir, 'agy');
  const geminiBin = path.join(binDir, 'gemini');
  if (fs.existsSync(agyBin)) {
    try {
      if (fs.existsSync(geminiBin)) {
        try { fs.unlinkSync(geminiBin); } catch {}
      }
      fs.symlinkSync(agyBin, geminiBin);
      console.log(`   [PASS] Linked Gemini CLI: ${geminiBin} -> ${agyBin}`);
    } catch (e) {
      console.log(`   [NOTE] Could not symlink gemini: ${e.message}`);
    }
  }

  // 6e. Sway Compositor Rules
  const swayConfigDir = path.join(home, '.config', 'sway', 'config.d');
  if (fs.existsSync(swayConfigDir)) {
    const swayRule = `# Lulu Desktop AI Companion
for_window [app_id="lulu"] floating enable, border none, sticky enable, blur disable, shadows disable, corner_radius 0
for_window [app_id="com.ratana.lulu"] floating enable, border none, sticky enable, blur disable, shadows disable, corner_radius 0
for_window [title="Lulu"] floating enable, border none, sticky enable, blur disable, shadows disable, corner_radius 0

# Lulu Code Agent
for_window [app_id="lulu-code"] floating disable, border pixel 1
for_window [app_id="com.lulu.code"] floating disable, border pixel 1
`;
    fs.writeFileSync(path.join(swayConfigDir, 'lulu.conf'), swayRule, 'utf8');
    try { execSync('swaymsg reload 2>/dev/null || true'); } catch {}
    console.log('   [PASS] Configured Sway Wayland rules');
  }

  // Step 7: Process Restart
  console.log('\n🔄 [7/7] Checking running instances...');
  const isLuluRunning = execSync('pgrep -x lulu 2>/dev/null || true').toString().trim();
  if (isLuluRunning) {
    console.log('   Restarting active Lulu companion instance...');
    execSync('killall -9 lulu 2>/dev/null || true');
    const child = spawn(luluTargetBinary, [], {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        GDK_BACKEND: process.env.WAYLAND_DISPLAY ? 'wayland,x11' : 'x11',
      },
    });
    child.unref();
    console.log('   [PASS] Relaunched Lulu with Wayland/X11 display support.');
  } else {
    console.log('   No active background instances to restart.');
  }

  console.log('\n========================================================');
  console.log('🎉 FULL SYSTEM UPDATE COMPLETE!');
  console.log('========================================================');
  console.log(`Lulu Companion: ${luluTargetBinary}`);
  console.log(`Lulu Code:      ${luluCodeTargetBinary}`);
  console.log('========================================================\n');

} catch (err) {
  console.error('\n❌ Full update pipeline encountered an error:', err.message);
  process.exit(1);
}
