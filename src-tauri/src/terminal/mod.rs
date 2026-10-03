use crate::cache::{get_cached_lyric, save_cached_lyric};
use crate::media::{get_media_session, MediaProviderKind};
use serde::{Deserialize, Serialize};
use std::io::{stdout, Write};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

static RUNNING: AtomicBool = AtomicBool::new(true);

extern "C" fn handle_sigint(_: libc::c_int) {
    RUNNING.store(false, Ordering::SeqCst);
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LrcLine {
    pub time_secs: f64,
    pub text: String,
}

pub fn url_encode(input: &str) -> String {
    let mut encoded = String::new();
    for b in input.bytes() {
        if b.is_ascii_alphanumeric() || b == b'-' || b == b'_' || b == b'.' || b == b'~' {
            encoded.push(b as char);
        } else {
            encoded.push_str(&format!("%{:02X}", b));
        }
    }
    encoded
}

/// Strip ANSI escape codes and control characters to prevent terminal injection
pub fn sanitize_terminal_text(input: &str) -> String {
    let re_ansi = regex::Regex::new(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])").unwrap();
    let stripped = re_ansi.replace_all(input, "");
    stripped
        .chars()
        .filter(|&c| c >= ' ' || c == '\n' || c == '\t')
        .collect()
}

pub fn parse_lrc_lines(content: &str) -> Vec<LrcLine> {
    let time_regex = regex::Regex::new(r"\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?\]").unwrap();
    let mut lines = Vec::new();

    for raw_line in content.lines() {
        let trimmed = raw_line.trim();
        if trimmed.is_empty() {
            continue;
        }

        let mut timestamps = Vec::new();
        for cap in time_regex.captures_iter(trimmed) {
            let mins: f64 = cap[1].parse().unwrap_or(0.0);
            let secs: f64 = cap[2].parse().unwrap_or(0.0);
            let millis_raw = cap.get(3).map_or("0", |m| m.as_str());
            let millis: f64 = if millis_raw.len() == 2 {
                millis_raw.parse::<f64>().unwrap_or(0.0) * 10.0
            } else {
                millis_raw.parse::<f64>().unwrap_or(0.0)
            };
            timestamps.push(mins * 60.0 + secs + millis / 1000.0);
        }

        if timestamps.is_empty() {
            continue;
        }

        let clean_text = time_regex.replace_all(trimmed, "").trim().to_string();
        for ts in timestamps {
            lines.push(LrcLine {
                time_secs: ts,
                text: clean_text.clone(),
            });
        }
    }

    lines.sort_by(|a, b| a.time_secs.partial_cmp(&b.time_secs).unwrap());
    lines
}

pub fn find_active_line_index(lines: &[LrcLine], pos_secs: f64, tolerance_secs: f64) -> Option<usize> {
    if lines.is_empty() {
        return None;
    }
    let effective_pos = pos_secs + tolerance_secs;
    if effective_pos < lines[0].time_secs {
        return None;
    }

    let mut low = 0;
    let mut high = lines.len() - 1;
    let mut active = None;

    while low <= high {
        let mid = (low + high) / 2;
        if lines[mid].time_secs <= effective_pos {
            active = Some(mid);
            low = mid + 1;
        } else {
            if mid == 0 {
                break;
            }
            high = mid - 1;
        }
    }

    active
}

pub fn fetch_lyrics_lrclib(artist: &str, title: &str) -> Option<String> {
    // 1. Try cache
    if let Some(cached) = get_cached_lyric("lrclib", artist, title) {
        return Some(cached);
    }

    // 2. Fetch using curl
    let url = format!(
        "https://lrclib.net/api/get?artist_name={}&track_name={}",
        url_encode(artist),
        url_encode(title)
    );

    let output = std::process::Command::new("curl")
        .args([
            "-s",
            "--max-time",
            "5",
            "-H",
            "User-Agent: Lulu-Desktop/0.2.0 (Linux)",
            &url,
        ])
        .output()
        .ok()?;

    if output.status.success() {
        let raw = String::from_utf8_lossy(&output.stdout);
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&raw) {
            if let Some(synced) = v.get("syncedLyrics").and_then(|s| s.as_str()) {
                if !synced.trim().is_empty() {
                    save_cached_lyric("lrclib", artist, title, synced);
                    return Some(synced.to_string());
                }
            }
            if let Some(plain) = v.get("plainLyrics").and_then(|s| s.as_str()) {
                if !plain.trim().is_empty() {
                    save_cached_lyric("lrclib", artist, title, plain);
                    return Some(plain.to_string());
                }
            }
        }
    }
    None
}

pub fn format_duration(secs: f64) -> String {
    let s = secs.max(0.0) as u64;
    let mins = s / 60;
    let rem = s % 60;
    format!("{:02}:{:02}", mins, rem)
}

