use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use chrono::Local;
use clap::Parser;
use env_logger::Builder;
use log::LevelFilter;
use sogrim_server::sap::CachedSapClient;

#[derive(Clone, clap::ValueEnum)]
enum Season {
    Winter,
    Spring,
    Summer,
}

impl Season {
    fn to_code(&self) -> &'static str {
        match self {
            Self::Winter => "200",
            Self::Spring => "201",
            Self::Summer => "202",
        }
    }
}

/// Format a semester: "spring 2026", "winter 2025-2026", "summer 2025"
fn semester_display(year: &str, semester: &str) -> String {
    let y: i32 = year.parse().unwrap_or(0);
    match semester {
        "200" => format!("winter {}-{}", y, y + 1),
        "201" => format!("spring {}", y + 1),
        "202" => format!("summer {}", y + 1),
        "208" => format!("yearly {}-{}", y, y + 1),
        other => format!("{year}/{other}"),
    }
}

/// Fetch Technion course data from SAP and write to disk cache.
#[derive(Parser)]
#[command(name = "sogrim-fetcher", about = "Fetch Technion course data from SAP")]
struct Args {
    /// Fetch the N most recent semesters (max 3). Conflicts with --year/--semester.
    #[arg(long, conflicts_with_all = &["year", "semester"], value_parser = clap::value_parser!(u8).range(1..=3))]
    latest: Option<u8>,

    /// Academic year (e.g. 2025). Required unless --latest is used.
    #[arg(long, required_unless_present = "latest")]
    year: Option<String>,

    /// Semesters to fetch (e.g. --semester winter spring). Defaults to all in the year.
    #[arg(long, value_enum)]
    semester: Vec<Season>,

    /// Cache directory
    #[arg(long, default_value = "/home/opc/cache")]
    cache_dir: PathBuf,

    /// Proxy URL. When set, all SAP requests route through this proxy.
    #[arg(long)]
    proxy_url: Option<String>,

    /// Max concurrent batch chunks (higher = faster but more load on SAP)
    #[arg(long, default_value = "16")]
    concurrency: usize,
}

// ---------------------------------------------------------------------------
// TTY detection — pretty output for humans, plain logs for cron
// ---------------------------------------------------------------------------

fn is_interactive() -> bool {
    atty::is(atty::Stream::Stderr)
}

fn hide_cursor() {
    eprint!("\x1b[?25l");
    let _ = io::stderr().flush();
}

fn show_cursor() {
    eprint!("\x1b[?25h");
    let _ = io::stderr().flush();
}

// ---------------------------------------------------------------------------
// Pretty terminal output (only when interactive)
// ---------------------------------------------------------------------------

struct ProgressBar {
    total: usize,
    current: Arc<AtomicUsize>,
    label: String,
    interactive: bool,
}

impl ProgressBar {
    fn new(label: &str, total: usize, interactive: bool) -> Self {
        Self {
            total,
            current: Arc::new(AtomicUsize::new(0)),
            label: label.to_string(),
            interactive,
        }
    }

    fn counter(&self) -> Arc<AtomicUsize> {
        Arc::clone(&self.current)
    }

    fn draw(&self) {
        if !self.interactive {
            return;
        }
        let done = self.current.load(Ordering::Relaxed).min(self.total);
        let pct = if self.total == 0 {
            100usize
        } else {
            (done * 100) / self.total
        };
        let bar_width = 30usize;
        let filled = (pct * bar_width) / 100;
        let empty = bar_width.saturating_sub(filled);
        eprint!(
            "\r  {} [{}{}] {}/{} ({}%)",
            self.label,
            "#".repeat(filled),
            "-".repeat(empty),
            done,
            self.total,
            pct,
        );
        let _ = io::stderr().flush();
    }

    fn finish(&self) {
        if !self.interactive {
            return;
        }
        self.draw();
        eprintln!(" done");
    }
}

