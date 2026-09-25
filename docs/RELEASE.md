# Release & Packaging

## Packaging Lulu for Production

To create production binaries and desktop packages (deb on Linux, msi/exe on Windows, dmg on macOS):

```bash
# Build frontend and compile native package
npx tauri build --bundles deb
```

The generated bundles and binaries:
- **Standalone Linux Executable**: `src-tauri/target/release/lulu` (4.6 MB)
- **Debian Package**: `src-tauri/target/release/bundle/deb/Lulu_0.1.0_amd64.deb` (2.2 MB)
- **Windows Executable/MSI**: `src-tauri/target/release/bundle/msi/`
- **macOS App/DMG**: `src-tauri/target/release/bundle/dmg/`

## Pre-Release Verification Checklist

Before releasing any version:
- [x] `npm run build` succeeds without TypeScript errors
- [x] `npm run test` passes (all 62 Vitest unit tests green across 14 suites)
- [x] `cargo test --manifest-path src-tauri/Cargo.toml` passes (all 4 Rust tests green)
- [x] `npm run doctor` reports 0 warnings and 0 failures (6/6 checks passing)
- [x] Standalone executable `./src-tauri/target/release/lulu` runs directly without dev server
- [x] System Tray, Global Hotkeys, Autostart, and Window Clamping verified
- [x] Version tags bumped consistently across `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` (`0.1.0`)

