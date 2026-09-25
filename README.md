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
  - Native System Tray integration (Show Lulu, Hide Lulu, Open Chat, Settings, Quit).
  - Native OS autostart on user login (XDG `.desktop`).
- **AI Companion Subsystem**:
  - Multi-provider LLM architecture: Local **Ollama** (`localhost:11434`), OpenAI, Google Gemini, Anthropic Claude, and Custom Endpoints.
  - Real-time token streaming with cancel/abort controls.
  - Offline fallback conversation engine: Lulu responds smoothly even with zero internet or API keys.
- **Persistent Long-Term Memory**:
  - Remembers user preferences, project details, and custom facts.
  - Automatic prompt context injection and semantic search.
  - JSON backup export and import for full user data sovereignty.
- **Voice & Speech Synthesis**:
  - Text-to-Speech (TTS) with system voice selection, pitch, rate, and volume controls.
  - Push-to-talk Speech-to-Text (STT) voice recognition.
  - Automatic character state sync (`LISTENING`, `THINKING`, `TALKING`).
- **Personality Engine & Dynamic Emotions**:
  - 10 archetypes: *Friendly Buddy*, *Cute & Playful*, *Executive Assistant*, *Witty Jester*, *Zen Mentor*, *Hype Coach*, *Study Buddy*, *Senior Dev Pair*, *Minimalist*, and *Custom Persona*.
  - Emotion tracking (Happiness, Energy, Friendship, Focus, Playfulness) responding to chats and interactions.
- **Desktop Tools System**:
  - Safe native utilities: `/calc` math evaluator, `/timer` countdown/Pomodoro sprints, `/note` persistent scratchpad memos.
- **Decoupled Movement & Animation**:
  - **Movement Engine**: Physics-driven (acceleration, deceleration, arrival detection, boundary clamping).
  - **Animation Engine**: Procedural pixel-art renderer with nearest-neighbor crisp integer scaling and 12+ mood animation states.
- **Autonomous Behavior & Vitality**:
  - 8 vital needs (Energy, Happiness, Fun, Attention, Social, Hunger, Cleanliness, Health) with gentle, non-aggressive decay.
  - Dynamic Mood derivation engine (Calm, Happy, Curious, Playful, Focused, Tired, Sleepy, Excited, Loving, Worried).
  - Contextual speech bubble dialogue system with 10 message pools.
- **Modern Control Center (16 Hubs)**:
  - **Overview**: Status, coordinates, and quick care buttons.
  - **AI & Models**: Provider selection, model discovery, temperature, and tokens.
  - **Memory Storage**: Fact browser, keyword search, and JSON export.
  - **Voice & Audio**: TTS voice picker, pitch/speed controls, push-to-talk.
  - **Character Studio**: Switch between Lulu, Kira, and Nori, adjust scale, and test live animations.
  - **Behavior & Personality**: Choose behavior modes and personality archetypes.
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
# Run Vitest unit & integration test suite (62 tests across 14 suites)
npm run test

# Run Rust backend unit tests (4 tests)
cargo test --manifest-path src-tauri/Cargo.toml

# Run type check and frontend production build
npm run build

# Run Lulu Doctor CLI diagnostic health suite (6 checks)
npm run doctor
```

### Production Packaging & Standalone Desktop Binary

```bash
# Compile standalone native release executable and Debian (.deb) package
npx tauri build --bundles deb

# Run the standalone native binary directly:
./src-tauri/target/release/lulu

# Install the Debian package system-wide:
sudo dpkg -i src-tauri/target/release/bundle/deb/Lulu_0.1.0_amd64.deb
```

---

## ⌨️ Desktop Shortcuts & Controls

- **`Ctrl + Shift + Space`**: Open / Close Floating Chat Window
- **`Ctrl + Shift + L`**: Open / Close Quick Actions Dock
- **`Ctrl + Shift + C`**: Open / Close Modern Control Center
- **`Escape`**: Dismiss active floating overlay
- **Right Click Lulu**: Context Menu (Chat, Quick Actions, Personality, Care, Settings, Hide, Quit)
- **Click & Drag**: Move Lulu freely across screens and snap to screen boundaries
- **System Tray**: Lulu icon in system tray for fast Show/Hide, Chat, Settings, and Quit

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

- **Zero Cloud Telemetry**: No network telemetry, analytics, or external calls by default.
- **Local AI Sovereignty**: First-class support for local **Ollama** models running on `localhost:11434` — 100% offline intelligence.
- **Offline Fallback Engine**: If no LLM or network is configured, Lulu's built-in heuristic dialogue engine continues responding seamlessly.
- **Safe Persistence**: All settings, memories, companion history, and achievements are stored in a local SQLite database (`lulu.db`) with schema migrations.
- **Structured Backups**: Export full snapshots as human-readable JSON files, with rollback-protected restore.

---

## 📄 License

Lulu is released under the [MIT License](LICENSE).