fn print_header(
    interactive: bool,
    targets: &[SemesterTarget],
    proxy_url: &Option<String>,
    concurrency: usize,
) {
    if !interactive {
        return;
    }
    let sem_names: Vec<String> = targets
        .iter()
        .map(|t| semester_display(&t.year, &t.semester))
        .collect();
    eprintln!();
    eprintln!("  sogrim-fetcher");
    eprintln!("  ──────────────────────────────────────");
    eprintln!("  semesters:    {}", sem_names.join(", "));
    eprintln!(
        "  proxy:        {}",
        if proxy_url.is_some() {
            "enabled"
        } else {
            "direct"
        }
    );
    eprintln!("  concurrency:  {concurrency}");
    eprintln!("  ──────────────────────────────────────");
    eprintln!();
}

fn print_summary(
    interactive: bool,
    total_courses: usize,
    total_errors: usize,
    elapsed: Duration,
    sent: usize,
    received: usize,
) {
    if !interactive {
        return;
    }
    eprintln!();
    eprintln!("  ──────────────────────────────────────");
    eprintln!(
        "  done: {} courses, {} errors, {:.1}s",
        total_courses,
        total_errors,
        elapsed.as_secs_f64()
    );
    eprintln!(
        "  i/o:  {:.1} MB sent, {:.1} MB received",
        sent as f64 / 1_048_576.0,
        received as f64 / 1_048_576.0
    );
    eprintln!("  ──────────────────────────────────────");
    eprintln!();
}

fn print_spinner(interactive: bool, msg: &str) {
    if !interactive {
        return;
    }
    eprint!("\r  {msg}...");
    let _ = io::stderr().flush();
}

fn print_spinner_done(interactive: bool, msg: &str) {
    if !interactive {
        return;
    }
    eprintln!("\r  {msg}... ok");
}

// ---------------------------------------------------------------------------
// Logging (always writes to file, only to stderr in non-interactive mode)
// ---------------------------------------------------------------------------

fn init_logger(cache_dir: &Path, interactive: bool) {
    let log_dir = cache_dir.join("_logs");
    fs::create_dir_all(&log_dir).expect("failed to create log directory");

    let timestamp = Local::now().format("%Y-%m-%d_%H-%M-%S");
    let log_path = log_dir.join(format!("fetcher_{timestamp}.log"));

    let log_file = fs::File::create(&log_path).expect("failed to create log file");
    let log_file = std::sync::Mutex::new(log_file);

    Builder::new()
        .filter_level(LevelFilter::Info)
        .format(move |buf, record| {
            let ts = Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
            let line = format!("[{ts}] [{:>5}] {}\n", record.level(), record.args());

            // Always write to log file
            if let Ok(mut file) = log_file.lock() {
                let _ = file.write_all(line.as_bytes());
            }

            // Only write to stderr if non-interactive (cron mode)
            if !interactive {
                write!(buf, "[{ts}] [{:>5}] {}", record.level(), record.args())?;
            }
            Ok(())
        })
        .init();

    log::info!(target: "sogrim_server", "Log file: {}", log_path.display());
}

// ---------------------------------------------------------------------------
// Disk operations
// ---------------------------------------------------------------------------

