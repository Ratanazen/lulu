use serde::{Deserialize, Serialize};
use sysinfo::Networks;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterfaceInfo {
    pub name: String,
    pub received_bytes: u64,
    pub transmitted_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInfo {
    pub is_online: bool,
    pub primary_interface: String,
    pub interfaces: Vec<NetworkInterfaceInfo>,
}

impl NetworkInfo {
    pub fn probe() -> Self {
        let networks = Networks::new_with_refreshed_list();
        let mut interfaces = Vec::new();
        let mut primary = "None".to_string();
        let mut max_traffic = 0;

        for (name, data) in &networks {
            let rx = data.total_received();
            let tx = data.total_transmitted();
            let total = rx + tx;

            if total > max_traffic && name != "lo" {
                max_traffic = total;
                primary = name.clone();
            }

            interfaces.push(NetworkInterfaceInfo {
                name: name.clone(),
                received_bytes: rx,
                transmitted_bytes: tx,
            });
        }

        let is_online = max_traffic > 0 || interfaces.iter().any(|i| i.name.starts_with("wlan") || i.name.starts_with("eth"));

        Self {
            is_online,
            primary_interface: primary,
            interfaces,
        }
    }
}
