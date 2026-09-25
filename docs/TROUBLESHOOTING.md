# Troubleshooting & Diagnostics

## 1. Using "Lulu Doctor"

Lulu includes an automated health diagnostics suite accessible from:
1. **Command Line**: Run `npm run doctor` to check Node runtime, Cargo compiler, Tauri transparency settings, SQLite storage, and frontend assets.
2. **Control Center UI**: Navigate to the **Lulu Doctor** tab (`🩺`) for live window, display server, and memory overhead reports.

## 2. Common Scenarios

### Transparency Issues on Linux
- **Compositor Required**: Transparent frameless windows require a running X11 or Wayland compositor (e.g. `picom`, Mutter, KWin, or Wayfire). If the window appears with a black background, verify your window manager compositor is active.

### Multi-Monitor Alignment
- If coordinates feel offset on high-DPI displays, check the **Screen Map** tab in Control Center to ensure each display's DPI scale factor is correctly reported by the display server.
