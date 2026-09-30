use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use crate::notifications::{NotificationItem, NotificationSettings};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PetPreferences {
    pub scale: f32,
    pub theme: String,
    pub character_style: String,
    pub behavior_mode: String,
    pub wander_speed: f32,
    pub speech_enabled: bool,
    pub sound_volume: f32,
    pub always_on_top: bool,
    pub fps_limit: u32,
}

impl Default for PetPreferences {
    fn default() -> Self {
        Self {
            scale: 1.0,
            theme: "Lulu Dark".to_string(),
            character_style: "shadow_shinobi".to_string(),
            behavior_mode: "NORMAL".to_string(),
            wander_speed: 1.0,
            speech_enabled: true,
            sound_volume: 0.8,
            always_on_top: true,
            fps_limit: 60,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PetNeedsMood {
    pub energy: f32,
    pub happiness: f32,
    pub fun: f32,
    pub mood: String,
    pub home_x: i32,
    pub home_y: i32,
    pub last_interaction_ts: i64,
}

impl Default for PetNeedsMood {
    fn default() -> Self {
        Self {
            energy: 100.0,
            happiness: 90.0,
            fun: 85.0,
            mood: "calm".to_string(),
            home_x: 100,
            home_y: 100,
            last_interaction_ts: chrono::Utc::now().timestamp(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PetPosition {
    pub monitor_id: String,
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserDataExport {
    pub version: String,
    pub timestamp: i64,
    pub preferences: PetPreferences,
    pub needs_mood: PetNeedsMood,
    pub position: PetPosition,
    pub notification_settings: NotificationSettings,
}

pub struct StorageManager {
    db_path: PathBuf,
}

impl StorageManager {
    pub fn new() -> Result<Self, String> {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        let dir = PathBuf::from(home).join(".local/share/lulu-desktop");
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

        let db_path = dir.join("lulu.db");
        let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

        // Versioned Schema Migrations
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY
            );

            -- 001_initial: Preferences & Needs
            CREATE TABLE IF NOT EXISTS preferences (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                scale REAL NOT NULL,
                theme TEXT NOT NULL,
                character_style TEXT NOT NULL DEFAULT 'shadow_shinobi',
                behavior_mode TEXT NOT NULL,
                wander_speed REAL NOT NULL,
                speech_enabled INTEGER NOT NULL,
                sound_volume REAL NOT NULL,
                always_on_top INTEGER NOT NULL,
                fps_limit INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS needs_mood (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                energy REAL NOT NULL,
                happiness REAL NOT NULL,
                fun REAL NOT NULL,
                mood TEXT NOT NULL,
                home_x INTEGER NOT NULL,
                home_y INTEGER NOT NULL,
                last_interaction_ts INTEGER NOT NULL
            );

            -- 002_pet_position
            CREATE TABLE IF NOT EXISTS pet_position (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                monitor_id TEXT NOT NULL,
                x INTEGER NOT NULL,
                y INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            -- 003_notifications
            CREATE TABLE IF NOT EXISTS notification_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                listener_enabled INTEGER NOT NULL DEFAULT 1,
                show_app_name INTEGER NOT NULL DEFAULT 1,
                show_title INTEGER NOT NULL DEFAULT 1,
                show_body INTEGER NOT NULL DEFAULT 0,
                sound INTEGER NOT NULL DEFAULT 0,
                privacy_mode INTEGER NOT NULL DEFAULT 1,
                cooldown_ms INTEGER NOT NULL DEFAULT 2000
            );

            CREATE TABLE IF NOT EXISTS notification_history (
                id TEXT PRIMARY KEY,
                app_name TEXT NOT NULL,
                title TEXT NOT NULL,
                body TEXT,
                timestamp INTEGER NOT NULL
            );

            -- 004_lyrics_metadata
            CREATE TABLE IF NOT EXISTS lyrics_metadata (
                filename TEXT PRIMARY KEY,
                title TEXT,
                artist TEXT,
                album TEXT,
                offset_ms INTEGER DEFAULT 0,
                imported_at INTEGER NOT NULL
            );

            -- 005_logs
            CREATE TABLE IF NOT EXISTS system_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp INTEGER NOT NULL
            );
            ",
        )
        .map_err(|e| e.to_string())?;

        // Ensure safe schema upgrades
        let _ = conn.execute("ALTER TABLE preferences ADD COLUMN character_style TEXT DEFAULT 'shadow_shinobi'", []);
        let _ = conn.execute("DROP TABLE IF EXISTS reaction_scores", []); // Purge legacy game table

        Ok(Self { db_path })
    }

    pub fn get_conn(&self) -> Result<Connection, String> {
        Connection::open(&self.db_path).map_err(|e| e.to_string())
    }

    // Preferences
    pub fn load_preferences(&self) -> Result<PetPreferences, String> {
        let conn = self.get_conn()?;
        let mut stmt = conn
            .prepare("SELECT scale, theme, behavior_mode, wander_speed, speech_enabled, sound_volume, always_on_top, fps_limit, COALESCE(character_style, 'shadow_shinobi') FROM preferences WHERE id = 1")
            .map_err(|e| e.to_string())?;

        let mut rows = stmt
            .query_map([], |row| {
                Ok(PetPreferences {
                    scale: row.get(0)?,
                    theme: row.get(1)?,
                    character_style: row.get(8).unwrap_or_else(|_| "shadow_shinobi".to_string()),
                    behavior_mode: row.get(2)?,
                    wander_speed: row.get(3)?,
                    speech_enabled: row.get::<_, i32>(4)? != 0,
                    sound_volume: row.get(5)?,
                    always_on_top: row.get::<_, i32>(6)? != 0,
                    fps_limit: row.get(7)?,
                })
            })
            .map_err(|e| e.to_string())?;

        if let Some(pref) = rows.next() {
            pref.map_err(|e| e.to_string())
        } else {
            let def = PetPreferences::default();
            self.save_preferences(&def)?;
            Ok(def)
        }
    }

    pub fn save_preferences(&self, pref: &PetPreferences) -> Result<(), String> {
        let conn = self.get_conn()?;
        conn.execute(
            "INSERT OR REPLACE INTO preferences (id, scale, theme, character_style, behavior_mode, wander_speed, speech_enabled, sound_volume, always_on_top, fps_limit)
             VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                pref.scale,
                pref.theme,
                pref.character_style,
                pref.behavior_mode,
                pref.wander_speed,
                if pref.speech_enabled { 1 } else { 0 },
                pref.sound_volume,
                if pref.always_on_top { 1 } else { 0 },
                pref.fps_limit,
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Needs & Mood
    pub fn load_needs_mood(&self) -> Result<PetNeedsMood, String> {
        let conn = self.get_conn()?;
        let mut stmt = conn
            .prepare("SELECT energy, happiness, fun, mood, home_x, home_y, last_interaction_ts FROM needs_mood WHERE id = 1")
            .map_err(|e| e.to_string())?;

        let mut rows = stmt
            .query_map([], |row| {
                Ok(PetNeedsMood {
                    energy: row.get(0)?,
                    happiness: row.get(1)?,
                    fun: row.get(2)?,
                    mood: row.get(3)?,
                    home_x: row.get(4)?,
                    home_y: row.get(5)?,
                    last_interaction_ts: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;

        if let Some(nm) = rows.next() {
            nm.map_err(|e| e.to_string())
        } else {
            let def = PetNeedsMood::default();
            self.save_needs_mood(&def)?;
            Ok(def)
        }
    }

    pub fn save_needs_mood(&self, nm: &PetNeedsMood) -> Result<(), String> {
        let conn = self.get_conn()?;
        conn.execute(
            "INSERT OR REPLACE INTO needs_mood (id, energy, happiness, fun, mood, home_x, home_y, last_interaction_ts)
             VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                nm.energy,
                nm.happiness,
                nm.fun,
                nm.mood,
                nm.home_x,
                nm.home_y,
                nm.last_interaction_ts,
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Position
    pub fn load_position(&self) -> Result<PetPosition, String> {
        let conn = self.get_conn()?;
        let mut stmt = conn
            .prepare("SELECT monitor_id, x, y FROM pet_position WHERE id = 1")
            .map_err(|e| e.to_string())?;

        let mut rows = stmt
            .query_map([], |row| {
                Ok(PetPosition {
                    monitor_id: row.get(0)?,
                    x: row.get(1)?,
                    y: row.get(2)?,
                })
            })
            .map_err(|e| e.to_string())?;

        if let Some(pos) = rows.next() {
            pos.map_err(|e| e.to_string())
        } else {
            Ok(PetPosition {
                monitor_id: "primary".to_string(),
                x: 100,
                y: 100,
            })
        }
    }

    pub fn save_position(&self, pos: &PetPosition) -> Result<(), String> {
        let conn = self.get_conn()?;
        conn.execute(
            "INSERT OR REPLACE INTO pet_position (id, monitor_id, x, y, updated_at)
             VALUES (1, ?1, ?2, ?3, ?4)",
            params![
                pos.monitor_id,
                pos.x,
                pos.y,
                chrono::Utc::now().timestamp(),
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Notifications
    pub fn load_notification_settings(&self) -> Result<NotificationSettings, String> {
        let conn = self.get_conn()?;
        let mut stmt = conn
            .prepare("SELECT listener_enabled, show_app_name, show_title, show_body, sound, privacy_mode, cooldown_ms FROM notification_settings WHERE id = 1")
            .map_err(|e| e.to_string())?;

        let mut rows = stmt
            .query_map([], |row| {
                Ok(NotificationSettings {
                    listener_enabled: row.get::<_, i32>(0)? != 0,
                    show_app_name: row.get::<_, i32>(1)? != 0,
                    show_title: row.get::<_, i32>(2)? != 0,
                    show_body: row.get::<_, i32>(3)? != 0,
                    sound: row.get::<_, i32>(4)? != 0,
                    privacy_mode: row.get::<_, i32>(5)? != 0,
                    cooldown_ms: row.get::<_, i64>(6)? as u64,
                })
            })
            .map_err(|e| e.to_string())?;

        if let Some(set) = rows.next() {
            set.map_err(|e| e.to_string())
        } else {
            let def = NotificationSettings::default();
            self.save_notification_settings(&def)?;
            Ok(def)
        }
    }

    pub fn save_notification_settings(&self, s: &NotificationSettings) -> Result<(), String> {
        let conn = self.get_conn()?;
        conn.execute(
            "INSERT OR REPLACE INTO notification_settings (id, listener_enabled, show_app_name, show_title, show_body, sound, privacy_mode, cooldown_ms)
             VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                if s.listener_enabled { 1 } else { 0 },
                if s.show_app_name { 1 } else { 0 },
                if s.show_title { 1 } else { 0 },
                if s.show_body { 1 } else { 0 },
                if s.sound { 1 } else { 0 },
                if s.privacy_mode { 1 } else { 0 },
                s.cooldown_ms as i64,
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn save_notification(&self, item: &NotificationItem) -> Result<(), String> {
        let conn = self.get_conn()?;
        conn.execute(
            "INSERT OR REPLACE INTO notification_history (id, app_name, title, body, timestamp)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                item.id,
                item.app_name,
                item.title,
                item.body,
                item.timestamp,
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn load_notification_history(&self, limit: usize) -> Result<Vec<NotificationItem>, String> {
        let conn = self.get_conn()?;
        let mut stmt = conn
            .prepare("SELECT id, app_name, title, body, timestamp FROM notification_history ORDER BY timestamp DESC LIMIT ?1")
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([limit as i64], |row| {
                Ok(NotificationItem {
                    id: row.get(0)?,
                    app_name: row.get(1)?,
                    title: row.get(2)?,
                    body: row.get(3)?,
                    timestamp: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r.map_err(|e| e.to_string())?);
        }
        Ok(list)
    }

    pub fn clear_notification_history(&self) -> Result<(), String> {
        let conn = self.get_conn()?;
        conn.execute("DELETE FROM notification_history", [])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // Export & Import
    pub fn export_data(&self) -> Result<UserDataExport, String> {
        let preferences = self.load_preferences()?;
        let needs_mood = self.load_needs_mood()?;
        let position = self.load_position()?;
        let notification_settings = self.load_notification_settings()?;

        Ok(UserDataExport {
            version: "0.2.0".to_string(),
            timestamp: chrono::Utc::now().timestamp(),
            preferences,
            needs_mood,
            position,
            notification_settings,
        })
    }

    pub fn import_data(&self, data: UserDataExport) -> Result<(), String> {
        self.save_preferences(&data.preferences)?;
        self.save_needs_mood(&data.needs_mood)?;
        self.save_position(&data.position)?;
        self.save_notification_settings(&data.notification_settings)?;
        Ok(())
    }
}

// Tauri Command wrappers
#[tauri::command]
pub fn get_pet_preferences(
    storage: tauri::State<'_, std::sync::Arc<StorageManager>>,
) -> Result<PetPreferences, String> {
    storage.load_preferences()
}

#[tauri::command]
pub fn save_pet_preferences(
    preferences: PetPreferences,
    storage: tauri::State<'_, std::sync::Arc<StorageManager>>,
) -> Result<(), String> {
    storage.save_preferences(&preferences)
}

#[tauri::command]
pub fn get_pet_needs_mood(
    storage: tauri::State<'_, std::sync::Arc<StorageManager>>,
) -> Result<PetNeedsMood, String> {
    storage.load_needs_mood()
}

#[tauri::command]
pub fn save_pet_needs_mood(
    state: PetNeedsMood,
    storage: tauri::State<'_, std::sync::Arc<StorageManager>>,
) -> Result<(), String> {
    storage.save_needs_mood(&state)
}

#[tauri::command]
pub fn get_pet_position(
    storage: tauri::State<'_, std::sync::Arc<StorageManager>>,
) -> Result<PetPosition, String> {
    storage.load_position()
}

#[tauri::command]
pub fn save_pet_position(
    position: PetPosition,
    storage: tauri::State<'_, std::sync::Arc<StorageManager>>,
) -> Result<(), String> {
    storage.save_position(&position)
}

#[tauri::command]
pub fn export_user_data(
    storage: tauri::State<'_, std::sync::Arc<StorageManager>>,
) -> Result<UserDataExport, String> {
    storage.export_data()
}

#[tauri::command]
pub fn import_user_data(
    data: UserDataExport,
    storage: tauri::State<'_, std::sync::Arc<StorageManager>>,
) -> Result<(), String> {
    storage.import_data(data)
}
