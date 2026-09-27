use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AdaptiveState {
    Normal,
    ThrottledLight,
    ThrottledHeavy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdaptiveAdjustment {
    pub state: AdaptiveState,
    pub effective_fps: u32,
    pub reason: String,
    pub downgrade_active: bool,
}

pub struct AdaptiveGovernor {
    high_pressure_duration_secs: u32,
    normal_duration_secs: u32,
    current_state: AdaptiveState,
}

impl Default for AdaptiveGovernor {
    fn default() -> Self {
        Self {
            high_pressure_duration_secs: 0,
            normal_duration_secs: 0,
            current_state: AdaptiveState::Normal,
        }
    }
}

impl AdaptiveGovernor {
    pub fn new() -> Self {
        Self::default()
    }

    /// Evaluates telemetry tick (typically called every 1–2 seconds by SystemService)
    /// Hysteresis: 10s sustained pressure triggers downgrade; 30s stable recovery restores quality.
    pub fn update(&mut self, cpu_usage: f32, base_fps: u32) -> Option<AdaptiveAdjustment> {
        self.update_with_temp(cpu_usage, None, base_fps)
    }

    /// Evaluates telemetry tick with both CPU usage and CPU temperature
    pub fn update_with_temp(&mut self, cpu_usage: f32, cpu_temp: Option<f32>, base_fps: u32) -> Option<AdaptiveAdjustment> {
        let is_overheating = cpu_temp.map(|t| t >= 74.0).unwrap_or(false);
        let is_warm = cpu_temp.map(|t| t >= 68.0).unwrap_or(false);
        let is_pressure = cpu_usage > 70.0 || is_warm;

        // Immediate emergency thermal intervention if CPU temperature is critical
        if is_overheating && self.current_state != AdaptiveState::ThrottledHeavy {
            self.current_state = AdaptiveState::ThrottledHeavy;
            self.high_pressure_duration_secs = 25;
            self.normal_duration_secs = 0;
            return Some(AdaptiveAdjustment {
                state: self.current_state,
                effective_fps: 18,
                reason: format!(
                    "Critical CPU temperature ({:.1}°C); emergency cooling throttle active",
                    cpu_temp.unwrap_or(75.0)
                ),
                downgrade_active: true,
            });
        }

        if is_pressure {
            self.high_pressure_duration_secs = self.high_pressure_duration_secs.saturating_add(1);
            self.normal_duration_secs = 0;

            if self.high_pressure_duration_secs >= 10 && self.current_state == AdaptiveState::Normal {
                self.current_state = AdaptiveState::ThrottledLight;
                let reason = if is_warm {
                    format!("Elevated CPU temperature ({:.1}°C); cooling throttle engaged", cpu_temp.unwrap_or(70.0))
                } else {
                    "High CPU usage sustained for >10s; reduced animation pacing".to_string()
                };
                return Some(AdaptiveAdjustment {
                    state: self.current_state,
                    effective_fps: (base_fps * 4 / 5).clamp(18, 30),
                    reason,
                    downgrade_active: true,
                });
            } else if self.high_pressure_duration_secs >= 25 && self.current_state == AdaptiveState::ThrottledLight {
                self.current_state = AdaptiveState::ThrottledHeavy;
                return Some(AdaptiveAdjustment {
                    state: self.current_state,
                    effective_fps: 18,
                    reason: "Severe CPU/thermal pressure sustained; switching to minimal frame pacing".to_string(),
                    downgrade_active: true,
                });
            }
        } else {
            self.normal_duration_secs = self.normal_duration_secs.saturating_add(1);
            self.high_pressure_duration_secs = 0;

            let is_cool_enough = cpu_temp.map(|t| t < 58.0).unwrap_or(true);
            if self.normal_duration_secs >= 30 && is_cool_enough && self.current_state != AdaptiveState::Normal {
                self.current_state = AdaptiveState::Normal;
                return Some(AdaptiveAdjustment {
                    state: self.current_state,
                    effective_fps: base_fps,
                    reason: "System temperature & CPU stabilized; restored standard performance".to_string(),
                    downgrade_active: false,
                });
            }
        }

        None
    }

    pub fn get_state(&self) -> AdaptiveState {
        self.current_state
    }

    pub fn reset(&mut self) {
        self.high_pressure_duration_secs = 0;
        self.normal_duration_secs = 0;
        self.current_state = AdaptiveState::Normal;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_adaptive_hysteresis() {
        let mut gov = AdaptiveGovernor::new();
        assert_eq!(gov.get_state(), AdaptiveState::Normal);

        // 9 seconds of high load: still normal
        for _ in 0..9 {
            assert!(gov.update(85.0, 30).is_none());
        }
        assert_eq!(gov.get_state(), AdaptiveState::Normal);

        // 10th second: triggers ThrottledLight
        let adj = gov.update(85.0, 30);
        assert!(adj.is_some());
        let val = adj.unwrap();
        assert_eq!(val.state, AdaptiveState::ThrottledLight);
        assert_eq!(gov.get_state(), AdaptiveState::ThrottledLight);

        // 20 seconds of normal load: still throttled (needs 30s)
        for _ in 0..20 {
            assert!(gov.update(20.0, 30).is_none());
        }
        assert_eq!(gov.get_state(), AdaptiveState::ThrottledLight);

        // Complete 30 seconds of normal load: restored to Normal
        for _ in 20..29 {
            assert!(gov.update(20.0, 30).is_none());
        }
        let restore = gov.update(20.0, 30);
        assert!(restore.is_some());
        assert_eq!(restore.unwrap().state, AdaptiveState::Normal);
        assert_eq!(gov.get_state(), AdaptiveState::Normal);
    }

    #[test]
    fn test_thermal_throttling_trigger() {
        let mut gov = AdaptiveGovernor::new();
        // Critical CPU temperature immediately triggers ThrottledHeavy
        let adj = gov.update_with_temp(35.0, Some(76.5), 30);
        assert!(adj.is_some());
        let val = adj.unwrap();
        assert_eq!(val.state, AdaptiveState::ThrottledHeavy);
        assert_eq!(val.effective_fps, 18);
        assert!(val.downgrade_active);
    }
}

