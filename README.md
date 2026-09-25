# Lulu — Modern Offline-First Desktop Companion 🌟

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri: 2.0](https://img.shields.io/badge/Tauri-2.0-orange.svg)](https://v2.tauri.app/)
[![React: 18](https://img.shields.io/badge/React-18.3-cyan.svg)](https://react.dev/)
[![Rust: 2021](https://img.shields.io/badge/Rust-2021-red.svg)](https://www.rust-lang.org/)

**Lulu** is an offline-first, native interactive desktop companion application built from zero with **Tauri 2**, **Rust**, **React**, **TypeScript**, **Vite**, and **SQLite**.

Unlike web-based overlays or simulated pets, Lulu lives in a **real transparent, frameless native OS window**, moves across your operating system displays using real native coordinates, renders procedural pixel art, maintains autonomous behavior and vital needs, and runs 8 built-in mini-games completely offline.

---

## ✨ Core Pillars & Features

- **Real Native OS Integration**:
  - Transparent, borderless window with click-through and native dragging.
  - Real window movement across multiple monitors, DPI scales, and negative coordinate spaces.
  - Native System Tray integration.
- **Decoupled Movement & Animation**:
  - **Movement Engine**: Physics-driven (acceleration, deceleration, arrival detection, boundary clamping).
  - **Animation Engine**: Procedural pixel-art renderer with nearest-neighbor crisp integer scaling and 12+ mood animation states.
- **Autonomous Behavior & Vitality**:
  - 8 vital needs (Energy, Happiness, Fun, Attention, Social, Hunger, Cleanliness, Health) with gentle, non-aggressive decay.
  - Dynamic Mood derivation engine (Calm, Happy, Curious, Playful, Focused, Tired, Sleepy, Excited, Loving, Worried).
  - Contextual speech bubble dialogue system with 10 message pools.
- **Modern Control Center (16 Hubs)**:
  - **Overview**: Status, coordinates, and quick care buttons.
  - **Character Studio**: Switch between Lulu, Kira, and Nori, adjust scale, and test live animations.
  - **Behavior & Personality**: Choose behavior modes (CALM, NORMAL, PLAYFUL, FOCUSED, QUIET) and adjust trait sliders.
  - **Needs & Care**: Detailed vitality breakdown and care triggers.
  - **Mini-Games Arcade**: 8 isolated games (Quick Click, Speed Reaction, Memory Match, Star Catcher, Cosmic Dodge, Pet Care, Starlight Expedition, Custom Game API).
  - **Music Reactions**: Acoustic awareness and dance simulation.
  - **Theme Engine**: 10 built-in themes (Lulu Light, Lulu Dark, Midnight, Soft, Glass, Mono, Forest, Ocean, Sunset, High Contrast).
  - **Screen Map**: Interactive multi-monitor visualizer with click-to-dispatch and home position settings.
  - **Achievements**: XP progression, leveling, and trophies.
  - **Performance**: Frame pacing profiles (AUTO, LOW, BALANCED, HIGH, MAX FPS) and custom FPS targets (15 to 144).
  - **System Monitor**: Native CPU, memory, process count, uptime telemetry via Rust `sysinfo`.
  - **Developer Tools**: Event stream inspector, live state inspector, real OS process table, and Git repo status.
  - **Lulu Doctor**: Diagnostic health suite testing native windows, display servers, storage, and overhead.
  - **Privacy & Storage**: 100% offline guarantee, SQLite migrations, JSON backup export, and recovery import.
  - **Plugin Sandbox**: Extensible plugin ecosystem with permission manifests.
  - **About**: Architecture and license information.

---

## 🏗️ Architecture

```
                ┌───────────────────────────────┐
                │        Lulu Desktop UI        │
                │    (React / TypeScript / Vite) │
                └───────────────┬───────────────┘
                                │
                ┌───────────────▼───────────────┐
                │       Zustand State Store     │
                │        (useLuluStore)         │
                └───────────────┬───────────────┘
                                │
      ┌─────────────────────────┼─────────────────────────┐
      ▼                         ▼                         ▼
Character Studio        Behavior & Needs Engine     Interaction & Speech
      │                         │                         │
      ▼                         ▼                         ▼
Animation Engine           Mood System                EventBus
(PixelRenderer)                 │                         │
      │                         │                         │
      └─────────────────────────┼─────────────────────────┘
                                ▼
                       Movement Engine
                     (Physics Simulation)
                                │
               ┌────────────────┼────────────────┐
               ▼                ▼                ▼
     DesktopWindowService  MonitorService   SystemService
               │                │                │
               └────────────────┼────────────────┘
                                ▼
                    Tauri 2 IPC Command Layer
                                │
               ┌────────────────┼────────────────┐
               ▼                ▼                ▼
        winit/OS Window    Multi-Monitor     sysinfo / Git
               │                │                │
               └────────────────┼────────────────┘
                                ▼
                    Offline SQLite Storage
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18 LTS
- **Rust & Cargo** >= 1.70
- On Linux (Arch / Debian / Fedora): `webkit2gtk-4.1`, `gtk3`, `libayatana-appindicator3`

### Development

```bash
# Install frontend dependencies
npm install

# Run frontend in development server (port 1420)
npm run dev

# Run full desktop application with Tauri
npm run tauri dev
```

### Verification & Testing

```bash
# Run Vitest unit & integration test suite (19 tests)
npm run test

# Run Rust backend unit tests (4 tests)
cargo test --manifest-path src-tauri/Cargo.toml

# Run type check and frontend production build
npm run build

# Run Lulu Doctor CLI diagnostic health suite
npm run doctor
```

---

## 🎮 Included Mini-Games

1. **Quick Click**: Pop spawning star bubbles before they shrink, building combo multipliers.
2. **Speed Reaction**: Millisecond reaction test measuring reflex speed when the signal turns green.
3. **Memory Match**: Flip celestial cards and match pairs in minimal moves.
4. **Star Catcher**: Catch falling starlight drops while dodging dark cosmic bombs.
5. **Cosmic Dodge**: Survive in deep space by avoiding incoming meteor swarms.
6. **Lulu Pet Care**: Interactive grooming, feeding, and resting simulation linked directly to Lulu's needs.
7. **Starlight Expedition**: Mystery grid expedition uncovering ancient relics and stardust.
8. **Custom Game API**: Extensible `IGameInstance` template for community and plugin game developers.

---

## 🔒 Privacy & Security

- **Zero Cloud Calls**: No network telemetry, analytics, or external calls by default.
- **Safe Persistence**: All settings, companion history, and achievements are stored in a local SQLite database (`lulu.db`) with schema migrations.
- **Structured Backups**: Export full snapshots as human-readable JSON files, with rollback-protected restore.

---

## 📄 License

Lulu is released under the [MIT License](LICENSE).
