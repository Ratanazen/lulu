# Changelog

All notable changes to the **Lulu** desktop companion project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-09-25

### Added
- **Character & Behavior Evolution**:
  - Expanded animation library to 18 procedural states, adding `yawn`, `read`, `nod`, `dizzy`, `meditate`, and `pout`.
  - Added 15 rich emotional moods with time-of-day circadian influences and critical vital state triggers.
  - Circadian rhythm decay multipliers in Needs Engine adjusting hunger, energy, and sleepiness based on real local time.
  - Dynamic autonomous behavior scoring evaluating `yawn`, `read`, and `meditate` alongside exploration, rest, and sleep.
  - Cosmetic Aura Engine supporting 5 celestial aura styles (Celestial White, Starlight Gold, Rose Cosmic, Emerald Zen, Radiant Indigo) and procedural glow rendering.
  - Cosmetic Accessories: toggleable floating Celestial Halo and Starlight Star Glasses rendered in-engine.
  - Companion Memory & Learned Preferences tracking total pats, games played, interaction count, session wake count, and circadian active rhythm.
  - 5 new contextual speech categories (`morning`, `night`, `study`, `weather`, `break`) with atmospheric starlight dialogue pools and circadian recommendation.
  - Enhanced Character Studio tab in Control Center featuring live 18-state animation tester, cosmetic styling, and companion memory readout.
  - Comprehensive unit test coverage across 8 test suites (27 tests passing) including dedicated behavior, preferences, and speech validation.

## [0.1.0] - 2026-09-24

### Added
- **Core Architecture**:
  - Offline-first desktop companion architecture built from scratch.
  - Native Tauri 2 + Rust + React 18 + TypeScript + Vite stack.
- **Native Desktop Integration**:
  - Frameless, transparent desktop companion window with custom native dragging.
  - Real window movement through `DesktopWindowService` and Tauri OS APIs.
  - Native multi-monitor query engine supporting negative coordinates, multi-DPI, and work area boundaries.
  - Native System Tray integration with Show, Hide, and Quit controls.
- **Movement & Physics Engine**:
  - Decoupled movement physics simulation running independently of animation rendering.
  - Acceleration, deceleration, velocity, arrival detection, and monitor boundary clamping.
  - Movement modes: `walkTo`, `runTo`, `wander`, `goHome`, `followCursor`.
- **Procedural Pixel-Art Animation**:
  - Procedural pixel-art canvas renderer for crisp nearest-neighbor integer scaling.
  - 12+ expressive companion animation states: idle, walk, run, sit, sleep, happy, curious, excited, celebrate, wave, jump, dance.
- **Character & Behavior Systems**:
  - Extensible `CharacterProfile` engine featuring Lulu, Kira, and Nori.
  - Needs engine with 8 vital metrics (energy, happiness, fun, attention, social, hunger, cleanliness, health) and gentle decay.
  - Dynamic Mood derivation engine and prioritized decision pipeline.
  - Speech bubble dialogue system with 10 contextual message pools.
- **Storage & Recovery**:
  - Offline SQLite database with automated schema migrations.
  - Full JSON backup export and validated disaster recovery import.
- **Mini-Games Platform**:
  - 8 isolated mini-games: Quick Click, Speed Reaction, Memory Match, Star Catcher, Cosmic Dodge, Lulu Pet Care, Starlight Expedition, and Custom Game API.
- **Progression & Achievements**:
  - XP leveling, stars, and 8 initial achievement trophies.
- **Control Center & Customization**:
  - 16-tab modern Control Center modal.
  - Theme Engine with 10 built-in themes (Lulu Light, Lulu Dark, Midnight, Soft, Glass, Mono, Forest, Ocean, Sunset, High Contrast).
  - Multi-Monitor Screen Map visualizer with interactive dispatch.
  - Performance management with profiles (AUTO, LOW, BALANCED, HIGH, MAX FPS).
  - Real native hardware monitor (CPU, memory, processes, uptime) and Git status reader.
  - "Lulu Doctor" diagnostic health suite and CLI.
