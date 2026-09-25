#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

console.log('\n🚀 ========================================');
console.log('   INSTALLING LULU DESKTOP APPLICATION     ');
console.log('========================================\n');

const home = os.homedir();
const binDir = path.join(home, '.local', 'bin');
const appsDir = path.join(home, '.local', 'share', 'applications');
const iconsDir128 = path.join(home, '.local', 'share', 'icons', 'hicolor', '128x128', 'apps');
const iconsDir256 = path.join(home, '.local', 'share', 'icons', 'hicolor', '256x256', 'apps');
const pixmapsDir = path.join(home, '.local', 'share', 'pixmaps');

// Create directories
[binDir, appsDir, iconsDir128, iconsDir256, pixmapsDir].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

// 1. Copy Binary
const srcBinary = path.resolve('src-tauri/target/release/lulu');
const targetBinary = path.join(binDir, 'lulu');

if (!fs.existsSync(srcBinary)) {
  console.error(`❌ Source binary not found at: ${srcBinary}`);
  console.error('Please run "npm run build && npx tauri build" first.');
  process.exit(1);
}

fs.copyFileSync(srcBinary, targetBinary);
fs.chmodSync(targetBinary, 0o755);
console.log(`[PASS] Installed binary to: ${targetBinary}`);

// 2. Copy Icons
const iconSrc = path.resolve('src-tauri/icons/icon.png');
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, path.join(iconsDir128, 'lulu.png'));
  fs.copyFileSync(iconSrc, path.join(iconsDir256, 'lulu.png'));
  fs.copyFileSync(iconSrc, path.join(pixmapsDir, 'lulu.png'));
  console.log('[PASS] Installed desktop icons in standard hicolor & pixmaps directories');
}

// 3. Create .desktop launcher
const desktopEntry = `[Desktop Entry]
Name=Lulu
GenericName=AI Desktop Companion
Comment=AI Desktop Companion & Virtual Pet
Exec=${targetBinary}
Icon=lulu
Terminal=false
Type=Application
Categories=Utility;Game;
Keywords=companion;pet;ai;desktop;
StartupNotify=true
`;

const desktopFile = path.join(appsDir, 'lulu.desktop');
fs.writeFileSync(desktopFile, desktopEntry, 'utf8');
fs.chmodSync(desktopFile, 0o755);
console.log(`[PASS] Created application launcher at: ${desktopFile}`);

// 4. Update desktop database
try {
  execSync(`update-desktop-database "${appsDir}"`, { stdio: 'inherit' });
  console.log('[PASS] Updated desktop application database');
} catch (e) {
  console.warn('[WARN] Could not run update-desktop-database, launcher is still registered.');
}

console.log('\n========================================');
console.log('🎉 Lulu installed successfully!');
console.log(`Executable: ${targetBinary}`);
console.log('You can now launch Lulu from your app launcher or by running:');
console.log('  lulu');
console.log('========================================\n');
