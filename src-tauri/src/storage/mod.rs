use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupData {
    pub version: u32,
    pub created_at: String,
    pub kv_pairs: Vec<(String, String)>,
    pub settings: Vec<(String, String)>,
    pub achievements: Vec<(String, String, i64)>,
    pub game_records: Vec<(String, i64, i64, String)>,
}

pub struct StorageService {
    conn: Mutex<Connection>,
    _db_path: PathBuf,
}

impl StorageService {
    pub fn new(path: &Path) -> Result<Self, String> {
        let conn = Connection::open(path).map_err(|e| e.to_string())?;
        let service = Self {
            conn: Mutex::new(conn),
            _db_path: path.to_path_buf(),
        };
        service.migrate()?;
        Ok(service)
    }

    fn migrate(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )",
            [],
        )
        .map_err(|e| e.to_string())?;

        let mut stmt = conn
            .prepare("SELECT MAX(version) FROM schema_migrations")
            .map_err(|e| e.to_string())?;
        let current_version: Option<u32> = stmt
            .query_row([], |row| row.get(0))
            .unwrap_or(None);

        let v = current_version.unwrap_or(0);

        if v < 1 {
            conn.execute_batch(
                "CREATE TABLE IF NOT EXISTS kv_store (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS achievements (
                    id TEXT PRIMARY KEY,
                    unlocked_at TEXT NOT NULL,
                    progress INTEGER NOT NULL DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS game_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    game_id TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    high_score INTEGER NOT NULL,
                    played_at TEXT NOT NULL
                );
                INSERT INTO schema_migrations (version, applied_at) 
                VALUES (1, datetime('now'));",
            )
            .map_err(|e| e.to_string())?;
        }

        Ok(())
    }

    pub fn set_kv(&self, key: &str, val: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO kv_store (key, value, updated_at) 
             VALUES (?1, ?2, datetime('now'))
             ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = datetime('now')",
            params![key, val],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_kv(&self, key: &str) -> Result<Option<String>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT value FROM kv_store WHERE key = ?1")
            .map_err(|e| e.to_string())?;
        let res = stmt.query_row(params![key], |row| row.get(0));
        match res {
            Ok(val) => Ok(Some(val)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    pub fn export_backup(&self) -> Result<String, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;

        let mut kv_stmt = conn.prepare("SELECT key, value FROM kv_store").map_err(|e| e.to_string())?;
        let kv_pairs: Vec<(String, String)> = kv_stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let mut set_stmt = conn.prepare("SELECT key, value FROM settings").map_err(|e| e.to_string())?;
        let settings: Vec<(String, String)> = set_stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let mut ach_stmt = conn.prepare("SELECT id, unlocked_at, progress FROM achievements").map_err(|e| e.to_string())?;
        let achievements: Vec<(String, String, i64)> = ach_stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let mut gm_stmt = conn.prepare("SELECT game_id, score, high_score, played_at FROM game_records").map_err(|e| e.to_string())?;
        let game_records: Vec<(String, i64, i64, String)> = gm_stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let backup = BackupData {
            version: 1,
            created_at: chrono::Utc::now().to_rfc3339(),
            kv_pairs,
            settings,
            achievements,
            game_records,
        };

        serde_json::to_string_pretty(&backup).map_err(|e| e.to_string())
    }

    pub fn import_backup(&self, backup_json: &str) -> Result<(), String> {
        let backup: BackupData = serde_json::from_str(backup_json).map_err(|e| format!("Invalid backup JSON: {}", e))?;
        let mut conn = self.conn.lock().map_err(|e| e.to_string())?;

        let tx = conn.transaction().map_err(|e| e.to_string())?;

        // Restore KV
        for (k, v) in backup.kv_pairs {
            tx.execute(
                "INSERT INTO kv_store (key, value, updated_at) 
                 VALUES (?1, ?2, datetime('now'))
                 ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = datetime('now')",
                params![k, v],
            )
            .map_err(|e| e.to_string())?;
        }

        // Restore Settings
        for (k, v) in backup.settings {
            tx.execute(
                "INSERT INTO settings (key, value) VALUES (?1, ?2)
                 ON CONFLICT(key) DO UPDATE SET value = ?2",
                params![k, v],
            )
            .map_err(|e| e.to_string())?;
        }

        // Restore Achievements
        for (id, unlocked_at, prog) in backup.achievements {
            tx.execute(
                "INSERT INTO achievements (id, unlocked_at, progress) VALUES (?1, ?2, ?3)
                 ON CONFLICT(id) DO UPDATE SET unlocked_at = ?2, progress = ?3",
                params![id, unlocked_at, prog],
            )
            .map_err(|e| e.to_string())?;
        }

        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_storage_lifecycle_and_backup() {
        let storage = StorageService::new(Path::new(":memory:")).expect("Init in-memory db");

        // Test set and get
        storage.set_kv("character_mood", "happy").unwrap();
        let val = storage.get_kv("character_mood").unwrap();
        assert_eq!(val, Some("happy".to_string()));

        // Test non-existent key
        let missing = storage.get_kv("non_existent").unwrap();
        assert_eq!(missing, None);

        // Test backup export
        let backup_json = storage.export_backup().unwrap();
        assert!(backup_json.contains("character_mood"));
        assert!(backup_json.contains("happy"));

        // Test restore in another instance
        let storage2 = StorageService::new(Path::new(":memory:")).expect("Init second db");
        storage2.import_backup(&backup_json).unwrap();
        assert_eq!(storage2.get_kv("character_mood").unwrap(), Some("happy".to_string()));
    }
}
