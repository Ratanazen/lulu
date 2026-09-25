# Plugin Extension API

## 1. Overview

Lulu supports safe client-side and native plugins via a sandboxed permission architecture. Plugins must declare their capabilities explicitly in a manifest.

## 2. Manifest Schema

```json
{
  "id": "my-custom-plugin",
  "name": "My Custom Plugin",
  "version": "1.0.0",
  "author": "Developer",
  "description": "Custom enhancement for Lulu.",
  "permissions": [
    "UI",
    "character",
    "games",
    "notifications",
    "storage"
  ],
  "entryPoint": "index.js"
}
```

## 3. Permission Boundaries

- `UI`: Allows registering buttons or widgets in the Control Center.
- `character`: Allows custom skins, color palettes, and animation frames.
- `games`: Mounts custom games using `IGameInstance`.
- `notifications`: Triggers speech bubbles and in-app alerts.
- `storage`: Provides key-value isolated storage inside Lulu's SQLite database.
- `music`: Listens to playback events.
- `system`: Read-only access to system metrics.
