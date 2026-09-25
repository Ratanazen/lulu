use serde::{Deserialize, Serialize};
use crate::monitors::MonitorInfo;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClampResult {
    pub x: i32,
    pub y: i32,
    pub clamped: bool,
}

pub struct MovementBounds;

impl MovementBounds {
    /// Clamps window coordinates (x, y) with given size (width, height)
    /// to stay within the closest or containing monitor.
    pub fn clamp_to_monitors(
        x: i32,
        y: i32,
        width: u32,
        height: u32,
        monitors: &[MonitorInfo],
    ) -> ClampResult {
        if monitors.is_empty() {
            return ClampResult {
                x,
                y,
                clamped: false,
            };
        }

        // Find which monitor contains the point or is closest
        let mut target_mon = &monitors[0];
        let mut min_dist = f64::MAX;

        for mon in monitors {
            let mon_right = mon.x + mon.width as i32;
            let mon_bottom = mon.y + mon.height as i32;

            if x >= mon.x && x <= mon_right && y >= mon.y && y <= mon_bottom {
                target_mon = mon;
                break;
            }

            // Distance to monitor center
            let center_x = mon.x + (mon.width as i32 / 2);
            let center_y = mon.y + (mon.height as i32 / 2);
            let dist = (((x - center_x).pow(2) + (y - center_y).pow(2)) as f64).sqrt();
            if dist < min_dist {
                min_dist = dist;
                target_mon = mon;
            }
        }

        let min_x = target_mon.work_area_x;
        let max_x = (target_mon.work_area_x + target_mon.work_area_width as i32) - width as i32;
        let min_y = target_mon.work_area_y;
        let max_y = (target_mon.work_area_y + target_mon.work_area_height as i32) - height as i32;

        let clamped_x = x.clamp(min_x, max_x.max(min_x));
        let clamped_y = y.clamp(min_y, max_y.max(min_y));

        ClampResult {
            x: clamped_x,
            y: clamped_y,
            clamped: clamped_x != x || clamped_y != y,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clamp_within_single_monitor() {
        let monitors = vec![MonitorInfo {
            id: "mon1".to_string(),
            name: "Display 1".to_string(),
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            scale_factor: 1.0,
            refresh_rate: Some(60),
            primary: true,
            work_area_x: 0,
            work_area_y: 0,
            work_area_width: 1920,
            work_area_height: 1040,
        }];

        let res = MovementBounds::clamp_to_monitors(500, 300, 200, 200, &monitors);
        assert_eq!(res.x, 500);
        assert_eq!(res.y, 300);
        assert!(!res.clamped);
    }

    #[test]
    fn test_clamp_outside_bounds() {
        let monitors = vec![MonitorInfo {
            id: "mon1".to_string(),
            name: "Display 1".to_string(),
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            scale_factor: 1.0,
            refresh_rate: Some(60),
            primary: true,
            work_area_x: 0,
            work_area_y: 0,
            work_area_width: 1920,
            work_area_height: 1040,
        }];

        let res = MovementBounds::clamp_to_monitors(2500, -100, 200, 200, &monitors);
        assert_eq!(res.x, 1720); // 1920 - 200
        assert_eq!(res.y, 0);
        assert!(res.clamped);
    }

    #[test]
    fn test_clamp_multi_monitor_negative_coords() {
        let monitors = vec![
            MonitorInfo {
                id: "left_mon".to_string(),
                name: "Left".to_string(),
                x: -1920,
                y: 0,
                width: 1920,
                height: 1080,
                scale_factor: 1.0,
                refresh_rate: Some(60),
                primary: false,
                work_area_x: -1920,
                work_area_y: 0,
                work_area_width: 1920,
                work_area_height: 1080,
            },
            MonitorInfo {
                id: "main_mon".to_string(),
                name: "Main".to_string(),
                x: 0,
                y: 0,
                width: 1920,
                height: 1080,
                scale_factor: 1.0,
                refresh_rate: Some(60),
                primary: true,
                work_area_x: 0,
                work_area_y: 0,
                work_area_width: 1920,
                work_area_height: 1080,
            },
        ];

        let res = MovementBounds::clamp_to_monitors(-500, 200, 200, 200, &monitors);
        assert_eq!(res.x, -500);
        assert_eq!(res.y, 200);
        assert!(!res.clamped);
    }
}
