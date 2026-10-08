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

    case 'get_system_info':
      return Promise.resolve({
        cpu: {
          vendor: 'GenuineIntel',
          model: '12th Gen Intel(R) Core(TM) i7-12700H',
          architecture: 'x86_64',
          logical_cores: 16,
          physical_cores: 12,
          frequency_mhz: 2700,
          usage_percent: 24.5,
        },
        memory: {
          total_bytes: 17179869184,
          available_bytes: 10737418240,
          used_bytes: 6442450944,
          swap_total_bytes: 4294967296,
          swap_used_bytes: 1073741824,
          total_mb: 16384,
          available_mb: 10240,
          used_mb: 6144,
          swap_total_mb: 4096,
          swap_used_mb: 1024,
          usage_percent: 37.5,
        },
        gpu: {
          name: 'Intel Graphics (i915)',
          vendor: 'Intel',
          renderer: 'i915',
          is_discrete: false,
          vram_mb: null,
          driver: 'i915',
          status: 'DETECTED',
        },
        disk: {
          root: {
            mount_point: '/',
            name: '/dev/nvme0n1p2',
            filesystem: 'ext4',
            total_space_bytes: 536870912000,
            available_space_bytes: 322122547200,
            total_space_gb: 500.0,
            available_space_gb: 300.0,
          },
          mounts: [],
        },
        display: {
          session_type: 'wayland',
          monitor_count: 1,
          primary_resolution: '1920x1080',
          refresh_rate_hz: 60,
          scale_factor: 1.0,
          monitors: [],
          status: 'DETECTED',
        },
        power: {
          source: 'AC',
          is_charging: true,
          battery_percentage: 95,
          status_text: 'Charging',
          auto_power_save_recommended: false,
        },
        os: {
          distro_name: 'Arch Linux',
          kernel_version: '6.8.9-arch1-1',
          os_name: 'Linux',
          host_name: 'workstation',
          arch: 'x86_64',
        },
        session: {
          compositor: 'Sway',
          session_type: 'wayland',
          desktop_environment: 'sway',
          is_wayland: true,
          socket_path: null,
        },
        network: {
          is_online: true,
          primary_interface: 'wlan0',
          interfaces: [],
        },
        processes: {
          total_processes: 215,
          running_processes: 2,
          system_load_1m: 1.12,
          system_load_5m: 1.05,
          system_load_15m: 0.98,
        },
        recommended_profile: 'BALANCED',
        active_profile: 'BALANCED',
        is_low_spec: false,
      } as unknown as T);

    case 'get_system_report':
      return Promise.resolve(
        'LULU DESKTOP — SYSTEM & HARDWARE REPORT\nOS: Arch Linux\nCPU: Intel Core i7 (16 cores)\nRAM: 16384 MB (6144 MB used)\nGPU: Intel Graphics' as unknown as T
      );

    default:
      return Promise.resolve(null as unknown as T);
  }
}
