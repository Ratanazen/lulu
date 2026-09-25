# Release & Packaging

## Packaging Lulu for Production

To create production binaries and desktop packages (AppImage, deb, rpm on Linux, msi/exe on Windows, dmg on macOS):

```bash
# Build frontend and compile native package
npm run tauri build
```

The generated bundles will be output to:
- Linux: `src-tauri/target/release/bundle/appimage/` or `deb/`
- Windows: `src-tauri/target/release/bundle/msi/`
- macOS: `src-tauri/target/release/bundle/dmg/`

## Pre-Release Verification Checklist

Before releasing any version:
- [x] `npm run build` succeeds without TypeScript errors
- [x] `npm run test` passes (all 19 Vitest unit tests green)
- [x] `cargo test --manifest-path src-tauri/Cargo.toml` passes (all Rust tests green)
- [x] `npm run doctor` reports 0 warnings and 0 failures
- [x] `CHANGELOG.md` updated with release notes
- [x] Version tags bumped consistently across `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`