fn atomic_write(path: &Path, data: &[u8]) -> io::Result<()> {
    let tmp_path = path.with_extension("json.tmp");
    fs::write(&tmp_path, data)?;
    fs::rename(&tmp_path, path)?;
    Ok(())
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/// A (year, semester) pair to fetch.
struct SemesterTarget {
    year: String,
    semester: String,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();
    let interactive = is_interactive();
    init_logger(&args.cache_dir, interactive);

    if interactive {
        hide_cursor();
        // Ensure cursor is restored on ctrl-c
        ctrlc::set_handler(|| {
            show_cursor();
            std::process::exit(130);
        })
        .ok();
    }

    let started = Instant::now();
    log::info!(target: "sogrim_server", "sogrim-fetcher starting, cache_dir={}", args.cache_dir.display());

    let use_proxy = args.proxy_url.is_some();
    let client = Arc::new(CachedSapClient::with_proxy_url(args.proxy_url.clone()));

    // Warm up the proxy (if used) with a lightweight request before doing real work.
    if use_proxy {
        print_spinner(interactive, "warming up proxy");
        for attempt in 1..=5 {
            match client.get_semesters().await {
                Ok(_) => {
                    log::info!(target: "sogrim_server", "Proxy is ready (attempt {attempt})");
                    if interactive {
                        eprint!("\r{}\r", " ".repeat(60));
                    }
                    print_spinner_done(interactive, "warming up proxy");
                    break;
                }
                Err(e) => {
                    if attempt == 5 {
                        log::error!(target: "sogrim_server", "Proxy failed after 5 attempts: {e}");
                        if interactive {
                            eprintln!("\r  warming up proxy... FAILED");
                            show_cursor();
                        }
                        std::process::exit(1);
                    }
                    log::warn!(target: "sogrim_server", "Proxy not ready (attempt {attempt}): {e}");
                    if interactive {
                        eprint!("\r  warming up proxy... retry {attempt}/5");
                        let _ = io::stderr().flush();
                    }
                    tokio::time::sleep(Duration::from_secs(3)).await;
                }
            }
        }
    }

    // Resolve which semesters to fetch
    print_spinner(interactive, "resolving semesters");
    let targets: Vec<SemesterTarget> = if let Some(n) = args.latest {
        // --latest N: fetch the N most recent teaching semesters
        match client.get_semesters().await {
            Ok(all) => all
                .iter()
                .filter(|s| matches!(s.semester.as_str(), "200" | "201" | "202"))
                .take(n as usize)
                .map(|s| SemesterTarget {
                    year: s.year.clone(),
                    semester: s.semester.clone(),
                })
                .collect(),
            Err(e) => {
                log::error!(target: "sogrim_server", "Failed to fetch semesters: {e}");
                if interactive {
                    show_cursor();
                }
                std::process::exit(1);
            }
        }
    } else {
        let year = args.year.as_ref().unwrap();
        if !args.semester.is_empty() {
            args.semester
                .iter()
                .map(|s| SemesterTarget {
                    year: year.clone(),
                    semester: s.to_code().to_string(),
                })
                .collect()
        } else {
            match client.get_semesters().await {
                Ok(all) => all
                    .iter()
                    .filter(|s| {
                        s.year == *year && matches!(s.semester.as_str(), "200" | "201" | "202")
                    })
                    .map(|s| SemesterTarget {
                        year: year.clone(),
                        semester: s.semester.clone(),
                    })
                    .collect(),
                Err(e) => {
                    log::error!(target: "sogrim_server", "Failed to fetch semesters: {e}");
                    if interactive {
                        show_cursor();
                    }
                    std::process::exit(1);
                }
            }
        }
    };
    print_spinner_done(interactive, "resolving semesters");

    if targets.is_empty() {
        log::error!(target: "sogrim_server", "No semesters found");
        if interactive {
            eprintln!("  error: no semesters found");
            show_cursor();
        }
        std::process::exit(1);
    }

    let sem_labels: Vec<String> = targets
        .iter()
        .map(|t| format!("{}/{}", t.year, t.semester))
        .collect();
    log::info!(target: "sogrim_server", "Will fetch: {:?}", sem_labels);

    let concurrency = args.concurrency;
    print_header(interactive, &targets, &args.proxy_url, concurrency);
    // Phase 1: Fetch all indexes (fast, serial — need totals for progress bar)
    struct SemesterWork {
        year: String,
        semester: String,
        label: String,
        sem_dir: PathBuf,
        course_ids: Vec<String>,
    }
    let mut work: Vec<SemesterWork> = Vec::new();
    let mut total_to_fetch = 0usize;

    for target in &targets {
        let label = semester_display(&target.year, &target.semester);
        let sem_dir = args.cache_dir.join(&target.year).join(&target.semester);
        fs::create_dir_all(&sem_dir).unwrap_or_else(|e| {
            log::error!(target: "sogrim_server", "Failed to create {}: {e}", sem_dir.display());
            std::process::exit(1);
        });

        print_spinner(interactive, &format!("[{label}] fetching index"));
        let index = match client
            .get_course_index(&target.year, &target.semester)
            .await
        {
            Ok(idx) => idx,
            Err(e) => {
                log::error!(target: "sogrim_server", "[{label}] failed to fetch course index: {e}");
                continue;
            }
        };
        let index_json = serde_json::to_string_pretty(&*index).expect("failed to serialize index");
        let _ = atomic_write(&sem_dir.join("_index.json"), index_json.as_bytes());
        let course_ids: Vec<String> = index.iter().map(|entry| entry.id.clone()).collect();
        print_spinner_done(
            interactive,
            &format!("[{label}] fetching index ({} courses)", course_ids.len()),
        );
        log::info!(target: "sogrim_server", "[{label}] {} courses", course_ids.len());
        total_to_fetch += course_ids.len();

        work.push(SemesterWork {
            year: target.year.clone(),
            semester: target.semester.clone(),
            label,
            sem_dir,
            course_ids,
        });
    }

    // Phase 2: Fetch ALL semesters concurrently from SAP with one progress bar
    let fetch_bar = ProgressBar::new("fetching from SAP", total_to_fetch, interactive);
    fetch_bar.draw();

    let mut handles = Vec::new();
    for w in &work {
        let c = Arc::clone(&client);
        let year = w.year.clone();
        let sem = w.semester.clone();
        handles.push(tokio::spawn(async move {
            c.fetch_semester_with_concurrency(&year, &sem, concurrency)
                .await;
        }));
    }

    // Poll combined progress until all semesters are done
    let all_done = async {
        for h in &mut handles {
            let _ = h.await;
        }
    };
    tokio::pin!(all_done);
    loop {
        tokio::select! {
            biased;
            _ = &mut all_done => {
                let (_, done) = client.fetch_progress_counts();
                fetch_bar.current.store(done, Ordering::Relaxed);
                fetch_bar.finish();
                break;
            }
            _ = tokio::time::sleep(Duration::from_millis(150)) => {
                let (_, done) = client.fetch_progress_counts();
                fetch_bar.current.store(done, Ordering::Relaxed);
                fetch_bar.draw();
            }
        }
    }

    // Phase 3: Write all semesters to disk with one progress bar
    let disk_bar = ProgressBar::new("writing to disk", total_to_fetch, interactive);
    disk_bar.draw();
    let disk_counter = disk_bar.counter();
    let mut total_courses = 0usize;
    let mut total_errors = 0usize;

    for w in &work {
        let mut written = 0usize;
        let mut errors = 0usize;
        for course_id in &w.course_ids {
            match client
                .get_course_details(&w.year, &w.semester, course_id)
                .await
            {
                Ok(details) => {
                    let json = serde_json::to_string_pretty(&*details)
                        .expect("failed to serialize course");
                    let file_path = w.sem_dir.join(format!("{course_id}.json"));
                    match atomic_write(&file_path, json.as_bytes()) {
                        Ok(()) => written += 1,
                        Err(e) => {
                            log::error!(target: "sogrim_server", "Failed to write {course_id}.json: {e}");
                            errors += 1;
                        }
                    }
                }
                Err(e) => {
                    log::warn!(target: "sogrim_server", "[{}] failed to fetch {course_id}: {e}", w.label);
                    errors += 1;
                }
            }
            disk_counter.fetch_add(1, Ordering::Relaxed);
            disk_bar.draw();
        }
        disk_bar.draw();
        log::info!(target: "sogrim_server", "[{}] done: {written} written, {errors} errors", w.label);
        total_courses += written;
        total_errors += errors;
    }
    disk_bar.finish();

    let elapsed = started.elapsed();
    let (sent, received) = client.transfer_stats();
    log::info!(
        target: "sogrim_server",
        "Fetch complete: {total_courses} courses, {total_errors} errors, {:.1}s, sent={:.1}MB, received={:.1}MB",
        elapsed.as_secs_f64(),
        sent as f64 / 1_048_576.0,
        received as f64 / 1_048_576.0,
    );
    print_summary(
        interactive,
        total_courses,
        total_errors,
        elapsed,
        sent,
        received,
    );
    if interactive {
        show_cursor();
    }
}
