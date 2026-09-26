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

#[derive(Debug, Serialize, Deserialize)]
pub struct ConversationRecord {
    pub id: String,
    pub title: String,
    pub provider_id: String,
    pub model: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageRecord {
    pub id: String,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub tool_calls_json: String,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MemoryRecord {
    pub id: String,
    pub title: String,
    pub content: String,
    pub category: String,
    pub importance: i32,
    pub user_defined: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameHighScore {
    pub game_id: String,
    pub high_score: i64,
    pub total_plays: i64,
    pub last_played: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationRecord {
    pub id: String,
    pub app_name: String,
    pub title: String,
    pub body: String,
    pub icon: String,
    pub received_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AchievementRecord {
    pub id: String,
    pub unlocked_at: String,
    pub progress: i64,
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

        if v < 2 {
            conn.execute_batch(
                "CREATE TABLE IF NOT EXISTS characters (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    personality TEXT NOT NULL DEFAULT '{}',
                    voice TEXT NOT NULL DEFAULT '{}',
                    renderer TEXT NOT NULL DEFAULT 'pixel',
                    model_path TEXT NOT NULL DEFAULT '',
                    appearance TEXT NOT NULL DEFAULT '{}',
                    expressions TEXT NOT NULL DEFAULT '[]',
                    animations TEXT NOT NULL DEFAULT '[]',
                    outfit TEXT NOT NULL DEFAULT 'default',
                    accessories TEXT NOT NULL DEFAULT '[]',
                    colors TEXT NOT NULL DEFAULT '{}',
                    scale REAL NOT NULL DEFAULT 1.0,
                    behavior TEXT NOT NULL DEFAULT '{}',
                    permissions TEXT NOT NULL DEFAULT '[]',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS character_presets (
                    id TEXT PRIMARY KEY,
                    character_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    config_json TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    provider_id TEXT NOT NULL,
                    model TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    tool_calls_json TEXT NOT NULL DEFAULT '[]',
                    timestamp INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS memories (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'fact',
                    importance INTEGER NOT NULL DEFAULT 3,
                    user_defined INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS providers (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    base_url TEXT NOT NULL DEFAULT '',
                    enabled INTEGER NOT NULL DEFAULT 1,
                    config_json TEXT NOT NULL DEFAULT '{}'
                );
                CREATE TABLE IF NOT EXISTS models (
                    id TEXT PRIMARY KEY,
                    provider_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    context_limit INTEGER NOT NULL DEFAULT 4096,
                    temperature REAL NOT NULL DEFAULT 0.7,
                    is_default INTEGER NOT NULL DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS capability_preferences (
                    capability_id TEXT PRIMARY KEY,
                    user_enabled INTEGER NOT NULL DEFAULT 0,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS notification_preferences (
                    app_whitelist_json TEXT NOT NULL DEFAULT '[]',
                    read_body_enabled INTEGER NOT NULL DEFAULT 0,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS oauth_accounts (
                    provider TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    scopes TEXT NOT NULL,
                    expires_at INTEGER NOT NULL DEFAULT 0,
                    updated_at TEXT NOT NULL
                );
                INSERT INTO schema_migrations (version, applied_at) 
                VALUES (2, datetime('now'));",
            )
            .map_err(|e| e.to_string())?;
        }

        if v < 3 {
            conn.execute_batch(
                "CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL,
                    email TEXT NOT NULL,
                    auth_type TEXT NOT NULL DEFAULT 'local',
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS character_assets (
                    id TEXT PRIMARY KEY,
                    character_id TEXT NOT NULL,
                    asset_type TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    hash TEXT NOT NULL DEFAULT ''
                );
                CREATE TABLE IF NOT EXISTS character_animations (
                    id TEXT PRIMARY KEY,
                    character_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    config_json TEXT NOT NULL DEFAULT '{}',
                    duration REAL NOT NULL DEFAULT 1.0
                );
                CREATE TABLE IF NOT EXISTS character_expressions (
                    id TEXT PRIMARY KEY,
                    character_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    config_json TEXT NOT NULL DEFAULT '{}'
                );
                CREATE TABLE IF NOT EXISTS character_voices (
                    id TEXT PRIMARY KEY,
                    character_id TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    voice_id TEXT NOT NULL,
                    config_json TEXT NOT NULL DEFAULT '{}'
                );
                CREATE TABLE IF NOT EXISTS agents (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    role TEXT NOT NULL,
                    system_prompt TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    model TEXT NOT NULL,
                    enabled INTEGER NOT NULL DEFAULT 1
                );
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    agent_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    input TEXT NOT NULL,
                    output TEXT NOT NULL DEFAULT '',
                    created_at INTEGER NOT NULL,
                    completed_at INTEGER
                );
                CREATE TABLE IF NOT EXISTS permissions (
                    id TEXT PRIMARY KEY,
                    category TEXT NOT NULL,
                    granted INTEGER NOT NULL DEFAULT 0,
                    scope TEXT NOT NULL DEFAULT '',
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS capabilities (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    status TEXT NOT NULL,
                    details_json TEXT NOT NULL DEFAULT '{}'
                );
                CREATE TABLE IF NOT EXISTS notifications (
                    id TEXT PRIMARY KEY,
                    app_name TEXT NOT NULL,
                    title TEXT NOT NULL,
                    body TEXT NOT NULL DEFAULT '',
                    icon TEXT NOT NULL DEFAULT '',
                    received_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS music (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    artist TEXT NOT NULL DEFAULT '',
                    album TEXT NOT NULL DEFAULT '',
                    duration REAL NOT NULL DEFAULT 0.0,
                    lrc_path TEXT NOT NULL DEFAULT '',
                    played_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS games (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    category TEXT NOT NULL,
                    high_score INTEGER NOT NULL DEFAULT 0,
                    plays_count INTEGER NOT NULL DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS workspace_profiles (
                    id TEXT PRIMARY KEY,
                    root_path TEXT NOT NULL,
                    name TEXT NOT NULL,
                    active INTEGER NOT NULL DEFAULT 1,
                    config_json TEXT NOT NULL DEFAULT '{}'
                );
                CREATE TABLE IF NOT EXISTS logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    level TEXT NOT NULL,
                    module TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                INSERT INTO schema_migrations (version, applied_at) 
                VALUES (3, datetime('now'));",
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
        crate::performance::PerformanceMonitor::increment_db_write();
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

    pub fn get_all_settings(&self) -> Result<Vec<(String, String)>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare("SELECT key, value FROM settings").map_err(|e| e.to_string())?;
        let settings = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        Ok(settings)
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2",
            params![key, value],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1").map_err(|e| e.to_string())?;
        let res = stmt.query_row(params![key], |row| row.get(0));
        match res {
            Ok(val) => Ok(Some(val)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    }

    pub fn set_settings_bulk(&self, settings: &[(String, String)]) -> Result<(), String> {
        let mut conn = self.conn.lock().map_err(|e| e.to_string())?;
        let tx = conn.transaction().map_err(|e| e.to_string())?;
        for (k, v) in settings {
            tx.execute(
                "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2",
                params![k, v],
            )
            .map_err(|e| e.to_string())?;
        }
        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_conversations(&self, limit: usize, offset: usize) -> Result<Vec<ConversationRecord>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare("SELECT id, title, provider_id, model, created_at, updated_at FROM conversations ORDER BY created_at DESC LIMIT ?1 OFFSET ?2").map_err(|e| e.to_string())?;
        let items = stmt
            .query_map(params![limit, offset], |row| {
                Ok(ConversationRecord {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    provider_id: row.get(2)?,
                    model: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        Ok(items)
    }

    pub fn create_conversation(&self, id: &str, title: &str, provider_id: &str, model: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO conversations (id, title, provider_id, model, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, datetime('now'), datetime('now'))",
            params![id, title, provider_id, model],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_conversation(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM conversations WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM messages WHERE conversation_id = ?1", params![id]).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_messages(&self, conversation_id: &str, limit: usize) -> Result<Vec<MessageRecord>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare("SELECT id, conversation_id, role, content, tool_calls_json, timestamp FROM messages WHERE conversation_id = ?1 ORDER BY timestamp ASC LIMIT ?2").map_err(|e| e.to_string())?;
        let items = stmt
            .query_map(params![conversation_id, limit], |row| {
                Ok(MessageRecord {
                    id: row.get(0)?,
                    conversation_id: row.get(1)?,
                    role: row.get(2)?,
                    content: row.get(3)?,
                    tool_calls_json: row.get(4)?,
                    timestamp: row.get(5)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        Ok(items)
    }

    pub fn save_message(&self, id: &str, conversation_id: &str, role: &str, content: &str, tool_calls_json: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let timestamp = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "INSERT INTO messages (id, conversation_id, role, content, tool_calls_json, timestamp) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, conversation_id, role, content, tool_calls_json, timestamp],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_memories(&self, search: Option<&str>, category: Option<&str>) -> Result<Vec<MemoryRecord>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut query = "SELECT id, title, content, category, importance, user_defined, created_at FROM memories WHERE 1=1".to_string();
        let mut p: Vec<&dyn rusqlite::ToSql> = Vec::new();
        let s_val: String;
        let c_val: String;

        if let Some(s) = search {
            s_val = format!("%{}%", s);
            query.push_str(" AND (title LIKE ? OR content LIKE ?)");
            p.push(&s_val);
            p.push(&s_val);
        }
        if let Some(c) = category {
            c_val = c.to_string();
            query.push_str(if search.is_some() { " AND category = ?" } else { " AND category = ?1" });
            p.push(&c_val);
        }
        
        query.push_str(" ORDER BY created_at DESC");

        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
        let items = stmt
            .query_map(rusqlite::params_from_iter(p.into_iter()), |row| {
                Ok(MemoryRecord {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content: row.get(2)?,
                    category: row.get(3)?,
                    importance: row.get(4)?,
                    user_defined: row.get::<_, i32>(5)? != 0,
                    created_at: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        Ok(items)
    }

    pub fn save_memory(&self, id: &str, title: &str, content: &str, category: &str, importance: i32, user_defined: bool) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let user_def = if user_defined { 1 } else { 0 };
        conn.execute(
            "INSERT INTO memories (id, title, content, category, importance, user_defined, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))
             ON CONFLICT(id) DO UPDATE SET title = ?2, content = ?3, category = ?4, importance = ?5, user_defined = ?6",
            params![id, title, content, category, importance, user_def],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_memory(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM memories WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_game_high_scores(&self) -> Result<Vec<GameHighScore>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare("SELECT game_id, max(high_score), count(*), max(played_at) FROM game_records GROUP BY game_id").map_err(|e| e.to_string())?;
        let items = stmt
            .query_map([], |row| {
                Ok(GameHighScore {
                    game_id: row.get(0)?,
                    high_score: row.get(1)?,
                    total_plays: row.get(2)?,
                    last_played: row.get(3)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        Ok(items)
    }

    pub fn save_game_record(&self, game_id: &str, score: i64) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        // get previous high score
        let mut stmt = conn.prepare("SELECT max(high_score) FROM game_records WHERE game_id = ?1").map_err(|e| e.to_string())?;
        let prev_high: Option<i64> = stmt.query_row(params![game_id], |row| row.get(0)).unwrap_or(None);
        let current_high = std::cmp::max(prev_high.unwrap_or(0), score);
        
        conn.execute(
            "INSERT INTO game_records (game_id, score, high_score, played_at) VALUES (?1, ?2, ?3, datetime('now'))",
            params![game_id, score, current_high],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_recent_notifications(&self, limit: usize) -> Result<Vec<NotificationRecord>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare("SELECT id, app_name, title, body, icon, received_at FROM notifications ORDER BY received_at DESC LIMIT ?1").map_err(|e| e.to_string())?;
        let items = stmt
            .query_map(params![limit], |row| {
                Ok(NotificationRecord {
                    id: row.get(0)?,
                    app_name: row.get(1)?,
                    title: row.get(2)?,
                    body: row.get(3)?,
                    icon: row.get(4)?,
                    received_at: row.get(5)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        Ok(items)
    }

    pub fn save_notification(&self, id: &str, app_name: &str, title: &str, body: &str, icon: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let ts = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "INSERT INTO notifications (id, app_name, title, body, icon, received_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, app_name, title, body, icon, ts],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn prune_old_notifications(&self, keep_count: usize) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "DELETE FROM notifications WHERE id NOT IN (SELECT id FROM notifications ORDER BY received_at DESC LIMIT ?1)",
            params![keep_count],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_achievements(&self) -> Result<Vec<AchievementRecord>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare("SELECT id, unlocked_at, progress FROM achievements").map_err(|e| e.to_string())?;
        let items = stmt
            .query_map([], |row| {
                Ok(AchievementRecord {
                    id: row.get(0)?,
                    unlocked_at: row.get(1)?,
                    progress: row.get(2)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        Ok(items)
    }

    pub fn unlock_achievement(&self, id: &str, progress: i64) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO achievements (id, unlocked_at, progress) VALUES (?1, datetime('now'), ?2)
             ON CONFLICT(id) DO UPDATE SET progress = ?2, unlocked_at = CASE WHEN ?2 > progress THEN datetime('now') ELSE unlocked_at END",
            params![id, progress],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
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

    #[test]
    fn test_migration_v3_creates_all_tables() {
        let storage = StorageService::new(Path::new(":memory:")).expect("Init in-memory db");
        let conn = storage.conn.lock().unwrap();

        let required_tables = vec![
            "users", "settings", "characters", "character_assets", "character_animations",
            "character_expressions", "character_voices", "character_presets", "agents",
            "providers", "models", "tasks", "conversations", "messages", "memories",
            "permissions", "capabilities", "notifications", "music", "games",
            "workspace_profiles", "logs",
        ];

        for table in required_tables {
            let query = format!("SELECT count(*) FROM {}", table);
            let count: Result<i64, _> = conn.query_row(&query, [], |row| row.get(0));
            assert!(count.is_ok(), "Table {} should exist and be queryable", table);
        }
    }

    #[test]
    fn test_conversations_and_messages() {
        let storage = StorageService::new(Path::new(":memory:")).expect("Init db");
        
        storage.create_conversation("c1", "Test Chat", "openai", "gpt-4").unwrap();
        let convs = storage.get_conversations(10, 0).unwrap();
        assert_eq!(convs.len(), 1);
        assert_eq!(convs[0].id, "c1");

        storage.save_message("m1", "c1", "user", "Hello", "[]").unwrap();
        let msgs = storage.get_messages("c1", 10).unwrap();
        assert_eq!(msgs.len(), 1);
        assert_eq!(msgs[0].content, "Hello");

        storage.delete_conversation("c1").unwrap();
        assert_eq!(storage.get_conversations(10, 0).unwrap().len(), 0);
        assert_eq!(storage.get_messages("c1", 10).unwrap().len(), 0);
    }

    #[test]
    fn test_settings() {
        let storage = StorageService::new(Path::new(":memory:")).expect("Init db");
        
        storage.set_setting("theme", "dark").unwrap();
        assert_eq!(storage.get_setting("theme").unwrap(), Some("dark".to_string()));

        storage.set_settings_bulk(&[("font".to_string(), "14".to_string()), ("sound".to_string(), "on".to_string())]).unwrap();
        let all = storage.get_all_settings().unwrap();
        assert_eq!(all.len(), 3);
    }
}
