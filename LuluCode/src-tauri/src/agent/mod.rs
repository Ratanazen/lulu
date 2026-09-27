use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentState {
    Idle,
    Planning,
    Inspecting,
    Executing,
    Testing,
    Analyzing,
    Fixing,
    Verifying,
    Complete,
    Recovery,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTimelineEvent {
    pub timestamp: String,
    pub phase: AgentState,
    pub message: String,
    pub tool: Option<String>,
    pub exit_code: Option<i32>,
    pub duration_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskContext {
    pub task_id: String,
    pub title: String,
    pub prompt: String,
    pub current_state: AgentState,
    pub retry_count: usize,
    pub max_retries: usize,
    pub timeline: Vec<AgentTimelineEvent>,
    pub files_changed: Vec<String>,
}

pub struct AgentEngine {
    pub max_retries: usize,
}

impl AgentEngine {
    pub fn new() -> Self {
        Self { max_retries: 5 }
    }

    /// Evaluates state machine transition. Prevents infinite loops.
    pub fn next_state(&self, current: AgentState, success: bool, retry_count: &mut usize) -> AgentState {
        match current {
            AgentState::Idle => AgentState::Planning,
            AgentState::Planning => AgentState::Inspecting,
            AgentState::Inspecting => AgentState::Executing,
            AgentState::Executing => {
                if success {
                    AgentState::Testing
                } else {
                    *retry_count += 1;
                    if *retry_count >= self.max_retries {
                        AgentState::Complete
                    } else {
                        AgentState::Recovery
                    }
                }
            }
            AgentState::Testing => {
                if success {
                    AgentState::Verifying
                } else {
                    AgentState::Analyzing
                }
            }
            AgentState::Analyzing => AgentState::Fixing,
            AgentState::Fixing => {
                *retry_count += 1;
                if *retry_count >= self.max_retries {
                    AgentState::Complete
                } else {
                    AgentState::Testing
                }
            }
            AgentState::Verifying => AgentState::Complete,
            AgentState::Recovery => AgentState::Analyzing,
            AgentState::Complete => AgentState::Complete,
            AgentState::Cancelled => AgentState::Cancelled,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_lifecycle_success() {
        let engine = AgentEngine::new();
        let mut retries = 0;

        let s1 = engine.next_state(AgentState::Idle, true, &mut retries);
        assert_eq!(s1, AgentState::Planning);

        let s2 = engine.next_state(s1, true, &mut retries);
        assert_eq!(s2, AgentState::Inspecting);

        let s3 = engine.next_state(s2, true, &mut retries);
        assert_eq!(s3, AgentState::Executing);

        let s4 = engine.next_state(s3, true, &mut retries);
        assert_eq!(s4, AgentState::Testing);

        let s5 = engine.next_state(s4, true, &mut retries);
        assert_eq!(s5, AgentState::Verifying);

        let s6 = engine.next_state(s5, true, &mut retries);
        assert_eq!(s6, AgentState::Complete);
    }

    #[test]
    fn test_retry_limit_prevents_infinite_loop() {
        let engine = AgentEngine::new();
        let mut retries = 0;
        let mut state = AgentState::Testing;

        let mut iterations = 0;
        while state != AgentState::Complete && iterations < 30 {
            state = engine.next_state(state, false, &mut retries);
            iterations += 1;
        }

        assert_eq!(state, AgentState::Complete);
        assert!(retries >= 5);
        assert!(iterations < 30);
    }
}
