use serde::{Deserialize, Serialize};
use sysinfo::Disks;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskMountInfo {
    pub mount_point: String,
    pub name: String,
    pub filesystem: String,
    pub total_space_bytes: u64,
    pub available_space_bytes: u64,
    pub total_space_gb: f64,
    pub available_space_gb: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    pub root: Option<DiskMountInfo>,
    pub mounts: Vec<DiskMountInfo>,
}

impl DiskInfo {
    pub fn probe() -> Self {
        let disks = Disks::new_with_refreshed_list();
        let mut mounts = Vec::new();
        let mut root = None;

        for disk in &disks {
            let mp = disk.mount_point().to_string_lossy().to_string();
            let total = disk.total_space();
            let avail = disk.available_space();
            let total_gb = (total as f64) / (1024.0 * 1024.0 * 1024.0);
            let avail_gb = (avail as f64) / (1024.0 * 1024.0 * 1024.0);

            let fs_type = disk.file_system().to_string_lossy().to_string();
            let name = disk.name().to_string_lossy().to_string();

            let mount_info = DiskMountInfo {
                mount_point: mp.clone(),
                name,
                filesystem: fs_type,
                total_space_bytes: total,
                available_space_bytes: avail,
                total_space_gb: (total_gb * 10.0).round() / 10.0,
                available_space_gb: (avail_gb * 10.0).round() / 10.0,
            };

            if mp == "/" {
                root = Some(mount_info.clone());
            }

            mounts.push(mount_info);
        }

        Self { root, mounts }
    }
}
