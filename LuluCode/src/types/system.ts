export type PerformanceProfile =
  | 'AUTO'
  | 'POWER_SAVER'
  | 'VERY_LOW'
  | 'LOW'
  | 'BALANCED'
  | 'HIGH'
  | 'CUSTOM';

export interface CpuInfo {
  vendor: string;
  model: string;
  architecture: string;
  logical_cores: number;
  physical_cores: number;
  frequency_mhz: number;
  usage_percent: number;
}

export interface MemoryInfo {
  total_bytes: number;
  available_bytes: number;
  used_bytes: number;
  swap_total_bytes: number;
  swap_used_bytes: number;
  total_mb: number;
  available_mb: number;
  used_mb: number;
  swap_total_mb: number;
  swap_used_mb: number;
}

export interface GpuInfo {
  name: string;
  vendor: string;
  renderer: string;
  is_discrete: boolean;
  vram_mb?: number | null;
  driver: string;
  status: 'DETECTED' | 'UNSUPPORTED';
}

export interface DiskMountInfo {
  mount_point: string;
  name: string;
  filesystem: string;
  total_space_bytes: number;
  available_space_bytes: number;
  total_space_gb: number;
  available_space_gb: number;
}

export interface DiskInfo {
  root?: DiskMountInfo | null;
  mounts: DiskMountInfo[];
}

export interface MonitorInfo {
  name: string;
  width: number;
  height: number;
  refresh_rate_hz: number;
  scale_factor: number;
  is_primary: boolean;
}

export interface DisplayInfo {
  session_type: string;
  monitor_count: number;
  primary_resolution: string;
  refresh_rate_hz: number;
  scale_factor: number;
  monitors: MonitorInfo[];
  status: string;
}

export interface PowerInfo {
  source: string;
  is_charging: boolean;
  battery_percentage?: number | null;
  status_text: string;
  auto_power_save_recommended: boolean;
}

export interface OsInfo {
  distro_name: string;
  kernel_version: string;
  os_name: string;
  host_name: string;
  arch: string;
}

export interface SessionInfo {
  compositor: string;
  session_type: string;
  desktop_environment: string;
  is_wayland: boolean;
  socket_path?: string | null;
}

export interface NetworkInterfaceInfo {
  name: string;
  received_bytes: number;
  transmitted_bytes: number;
}

export interface NetworkInfo {
  is_online: boolean;
  primary_interface: string;
  interfaces: NetworkInterfaceInfo[];
}

export interface ProcessSummary {
  total_processes: number;
  running_processes: number;
  system_load_1m: number;
  system_load_5m: number;
  system_load_15m: number;
}

export interface ComprehensiveSystemInfo {
  cpu: CpuInfo;
  memory: MemoryInfo;
  gpu: GpuInfo;
  disk: DiskInfo;
  display: DisplayInfo;
  power: PowerInfo;
  os: OsInfo;
  session: SessionInfo;
  network: NetworkInfo;
  processes: ProcessSummary;
  recommended_profile: PerformanceProfile;
  active_profile: PerformanceProfile;
  is_low_spec: boolean;
}
