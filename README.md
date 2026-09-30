# Lulu — Full Native Desktop Companion (v0.2.0)

> **Lulu** is an offline-first, native Linux desktop companion and interactive pet built with **Tauri 2**, **Rust**, **React**, **TypeScript**, and **SQLite**.
>
> ⚡ **Zero AI • Zero Mini-Games • Zero Cloud Dependencies • 100% Local Privacy**

---

## 🌟 Key Features

### 1. Original Procedural Character Engine
- **100% Pure Vector SVG Code Animation**: Zero static raster sprites or copyrighted assets. Ultra-crisp scaling at any resolution with fluid 60 FPS animation.
- **17 Distinct Character Functions**:
  1. **Idle**: Stoic breathing cadence, gentle hair sway, scanning environment.
  2. **Walk**: Smooth horizontal stride with footstep physics.
  3. **Run**: Aerodynamic sprint with speed dust puffs and forward tilt.
  4. **Jump**: Ballistic vertical trajectory with ground shadow contraction.
  5. **Sit**: Ground rest pose with arms resting on lap.
  6. **Sleep**: Inactivity rest on a celestial crescent cushion with floating `Zzz`.
  7. **Happy**: Victorious smile with blushed cheeks and affection hearts.
  8. **Angry**: Fiery chakra flame aura, frowning brows, and manga anger mark (`💢`).
  9. **Surprised**: Recoil pop with exclamation mark (`!`).
  10. **Dance**: Rhythmic sway with musical notes (`♪ ♫ ♬`) during music playback.
  11. **Think**: Thoughtful upward chin gaze with floating gear bubble (`💭 ⚙️`).
  12. **Talk**: Speech bubble with emotion icons and typewriter cadence.
  13. **Wave**: Friendly greeting wave on startup or command.
  14. **Follow Cursor**: Mathematical real-time eye pupil and head tilt tracking.
  15. **Drag**: Native `data-tauri-drag-region` with responsive grab physics.
  16. **Protect Mode**: Translucent polygonal chakra barrier shield during critical system alerts.
  17. **Notification Mode**: Alert badge and companion reaction bubble for incoming notifications.
- **Selectable Character Styles**:
  - **Shadow Shinobi**: Madara-inspired original chibi with spiky hair, crimson armor, Sharingan eye, and Gunbai fan.
  - **Anime Chibi**: Blue-eyed cute anime companion.
  - **Celestial Kitsune**: Pink kitsune companion.

### 2. Native Linux Notifications Companion (D-Bus)
- Listens directly to `org.freedesktop.Notifications` via session D-Bus.
- Real-time reaction: Lulu alerts you when messages arrive from Telegram, Discord, Chrome, or other Linux desktop applications.
- **Privacy-First**: Notification bodies are disabled (`OFF`) by default; never sent to any cloud server.

### 3. MPRIS Media Player & Synchronized Lyrics Engine
- **Player Detection**: Seamlessly integrates with Spotify, VLC, Firefox, Chrome, Chromium via `playerctl` and MPRIS D-Bus.
- **Dance Mode**: Lulu automatically dances when music plays and calms down when paused or stopped.
- **Playback Controls**: Play/pause, next, and previous track controls built into the Control Center.
- **Local `.lrc` Parser**: Synchronizes with local `.lrc` files (supporting Khmer, English, multilingual lyrics, millisecond timestamps `[mm:ss.xx]`, and offset tags).

### 4. Smart Speech Bubble & Central MessageManager
- **Natural Typewriter Effect**: 30–45ms per character.
- **Adaptive Duration**: Minimum 4000ms, scaling by text length (4s to 12s) to guarantee readability.
- **Interactive Controls**:
  - Hovering over a speech bubble **pauses** the hide timer.
  - Moving mouse away **resumes** the countdown.
  - Single click toggles **pause/resume**.
  - Double click **re-opens** the latest message.
- **Priority Queue**: Deduplicates repeated messages and handles up to 5 prioritized notifications.

### 5. Unified Control Center V2
- **Overview**: Live status of Lulu, mood, current monitor, coordinates, movement mode, and audio state.
- **Pet & Animation Studio**: Vitals, mood status, affection actions ("Lulu Aime ❤️"), and one-click test buttons for all 17 character functions.
- **Notifications**: Master toggle, per-app controls, privacy mode toggle, and recent notification history.
- **Music & Lyrics**: Now Playing card, MPRIS controls, and smooth-scrolling synchronized lyrics viewer.
- **Screen & Walk**: Movement behavior selector (`OFF`, `CALM`, `NORMAL`, `ACTIVE`), wander speed, and visual multi-monitor Screen Map.
- **Privacy & Storage**: SQLite database metrics, JSON data export/backup, and restore capabilities.
- **Diagnostics**: Platform capability matrix (`SUPPORTED`, `PARTIAL`, `UNSUPPORTED`) and automated system health doctor.

---

## 🔒 Privacy & Architecture

| Component | Policy / Implementation |
|---|---|
| **AI / LLMs** | **None.** No Ollama, OpenAI, API keys, or machine learning models. |
| **Mini-Games** | **None.** No game engine, points, or game buttons. |
| **Network** | **100% Offline.** Zero telemetry, zero analytics, zero external API calls. |
| **Storage** | SQLite (`~/.local/share/lulu-desktop/lulu.db`) with versioned migrations. |
| **Compositors** | Wayland (GNOME, KDE Plasma, Hyprland, Sway, Niri) & X11 supported. |

---

## 🛠️ Build & Installation

### Prerequisites
- Node.js 18+ and `npm`
- Rust 1.75+ and `cargo`
- Linux libraries: `webkit2gtk-4.1`, `libssl-dev`, `dbus-monitor`, `playerctl`

### Build Native Application
```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript checks and unit tests
npm run typecheck
npm run test

# 3. Verify Rust backend tests
cargo test --manifest-path src-tauri/Cargo.toml

# 4. Build native release binary
npm run tauri:build -- --no-bundle

# 5. Install to local user binaries
npm run install:bin
```

### Launch Lulu
```bash
lulu
```
