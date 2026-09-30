// Safe Tauri invoke bridge with web/test mocks

export async function invokeCommand<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<T>(cmd, args);
    } catch (e) {
      console.error(`[TauriBridge] Error invoking ${cmd}:`, e);
      throw e;
    }
  }

  // Fallback for test/browser environments
  return mockInvoke<T>(cmd, args);
}

export async function listenEvent<T>(event: string, handler: (payload: T) => void): Promise<() => void> {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const { listen } = await import('@tauri-apps/api/event');
      return await listen<T>(event, (ev) => handler(ev.payload));
    } catch (e) {
      console.error(`[TauriBridge] Error listening to ${event}:`, e);
    }
  }
  return () => {};
}

function mockInvoke<T>(cmd: string, _args?: Record<string, unknown>): Promise<T> {
  switch (cmd) {
    case 'get_pet_preferences':
      return Promise.resolve({
        scale: 1.0,
        theme: 'Lulu Dark',
        character_style: 'shadow_shinobi',
        behavior_mode: 'NORMAL',
        wander_speed: 1.0,
        speech_enabled: true,
        sound_volume: 0.8,
        always_on_top: true,
        fps_limit: 60,
      } as unknown as T);

    case 'get_pet_needs_mood':
      return Promise.resolve({
        energy: 100,
        happiness: 90,
        fun: 85,
        mood: 'calm',
        home_x: 100,
        home_y: 100,
        last_interaction_ts: Date.now(),
      } as unknown as T);

    case 'get_monitors':
      return Promise.resolve([
        {
          name: 'eDP-1',
          width: 1920,
          height: 1080,
          scale_factor: 1.0,
          is_primary: true,
        },
      ] as unknown as T);

    case 'get_music_status':
      return Promise.resolve({
        player: 'None',
        title: '',
        artist: '',
        album: '',
        playback_status: 'NoPlayer',
        position_secs: 0,
        duration_secs: 0,
        can_control: false,
      } as unknown as T);

    case 'get_capabilities':
      return Promise.resolve({
        display_server: 'Wayland',
        session_type: 'wayland',
        desktop_env: 'GNOME',
        items: [
          { name: 'D-Bus Session Bus', status: 'SUPPORTED', reason: 'Active session bus connected' },
          { name: 'Notification Companion (D-Bus)', status: 'SUPPORTED', reason: 'Available via dbus-monitor' },
          { name: 'Music / MPRIS Control', status: 'SUPPORTED', reason: 'playerctl available' },
          { name: 'Local LRC Lyrics Engine', status: 'SUPPORTED', reason: 'Offline local parser' },
        ],
      } as unknown as T);

    default:
      return Promise.resolve(null as unknown as T);
  }
}
