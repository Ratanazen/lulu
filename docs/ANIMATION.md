# Animation Engine & Pixel Renderer

## 1. Overview

Lulu uses a procedural pixel-art renderer that generates crisp companion frames directly onto an HTML5 Canvas.
- **Integer Scaling**: Pixel rendering uses `imageSmoothingEnabled = false` for authentic retro nearest-neighbor fidelity.
- **Dynamic Palette Coloring**: Uses the active character's color palette (primary, secondary, accent, shadow, glow) without needing static raster sprite files.
- **Zero Assets Overhead**: 100% offline, instant load time, resolution-independent.

## 2. Animation States

The companion includes definitions for:
- `idle`: Gentle breathing, ear floating, and periodic blinking.
- `walk`: Alternating foot steps and vertical bobbing.
- `run`: Leaned forward posture with rapid feet cycle.
- `sit`: Resting tucked paws.
- `sleep`: Closed eyes, relaxed pose, and floating "zZz" starlight bubbles.
- `curious`: Perked ears and tilted head.
- `happy`: Joyful crescent eyes, blush cheeks, and bounce.
- `excited`: Sparkling star eyes and energetic hop.
- `celebrate`: Star burst confetti and victory jump.
- `wave`: Raised waving paw greeting.
- `jump`: Leaping upward with spread paws.
- `dance`: Side-to-side rhythmic waddle and floating music notes.
- `eat`: Nibbling on star treats.

## 3. Frame Pacing

Each animation defines:
- `frames`: Total count of logical frames.
- `fps`: Frame playback rate (e.g. 4 to 12 FPS).
- `loopMode`: `loop`, `once`, or `ping-pong`.
- `priority` & `interruptible`: Governs animation preemption when events occur.
