#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use lulu_desktop_lib::cache;
use lulu_desktop_lib::doctor;
use lulu_desktop_lib::media;
use lulu_desktop_lib::terminal;
use std::env;

fn print_help() {
    println!("\x1b[36;1m🐾 LULU DESKTOP COMPANION & MEDIA CLI\x1b[0m");
    println!("Usage: lulu [COMMAND] [OPTIONS]\n");
    println!("\x1b[1mCOMMANDS:\x1b[0m");
    println!("  media                      Launch interactive live terminal media & lyrics sync");
    println!("  lyrics                     Terminal live synchronized lyrics studio");
    println!("  spotify                    Terminal media sync filtered to Spotify");
    println!("  youtube                    Terminal media sync filtered to YouTube / YouTube Music");
    println!("  media status               Print one-shot status of currently active media");
    println!("  media --json               Print currently active media session as structured JSON");
    println!("  media providers            List all detected media players and capability matrix");
    println!("  lyrics search <art> <tit>  Search LRCLIB and offline cache for track lyrics");
    println!("  cache status               Inspect cache directory and storage metrics");
    println!("  cache clear                Clear offline lyrics, media, and artwork cache");
    println!("  doctor                     Run comprehensive system diagnostic checks");
    println!("  help, --help, -h           Show this help message\n");
    println!("Run 'lulu' without arguments to launch the graphical desktop companion.");
}

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() > 1 {
        let cmd = args[1].to_lowercase();
        match cmd.as_str() {
            "doctor" => {
                match doctor::run_lulu_doctor() {
                    Ok(report) => {
                        println!("\x1b[36;1m┌────────────────────────────────────────────────────────┐\x1b[0m");
                        println!("\x1b[36;1m│\x1b[0m  🐾 \x1b[1mLULU SYSTEM DOCTOR DIAGNOSTIC REPORT\x1b[0m                \x1b[36;1m│\x1b[0m");
                        println!("\x1b[36;1m├────────────────────────────────────────────────────────┤\x1b[0m");
                        for check in &report.checks {
                            let badge = match check.status.as_str() {
                                "PASS" => "\x1b[32;1mPASS\x1b[0m",
                                "WARN" => "\x1b[33;1mWARN\x1b[0m",
                                "FAIL" => "\x1b[31;1mFAIL\x1b[0m",
                                _ => "\x1b[90mINFO\x1b[0m",
                            };
                            println!("  [{:<4}] {:<24} {}", badge, check.name, check.message);
                            if let Some(ref sug) = check.suggestion {
                                println!("         \x1b[90m↳ Suggestion: {}\x1b[0m", sug);
                            }
                        }
                        println!("\x1b[36;1m├────────────────────────────────────────────────────────┤\x1b[0m");
                        let status_color = match report.overall_status.as_str() {
                            "PASS" => "\x1b[32;1mALL SYSTEMS OPERATIONAL (PASS)\x1b[0m",
                            "WARN" => "\x1b[33;1mOPERATIONAL WITH WARNINGS (WARN)\x1b[0m",
                            _ => "\x1b[31;1mFAILURES DETECTED (FAIL)\x1b[0m",
                        };
                        println!("  Overall Status: {}", status_color);
                        println!("\x1b[36;1m└────────────────────────────────────────────────────────┘\x1b[0m");
                    }
                    Err(e) => eprintln!("Error running doctor: {}", e),
                }
                return;
            }

            "media" => {
                if args.len() > 2 {
                    let sub = args[2].to_lowercase();
                    if sub == "--json" || sub == "-j" {
                        let session = media::get_media_session(None).unwrap_or_default();
                        let json = serde_json::to_string_pretty(&session).unwrap_or_default();
                        println!("{}", json);
                        return;
                    } else if sub == "status" {
                        let session = media::get_media_session(None).unwrap_or_default();
                        println!("\x1b[1mMedia Source:\x1b[0m   {:?}", session.provider);
                        println!("\x1b[1mTitle:\x1b[0m          {}", session.title);
                        println!("\x1b[1mArtist:\x1b[0m         {}", session.artist.as_deref().unwrap_or("Unknown"));
                        println!("\x1b[1mAlbum:\x1b[0m          {}", session.album.as_deref().unwrap_or("Unknown"));
                        println!("\x1b[1mStatus:\x1b[0m         {}", if session.playing { "PLAYING" } else if session.paused { "PAUSED" } else { "STOPPED" });
                        println!("\x1b[1mPosition:\x1b[0m       {} / {}",
                            terminal::format_duration(session.position_ms.unwrap_or(0) as f64 / 1000.0),
                            terminal::format_duration(session.duration_ms.unwrap_or(0) as f64 / 1000.0)
                        );
                        println!("\x1b[1mLyrics:\x1b[0m         {}", session.lyrics_capability);
                        return;
                    } else if sub == "providers" {
                        match media::list_media_providers() {
                            Ok(providers) => {
                                println!("\x1b[36;1mProvider                         Active   Metadata   Position   Lyrics                Control\x1b[0m");
                                println!("--------------------------------------------------------------------------------------------------");
                                for p in providers {
                                    let active_str = if p.active { "\x1b[32;1mYES\x1b[0m" } else { "\x1b[90mNO\x1b[0m" };
                                    println!("{:<32} {:<8} {:<10} {:<10} {:<21} {}", p.name, active_str, p.metadata, p.position, p.lyrics, p.control);
                                }
                            }
                            Err(e) => eprintln!("Error listing providers: {}", e),
                        }
                        return;
                    }
                }
                terminal::run_terminal_media_loop(None);
                return;
            }

            "lyrics" => {
                if args.len() > 2 && args[2].to_lowercase() == "search" {
                    let artist = args.get(3).map(|s| s.as_str()).unwrap_or("");
                    let title = args.get(4).map(|s| s.as_str()).unwrap_or("");
                    if artist.is_empty() || title.is_empty() {
                        eprintln!("Usage: lulu lyrics search <artist> <song_title>");
                        return;
                    }
                    println!("Searching lyrics for \"{}\" by \"{}\"...", title, artist);
                    if let Some(lrc) = terminal::fetch_lyrics_lrclib(artist, title) {
                        println!("\x1b[32;1m[LYRICS FOUND]\x1b[0m\n");
                        let lines = terminal::parse_lrc_lines(&lrc);
                        if lines.is_empty() {
                            println!("{}", lrc);
                        } else {
                            for line in lines.iter().take(15) {
                                println!("[{}] {}", terminal::format_duration(line.time_secs), line.text);
                            }
                            if lines.len() > 15 {
                                println!("\x1b[90m... ({} more lines) ...\x1b[0m", lines.len() - 15);
                            }
                        }
                    } else {
                        println!("\x1b[33mNo lyrics match found on LRCLIB or cache.\x1b[0m");
                    }
                    return;
                }
                terminal::run_terminal_media_loop(None);
                return;
            }

            "spotify" => {
                terminal::run_terminal_media_loop(Some("spotify".to_string()));
                return;
            }

            "youtube" => {
                terminal::run_terminal_media_loop(Some("youtube".to_string()));
                return;
            }

            "cache" => {
                if args.len() > 2 && args[2].to_lowercase() == "clear" {
                    match cache::clear_cache() {
                        Ok(msg) => println!("\x1b[32m{}\x1b[0m", msg),
                        Err(e) => eprintln!("Error clearing cache: {}", e),
                    }
                } else {
                    match cache::get_cache_status() {
                        Ok(status) => {
                            println!("\x1b[36;1m🐾 LULU CACHE STATUS\x1b[0m");
                            println!("  Directory:     {}", status.cache_dir);
                            println!("  Total Files:   {}", status.total_files);
                            println!("  Total Size:    {:.2} KB ({} bytes)", status.total_bytes as f64 / 1024.0, status.total_bytes);
                            println!("  Lyrics Cache:  {} tracks", status.lyrics_count);
                            println!("  Media Cache:   {} entries", status.media_count);
                            println!("  Artwork Cache: {} images", status.artwork_count);
                        }
                        Err(e) => eprintln!("Error reading cache status: {}", e),
                    }
                }
                return;
            }

            "help" | "--help" | "-h" => {
                print_help();
                return;
            }

            _ => {
                // If unknown flag, print help and exit
                if cmd.starts_with('-') {
                    print_help();
                    return;
                }
            }
        }
    }

    // Default mode: Launch graphical desktop companion
    lulu_desktop_lib::run();
}
