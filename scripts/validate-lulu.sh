#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🐾 LULU DESKTOP PRODUCTION VALIDATION PIPELINE"
echo "Package: lulu-desktop | Version: 0.1.0 | Platform: Linux"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

echo -e "\n[1/5] Validating Machine-Readable Capabilities Schema..."
node scripts/validate-capabilities.mjs

echo -e "\n[2/5] Running Vitest Unit & Integration Test Suites (100+ tests)..."
npm test

echo -e "\n[3/5] Running Rust Backend Cargo Test Suite..."
cargo test --manifest-path src-tauri/Cargo.toml

echo -e "\n[4/5] Testing Frontend TypeScript & Vite Production Build..."
npm run build

echo -e "\n[5/5] Running Lulu Doctor System Diagnostics..."
node scripts/doctor.mjs

echo -e "\n=========================================================="
echo "✅ ALL PRODUCTION GATES PASSED (100% GREEN)"
echo "Lulu Desktop is verified for real Linux environments."
echo "=========================================================="