pub fn run_terminal_media_loop(filter_provider: Option<String>) {
    RUNNING.store(true, Ordering::SeqCst);

    // Setup signal handler for graceful exit
    unsafe {
        libc::signal(libc::SIGINT, handle_sigint as *const () as libc::sighandler_t);
        libc::signal(libc::SIGTERM, handle_sigint as *const () as libc::sighandler_t);
    }

    let mut out = stdout();
    // Switch to alternate screen and hide cursor
    let _ = write!(out, "\x1b[?1049h\x1b[?25l");
    let _ = out.flush();

    let mut last_track_key = String::new();
    let mut current_lyrics_lines: Vec<LrcLine> = Vec::new();
    let mut lyrics_status = "Searching...".to_string();
    let mut prev_line = "···".to_string();
    let mut curr_line = "♪ (Instrumental Melody) ♪".to_string();
    let mut next_line = "···".to_string();

    while RUNNING.load(Ordering::SeqCst) {
        let session = get_media_session(filter_provider.clone()).unwrap_or_default();

        let track_key = format!(
            "{} - {}",
            session.artist.as_deref().unwrap_or(""),
            session.title
        );

        if track_key != last_track_key && !session.title.is_empty() {
            last_track_key = track_key.clone();
            current_lyrics_lines.clear();
            prev_line = "···".to_string();
            curr_line = "♪ (Instrumental Melody) ♪".to_string();
            next_line = "···".to_string();

            if let Some(ref art) = session.artist {
                if let Some(raw_lrc) = fetch_lyrics_lrclib(art, &session.title) {
                    current_lyrics_lines = parse_lrc_lines(&raw_lrc);
                    lyrics_status = if current_lyrics_lines.is_empty() {
                        "Plain Lyrics (Unsynced)".to_string()
                    } else {
                        "Live Synced".to_string()
                    };
                } else {
                    lyrics_status = "Lyrics not available".to_string();
                }
            } else {
                lyrics_status = "No artist info for lyrics".to_string();
            }
        }

        // Calculate active lines with 100ms tolerance and freeze on pause
        let pos_secs = session.position_ms.unwrap_or(0) as f64 / 1000.0;
        let dur_secs = session.duration_ms.unwrap_or(0) as f64 / 1000.0;

        if !session.paused && !current_lyrics_lines.is_empty() {
            let active_idx = find_active_line_index(&current_lyrics_lines, pos_secs, 0.100);
            if let Some(idx) = active_idx {
                if idx > 0 {
                    prev_line = sanitize_terminal_text(&current_lyrics_lines[idx - 1].text);
                } else {
                    prev_line = "···".to_string();
                }
                curr_line = sanitize_terminal_text(&current_lyrics_lines[idx].text);
                if idx + 1 < current_lyrics_lines.len() {
                    next_line = sanitize_terminal_text(&current_lyrics_lines[idx + 1].text);
                } else {
                    next_line = "···".to_string();
                }
            } else {
                prev_line = "···".to_string();
                curr_line = "♪ (Instrumental Melody) ♪".to_string();
                next_line = sanitize_terminal_text(&current_lyrics_lines[0].text);
            }
        }

        // Render Frame
        let provider_name = match session.provider {
            MediaProviderKind::Spotify => "🟢 Spotify",
            MediaProviderKind::Youtube => "🔴 YouTube",
            MediaProviderKind::YoutubeMusic => "🎵 YouTube Music",
            MediaProviderKind::Mpris => "🎧 Linux MPRIS",
            MediaProviderKind::Unknown => "⚪ None",
        };

        let status_str = if session.playing {
            "\x1b[32;1mPLAYING\x1b[0m"
        } else if session.paused {
            "\x1b[33;1mPAUSED\x1b[0m"
        } else {
            "\x1b[90mSTOPPED\x1b[0m"
        };

        let progress_pct = if dur_secs > 0.0 {
            (pos_secs / dur_secs).clamp(0.0, 1.0)
        } else {
            0.0
        };
        let bar_len: usize = 24;
        let filled_len = (progress_pct * bar_len as f64).round() as usize;
        let empty_len = bar_len.saturating_sub(filled_len);
        let progress_bar = format!(
            "\x1b[32m{}\x1b[90m{}\x1b[0m",
            "━".repeat(filled_len),
            "─".repeat(empty_len)
        );

        // Move to top-left and clear
        let _ = write!(out, "\x1b[H");
        let _ = writeln!(out, "\x1b[36;1m┌────────────────────────────────────────────────────────┐\x1b[0m");
        let _ = writeln!(out, "\x1b[36;1m│\x1b[0m  🐾 \x1b[1mLULU MEDIA INTEGRATION\x1b[0m — Live Synced Lyrics Studio   \x1b[36;1m│\x1b[0m");
        let _ = writeln!(out, "\x1b[36;1m├────────────────────────────────────────────────────────┤\x1b[0m");
        let _ = writeln!(out, "\x1b[36;1m│\x1b[0m Source:     {:<44}\x1b[36;1m│\x1b[0m", provider_name);
        let _ = writeln!(out, "\x1b[36;1m│\x1b[0m Artist:     {:<44}\x1b[36;1m│\x1b[0m", sanitize_terminal_text(session.artist.as_deref().unwrap_or("Unknown Artist")));
        let _ = writeln!(out, "\x1b[36;1m│\x1b[0m Title:      {:<44}\x1b[36;1m│\x1b[0m", sanitize_terminal_text(if session.title.is_empty() { "No Media Active" } else { &session.title }));
        let _ = writeln!(out, "\x1b[36;1m│\x1b[0m Status:     {}  •  Lyrics: {:<23}\x1b[36;1m│\x1b[0m", status_str, lyrics_status);
        let _ = writeln!(out, "\x1b[36;1m│\x1b[0m Time:       {} {} {}\x1b[36;1m│\x1b[0m", format_duration(pos_secs), progress_bar, format_duration(dur_secs));
        let _ = writeln!(out, "\x1b[36;1m├────────────────────────────────────────────────────────┤\x1b[0m");
        let _ = writeln!(out, "\x1b[36;1m│\x1b[0m                                                        \x1b[36;1m│\x1b[0m");
        let _ = writeln!(out, "\x1b[36;1m│\x1b[0m   \x1b[90m{:<52}\x1b[0m \x1b[36;1m│\x1b[0m", prev_line);
        let _ = writeln!(out, "\x1b[36;1m│\x1b[0m                                                        \x1b[36;1m│\x1b[0m");
        let _ = writeln!(out, "\x1b[36;1m│\x1b[0m   \x1b[32;1m► {:<48} ◄\x1b[0m \x1b[36;1m│\x1b[0m", curr_line);
        let _ = writeln!(out, "\x1b[36;1m│\x1b[0m                                                        \x1b[36;1m│\x1b[0m");
        let _ = writeln!(out, "\x1b[36;1m│\x1b[0m   \x1b[36m{:<52}\x1b[0m \x1b[36;1m│\x1b[0m", next_line);
        let _ = writeln!(out, "\x1b[36;1m│\x1b[0m                                                        \x1b[36;1m│\x1b[0m");
        let _ = writeln!(out, "\x1b[36;1m└────────────────────────────────────────────────────────┘\x1b[0m");
        let _ = writeln!(out, "\x1b[90mPress Ctrl+C to exit terminal media mode.\x1b[0m            ");
        let _ = out.flush();

        std::thread::sleep(Duration::from_millis(200));
    }

    // Restore terminal cursor and screen
    let _ = write!(out, "\x1b[?25h\x1b[?1049l");
    let _ = out.flush();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_terminal_text_strips_ansi() {
        let dirty = "Hello \x1b[31;1mRed Alert\x1b[0m World\x1b[2J";
        let clean = sanitize_terminal_text(dirty);
        assert_eq!(clean, "Hello Red Alert World");
    }

    #[test]
    fn test_parse_lrc_lines() {
        let lrc = "[00:10.50] Hello world\n[00:20.00] Second line\n";
        let parsed = parse_lrc_lines(lrc);
        assert_eq!(parsed.len(), 2);
        assert_eq!(parsed[0].time_secs, 10.5);
        assert_eq!(parsed[0].text, "Hello world");
        assert_eq!(parsed[1].time_secs, 20.0);
        assert_eq!(parsed[1].text, "Second line");
    }

    #[test]
    fn test_khmer_unicode_support() {
        let khmer_text = "ខ្ញុំស្រឡាញ់អ្នក";
        let sanitized = sanitize_terminal_text(khmer_text);
        assert_eq!(sanitized, khmer_text);
    }

    #[test]
    fn test_url_encode() {
        assert_eq!(url_encode("Cigarettes After Sex"), "Cigarettes%20After%20Sex");
        assert_eq!(url_encode("K."), "K.");
    }

    #[test]
    fn test_find_active_line_index_tolerance_and_boundaries() {
        let lines = vec![
            LrcLine { time_secs: 5.0, text: "First".to_string() },
            LrcLine { time_secs: 10.0, text: "Second".to_string() },
            LrcLine { time_secs: 15.0, text: "Third".to_string() },
        ];
        // Before first line with 100ms tolerance
        assert_eq!(find_active_line_index(&lines, 4.8, 0.100), None);
        // Hits line 0 at 4.9s due to +100ms tolerance
        assert_eq!(find_active_line_index(&lines, 4.9, 0.100), Some(0));
        // Inside line 1
        assert_eq!(find_active_line_index(&lines, 12.0, 0.100), Some(1));
        // Final line
        assert_eq!(find_active_line_index(&lines, 25.0, 0.100), Some(2));
    }
}
