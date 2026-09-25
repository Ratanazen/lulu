# Lulu Architecture

## 1. Overview

Lulu is an offline-first desktop companion application built on a hybrid Rust + Web platform using **Tauri 2**, **React 18**, **TypeScript**, and **SQLite**.

The system is deliberately designed with strict separation of concerns:
- **Presentation Layer**: React, Zustand, and Canvas-based procedural pixel rendering.
- **Simulation Layer**: Independent movement physics engine, needs decay engine, mood evaluator, and behavior action scorer.
- **Native OS Bridge**: Tauri 2 IPC commands with strong type contracts.
- **System Layer**: Rust-native window control, multi-monitor topology resolution, `sysinfo` hardware query, and `rusqlite` persistent storage.

## 2. Decoupled Systems

### Movement vs. Animation Separation
A core design rule of Lulu is that **Movement determines physics (coordinates, velocity, acceleration)**, while **Animation determines visual representation (sprite, frame, mood expression)**:
1. `MovementEngine` runs a 60 Hz physics tick calculating continuous position `(x, y)` clamped to active monitor work areas. It calls `DesktopWindowService.setPosition(x, y)` to move the real OS window.
2. `PixelRenderer` draws the appropriate frame at the configured animation FPS (e.g. 4-12 FPS). It never manipulates window coordinates.

### Offline SQLite Storage & Migrations
All persistent data is stored in `$APP_DATA_DIR/lulu.db`:
- `schema_migrations`: Version tracking table ensuring safe upgrades without data loss.
- `kv_store`: Fast key-value persistence for companion state.
- `settings`: Serialized settings.
- `achievements`: Progression and unlock timestamps.
- `game_records`: High scores and historical game metrics.

## 3. IPC Architecture

All communication between frontend and native Rust follows strict typed contracts:
- `get_monitors`: Queries display devices, work areas, scale factors, and primary status.
- `get_window_position` / `set_window_position`: Queries and updates the native physical position of the webview window.
- `set_always_on_top` / `set_click_through`: Configures OS window management flags.
- `get_system_metrics`: Gathers real CPU, memory, and uptime telemetry via `sysinfo`.
- `storage_export` / `storage_import`: Produces and restores full disaster-recovery JSON snapshots.
