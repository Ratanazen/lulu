# Movement Engine

## 1. Principles

1. **Real Native Window Movement**: Movement is applied to the OS window via `DesktopWindowService.setPosition(x, y)`, never simulated with CSS offsets or fake fullscreen webviews.
2. **Physics Independence**: Movement tick runs independently from animation rendering.
3. **Multi-Monitor Geometry**: Coordinates support multiple screens, portrait monitors, differing DPI scale factors, and negative monitor coordinates.

## 2. Modes

- `walkTo(target)`: Moves towards target at configurable `walkSpeed` (default 100 px/s).
- `runTo(target)`: Moves towards target at configurable `runSpeed` (default 220 px/s).
- `wander()`: Picks a random safe coordinate within the work area of the active monitor and initiates a stroll.
- `goHome()`: Directs the companion back to user-defined home coordinates.
- `followCursor(pos)`: Follows cursor at a friendly offset.
- `stop()`: Halts movement, resets velocity, and transitions companion to `idle`.

## 3. Boundary Clamping

The `MovementBounds` Rust module and TypeScript `clampToMonitors` function identify the containing or closest monitor and clamp destination coordinates within `[workAreaX + padding, workAreaWidth - windowWidth - padding]`. This guarantees the companion never drifts off-screen.
