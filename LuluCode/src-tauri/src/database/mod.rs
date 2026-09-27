use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbProject {
    pub id: String,
    pub name: String,
    pub path: String,
    pub detected_type: String,
    pub build_tool: Option<String>,
    pub test_runner: Option<String>,
    pub last_opened_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbTask {
    pub id: String,
    pub project_id: Option<String>,
    pub title: String,
    pub prompt: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
    pub result: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbMessage {
    pub id: String,
    pub task_id: String,
    pub role: String,
    pub content: String,
    pub tool_call_id: Option<String>,
    pub created_at: String,
}

pub struct DatabaseManager {
    conn: Arc<Mutex<Connection>>,
}

impl DatabaseManager {
    pub fn init(db_path: &Path) -> Result<Self, String> {
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("Cannot create DB folder: {}", e))?;
        }

        let conn = Connection::open(db_path).map_err(|e| format!("Failed to open SQLite database: {}", e))?;

        let schema_sql = include_str!("../../../migrations/001_initial_schema.sql");
        conn.execute_batch(schema_sql)
            .map_err(|e| format!("Failed to apply initial database schema: {}", e))?;

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    pub fn in_memory() -> Result<Self, String> {
        let conn = Connection::open_in_memory().map_err(|e| e.to_string())?;
        let schema_sql = include_str!("../../../migrations/001_initial_schema.sql");
        conn.execute_batch(schema_sql).map_err(|e| e.to_string())?;
        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    // Projects CRUD
    pub fn save_project(&self, project: &DbProject) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO projects (id, name, path, detected_type, build_tool, test_runner, last_opened_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, CURRENT_TIMESTAMP)
             ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                path=excluded.path,
                detected_type=excluded.detected_type,
                build_tool=excluded.build_tool,
                test_runner=excluded.test_runner,
                last_opened_at=CURRENT_TIMESTAMP;",
            params![
                project.id,
                project.name,
                project.path,
                project.detected_type,
                project.build_tool,
                project.test_runner
            ],
        ).map_err(|e| format!("Failed to save project: {}", e))?;
        Ok(())
    }

    pub fn list_recent_projects(&self) -> Result<Vec<DbProject>, String> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id, name, path, detected_type, build_tool, test_runner, last_opened_at FROM projects ORDER BY last_opened_at DESC LIMIT 20")
            .map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| {
            Ok(DbProject {
                id: row.get(0)?,
                name: row.get(1)?,
                path: row.get(2)?,
                detected_type: row.get(3)?,
                build_tool: row.get(4)?,
                test_runner: row.get(5)?,
                last_opened_at: row.get(6)?,
            })
        }).map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for r in rows {
            if let Ok(p) = r {
                list.push(p);
            }
        }
        Ok(list)
    }

    // Tasks CRUD
    pub fn save_task(&self, task: &DbTask) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO tasks (id, project_id, title, prompt, status, result, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, CURRENT_TIMESTAMP)
             ON CONFLICT(id) DO UPDATE SET
                title=excluded.title,
                status=excluded.status,
                result=excluded.result,
                updated_at=CURRENT_TIMESTAMP;",
            params![task.id, task.project_id, task.title, task.prompt, task.status, task.result],
        ).map_err(|e| format!("Failed to save task: {}", e))?;
        Ok(())
    }

    pub fn list_tasks(&self, project_id: Option<&str>) -> Result<Vec<DbTask>, String> {
        let conn = self.conn.lock().unwrap();
        let mut list = Vec::new();

        if let Some(pid) = project_id {
            let mut stmt = conn
                .prepare("SELECT id, project_id, title, prompt, status, created_at, updated_at, result FROM tasks WHERE project_id = ?1 ORDER BY created_at DESC")
                .map_err(|e| e.to_string())?;
            let rows = stmt.query_map([pid], |row| Self::map_task(row)).map_err(|e| e.to_string())?;
            for r in rows {
                if let Ok(t) = r {
                    list.push(t);
                }
            }
        } else {
            let mut stmt = conn
                .prepare("SELECT id, project_id, title, prompt, status, created_at, updated_at, result FROM tasks ORDER BY created_at DESC")
                .map_err(|e| e.to_string())?;
            let rows = stmt.query_map([], |row| Self::map_task(row)).map_err(|e| e.to_string())?;
            for r in rows {
                if let Ok(t) = r {
                    list.push(t);
                }
            }
        }

        Ok(list)
    }

    fn map_task(row: &rusqlite::Row) -> rusqlite::Result<DbTask> {
        Ok(DbTask {
            id: row.get(0)?,
            project_id: row.get(1)?,
            title: row.get(2)?,
            prompt: row.get(3)?,
            status: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
            result: row.get(7)?,
        })
    }

    // Messages CRUD
    pub fn save_message(&self, msg: &DbMessage) -> Result<(), String> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO messages (id, task_id, role, content, tool_call_id, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP);",
            params![msg.id, msg.task_id, msg.role, msg.content, msg.tool_call_id],
        ).map_err(|e| format!("Failed to save message: {}", e))?;
        Ok(())
    }

    pub fn list_messages(&self, task_id: &str) -> Result<Vec<DbMessage>, String> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn
            .prepare("SELECT id, task_id, role, content, tool_call_id, created_at FROM messages WHERE task_id = ?1 ORDER BY created_at ASC")
            .map_err(|e| e.to_string())?;

        let rows = stmt.query_map([task_id], |row| {
            Ok(DbMessage {
                id: row.get(0)?,
                task_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                tool_call_id: row.get(4)?,
                created_at: row.get(5)?,
            })
        }).map_err(|e| e.to_string())?;

        let mut list = Vec::new();
        for r in rows {
            if let Ok(m) = r {
                list.push(m);
            }
        }
        Ok(list)
    }
}

pub type SharedDatabaseManager = Arc<DatabaseManager>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_in_memory_db() {
        let db = DatabaseManager::in_memory().unwrap();
        let p = DbProject {
            id: "proj_1".into(),
            name: "LuluCode".into(),
            path: "/path/to/LuluCode".into(),
            detected_type: "Rust".into(),
            build_tool: Some("cargo".into()),
            test_runner: Some("cargo test".into()),
            last_opened_at: "".into(),
        };

        assert!(db.save_project(&p).is_ok());
        let projects = db.list_recent_projects().unwrap();
        assert_eq!(projects.len(), 1);
        assert_eq!(projects[0].name, "LuluCode");
    }
}
