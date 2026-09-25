# Lulu — Modern Offline-First Desktop Companion 🌟

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tauri: 2.0](https://img.shields.io/badge/Tauri-2.0-orange.svg)](https://v2.tauri.app/)
[![React: 18](https://img.shields.io/badge/React-18.3-cyan.svg)](https://react.dev/)
[![Rust: 2021](https://img.shields.io/badge/Rust-2021-red.svg)](https://www.rust-lang.org/)

**Lulu** is an offline-first, native interactive desktop companion application built from zero with **Tauri 2**, **Rust**, **React**, **TypeScript**, **Vite**, and **SQLite**.

Unlike web-based overlays or simulated pets, Lulu lives in a **real transparent, frameless native OS window**, moves across your operating system displays using real native coordinates, renders procedural pixel art, maintains autonomous behavior and vital needs, and runs 8 built-in mini-games completely offline.

---

## ✨ Core Pillars & Features

- **Multi-Renderer Character Engine**:
  - **Procedural 2D Pixel**: Retro pixel art with dynamic color palettes, auras, accessories, and viseme lip-sync.
  - **Vector 2D Skeletal**: Dynamic bone hierarchy with smooth limb rotations and facial expressions.
  - **WebGL / 3D VRM**: Hardware-accelerated 3D avatar adapter with runtime capability detection and automatic fallback.
  - **Lip-Sync Engine**: Real-time viseme cadence tracking (`closed`, `small`, `medium`, `open`, `smile`) linked to speech audio.
- **Original Anime Presets**:
  - **Kage Shinobi**: Stealth ninja aesthetic, dark palette, disciplined persona.
  - **Ren Cyber Ninja**: Neon cybernetic samurai with high-energy movement.
  - **Takeshi Samurai**: Traditional katana master, bushido spirit, calm demeanor.
  - **Aria Mage**: Celestial arcane spellcaster, cosmic violet palette.
  - **Character Pack Validator**: Archive and manifest validator enforcing 50MB limits, allowed texture formats, and blocking executables.
- **Native Host AI CLI Integration**:
  - Direct host discovery for `gemini`, `codex`, `claude`, and `ollama`.
  - Truthful status reporting (`INSTALLED` vs `NOT_INSTALLED`), path discovery, version probing, and execution streaming.
  - Official installation guidance for missing CLI binaries.
- **Multi-Agent Orchestrator & Workspace Boundary**:
  - 10 Specialized Agents: *General Assistant*, *Architect Planner*, *Senior Coder*, *Code Reviewer*, *Test Engineer*, *Knowledge Researcher*, *Linux Specialist*, *DevOps & Packaging*, *Security Guardian*, and *UI/UX Designer*.
  - Strict **Workspace Boundary Containment**: Enforces that all file modifications, script evaluations, and agent tools are restricted to a user-defined project directory, blocking directory traversals (`../`) and system escapes.
- **Autonomous Resource Governor**:
  - Automatic CPU/RAM safety throttling: dynamically reduces render pacing from 60 FPS to 15 FPS when host CPU usage exceeds 80% to protect gaming and compile workloads.
- **Safe AI Tools & Confirmation Governance**:
  - Read-only tools (`system_info`, `cpu_info`, `ram_info`, `disk_info`, `network_info`, `battery_info`, `open_application`, `open_folder`, `open_url`, `file_search`).
  - Dangerous tools (`delete_file`, `kill_process`, `arbitrary_shell`) governed by mandatory user approval choices (`Allow Once`, `Allow Session`, `Deny`).
- **Official Google OAuth 2.0 PKCE Architecture**:
  - RFC 7636 Authorization Code flow with PKCE, least-privilege scopes (`openid email profile`), and zero client secret or credential scraping.
- **Real Native OS Integration**:
  - Transparent, borderless window with click-through and native dragging.
  - Real window movement across multiple monitors, DPI scales, and negative coordinate spaces.
  - Native System Tray integration (Show Lulu, Hide Lulu, Open Chat, Settings, Quit).
  - Native OS autostart on user login (XDG `.desktop`).
  - Native Linux Desktop Awareness: Wayland / X11 session detection, Sway / Hyprland tiling WM detection, and active workspace tracking.
- **Linux Native Notifications Subsystem**:
  - Background D-Bus listener monitoring `org.freedesktop.Notifications`.
  - Deterministic originating application identification (Telegram ✈️, Discord 🎮, Slack 💼, Email ✉️, Browser 🌐, VS Code 💻, Terminal 🖥️, Music 🎵).
  - Strict privacy protection: `Read Notification Content` is disabled by default, ensuring message bodies remain private.
  - Whitelist filtering and native test notification generation via `notify-send`.
- **Linux MPRIS Music & Synchronized Lyrics (.lrc)**:
  - Real-time media playback tracking via Linux MPRIS D-Bus (`org.mpris.MediaPlayer2`) and `playerctl`.
  - Automatic detection of Spotify, VLC, browser media, YouTube, and local players.
  - High-precision `.lrc` lyrics parser supporting metadata (`[ti:]`, `[ar:]`, `[al:]`), multiple timestamps per line, and sub-second offsets.
  - Real-time lyrics karaoke sync displaying active lyric lines in Lulu's speech bubbles and Control Center.
- **Voice & Speech Synthesis**:
  - Text-to-Speech (TTS) with system voice selection, pitch, rate, and volume controls.
  - Push-to-talk Speech-to-Text (STT) voice recognition.
  - Automatic character state sync (`LISTENING`, `THINKING`, `TALKING`).
- **Autonomous Behavior & Vitality**:
  - 8 vital needs (Energy, Happiness, Fun, Attention, Social, Hunger, Cleanliness, Health) with gentle, non-aggressive decay.
  - Dynamic Mood Engine with 6 continuous dimensions (Happiness, Energy, Curiosity, Affection, Boredom, Stress).
  - Contextual speech bubble dialogue system with 10 message pools.
- **Modern Control Center (19 Hubs)**:
  - **Overview**: Status, coordinates, quick care buttons, and 6-variable mood engine.
  - **AI & Models**: Cloud LLMs and Native Host AI CLI Tools with live status badges.
  - **AI Agents & Teams**: 10 specialized agents, task runner, and workspace boundary manager.
  - **Memory Storage**: Fact browser, keyword search, and JSON export.
  - **Voice & Audio**: TTS voice picker, pitch/speed controls, push-to-talk.
  - **Character Studio**: Anime presets, 3 rendering engines, accessories, and pack validator.
  - **Behavior & Personality**: Choose behavior modes and personality archetypes.
  - **Needs & Care**: Detailed vitality breakdown and care triggers.
  - **Mini-Games Arcade**: 8 isolated games (Quick Click, Speed Reaction, Memory Match, Star Catcher, Cosmic Dodge, Pet Care, Starlight Expedition, Custom Game API).
  - **Music Reactions**: Acoustic awareness and dance simulation.
  - **Theme Engine**: 10 built-in themes.
  - **Screen Map**: Interactive multi-monitor visualizer with click-to-dispatch.
  - **Achievements**: XP progression, leveling, and trophies.
  - **Performance & FPS**: Resource Governor controls and live safety throttling.
  - **System Monitor**: Native CPU, memory, GPU, disk, battery, process count, uptime telemetry.
  - **Developer Tools**: Event stream inspector, live state inspector, real OS process table.
  - **Lulu Doctor**: Diagnostic health suite testing native windows, display servers, storage, and overhead.
  - **Privacy & Storage**: 100% offline guarantee, Google OAuth 2.0 PKCE, and 12-permission matrix.
  - **About Lulu**: Version, platform, and architectural credits.

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
# Validate Machine-Readable Capability Matrix schema & generate build report
npm run validate:capabilities

# Run Vitest unit & integration test suite (79 tests across 17 suites)
npm run test

# Run Rust backend unit tests (6 tests)
cargo test --manifest-path src-tauri/Cargo.toml

# Run type check and frontend production build
npm run build

# Run Lulu Doctor CLI diagnostic health suite (7 checks)
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

