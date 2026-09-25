# Development Guide

## Environment Setup

1. **System Libraries (Linux)**:
   - Arch Linux: `pacman -S webkit2gtk-4.1 gtk3 libayatana-appindicator`
   - Ubuntu/Debian: `apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev`
   - Fedora: `dnf install webkit2gtk4.1-devel gtk3-devel libayatana-appindicator-devel`
2. **Node.js**: >= 18.x
3. **Rust**: >= 1.70.x (`rustup update stable`)

## Useful Commands

- **Run Dev Server**: `npm run dev`
- **Run Tauri Application**: `npm run tauri dev`
- **Run Vitest Tests**: `npm run test`
- **Run Rust Tests**: `cargo test --manifest-path src-tauri/Cargo.toml`
- **Type Check & Build**: `npm run build`
- **Run Diagnostics**: `npm run doctor`
