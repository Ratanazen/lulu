#!/bin/bash
set -e

echo "=== Building Lulu Code Frontend ==="
npm run build

echo "=== Building Lulu Code Production Binary ==="
npx tauri build --bundles deb

echo "=== Build Complete ==="
