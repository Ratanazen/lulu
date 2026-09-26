use std::sync::Arc;
use crate::performance::PerformanceService;
use crate::storage::StorageService;
use crate::system::SystemService;

pub struct AppState {
    pub storage: Arc<StorageService>,
    pub system: Arc<SystemService>,
    pub performance: Arc<PerformanceService>,
}

