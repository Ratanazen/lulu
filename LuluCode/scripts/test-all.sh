#!/bin/bash
set -e

echo "=== [1/3] Running Rust Unit Tests (src-tauri) ==="
cargo test --offline --manifest-path src-tauri/Cargo.toml

echo "=== [2/3] Running TypeScript Typecheck ==="
npx tsc --noEmit

echo "=== [3/3] Running Vitest Unit & Integration Tests ==="
npx vitest run

echo "=== All Tests Passed 100% ==="
