use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use chrono::Local;
use env_logger::Builder;
use log::LevelFilter;

use crate::resources::course::CourseId;
use crate::sap::{CachedSapClient, CourseIndexEntry};

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
#[derive(clap::Args)]
pub struct FetcherArgs {
    /// Fetch the N most recent semesters (max 3). Conflicts with --year/--semester.
    #[arg(long, conflicts_with_all = &["year", "semester"], value_parser = clap::value_parser!(u8).range(1..=3))]
    latest: Option<u8>,

    /// Academic year (e.g. 2025). Required unless --latest or --repair is used.
    #[arg(long, required_unless_present_any = &["latest", "repair"])]
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

    /// Repair mode: scan all semesters in the cache, fetch missing courses,
    /// and write them to disk. Fails hard if any course cannot be fetched.
    #[arg(long, conflicts_with_all = &["latest", "year", "semester"])]
    repair: bool,
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
// Repair
// ---------------------------------------------------------------------------

struct MissingCourse {
    year: String,
    semester: String,
    course_id: CourseId,
    sem_dir: PathBuf,
}

fn scan_missing(cache_dir: &Path) -> Vec<MissingCourse> {
    let mut missing = Vec::new();

    let Ok(years) = fs::read_dir(cache_dir) else {
        return missing;
    };

    for year_entry in years.flatten() {
        let year = year_entry.file_name().to_string_lossy().to_string();
        if !year_entry.path().is_dir() || year.starts_with('_') {
            continue;
        }

        let Ok(sems) = fs::read_dir(year_entry.path()) else {
            continue;
        };

        for sem_entry in sems.flatten() {
            let semester = sem_entry.file_name().to_string_lossy().to_string();
            let sem_dir = sem_entry.path();
            if !sem_dir.is_dir() || semester.starts_with('_') {
                continue;
            }

            let index_path = sem_dir.join("_index.json");
            let Ok(data) = fs::read_to_string(&index_path) else {
                continue;
            };
            let Ok(index) = serde_json::from_str::<Vec<CourseIndexEntry>>(&data) else {
                continue;
            };

            for entry in &index {
                let course_file = sem_dir.join(format!("{}.json", entry.id));
                if !course_file.exists() {
                    missing.push(MissingCourse {
                        year: year.clone(),
                        semester: semester.clone(),
                        course_id: entry.id.clone(),
                        sem_dir: sem_dir.clone(),
                    });
                }
            }
        }
    }

    // Sort for deterministic output
    missing.sort_by(|a, b| {
        (&a.year, &a.semester, &a.course_id).cmp(&(&b.year, &b.semester, &b.course_id))
    });
    missing
}

async fn run_repair(args: &FetcherArgs) {
    let interactive = is_interactive();
    let started = Instant::now();

    // Phase 1: Scan for missing courses
    print_spinner(interactive, "scanning cache for missing courses");
    let missing = scan_missing(&args.cache_dir);
    if interactive {
        eprint!("\r{}\r", " ".repeat(60));
    }

    if missing.is_empty() {
        log::info!(target: "sogrim_server", "Repair: all indexes are consistent, nothing to do");
        if interactive {
            eprintln!("  all indexes are consistent, nothing to do");
        }
        return;
    }

    // Group by semester for display
    let mut by_sem: std::collections::BTreeMap<String, Vec<&CourseId>> =
        std::collections::BTreeMap::new();
    for m in &missing {
        by_sem
            .entry(format!("{}/{}", m.year, m.semester))
            .or_default()
            .push(&m.course_id);
    }

    log::info!(target: "sogrim_server", "Repair: {} missing courses across {} semesters", missing.len(), by_sem.len());
    if interactive {
        eprintln!(
            "  found {} missing courses across {} semesters:",
            missing.len(),
            by_sem.len()
        );
        for (sem, ids) in &by_sem {
            let label = {
                let parts: Vec<&str> = sem.split('/').collect();
                semester_display(parts[0], parts[1])
            };
            eprintln!("    {label}: {} missing", ids.len());
        }
        eprintln!();
    }

    // Phase 2: Warm up proxy if needed
    let use_proxy = args.proxy_url.is_some();
    let client = Arc::new(CachedSapClient::with_proxy_url(args.proxy_url.clone()));

    if use_proxy {
        print_spinner(interactive, "warming up proxy");
        for attempt in 1..=5 {
            match client.get_semesters().await {
                Ok(_) => {
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

    // Phase 3: Fetch missing courses
    let bar = ProgressBar::new("fetching missing courses", missing.len(), interactive);
    bar.draw();
    let counter = bar.counter();
    let mut fetched = 0usize;
    let mut failed: Vec<String> = Vec::new();

    for m in &missing {
        match client
            .get_course_details(&m.year, &m.semester, &m.course_id)
            .await
        {
            Ok(details) => {
                let json =
                    serde_json::to_string_pretty(&*details).expect("failed to serialize course");
                let file_path = m.sem_dir.join(format!("{}.json", m.course_id));
                match atomic_write(&file_path, json.as_bytes()) {
                    Ok(()) => {
                        log::info!(target: "sogrim_server", "Repaired: {}/{}/{}", m.year, m.semester, m.course_id);
                        fetched += 1;
                    }
                    Err(e) => {
                        log::error!(target: "sogrim_server", "Failed to write {}/{}/{}: {e}", m.year, m.semester, m.course_id);
                        failed.push(format!("{}/{}/{}", m.year, m.semester, m.course_id));
                    }
                }
            }
            Err(e) => {
                log::error!(target: "sogrim_server", "Failed to fetch {}/{}/{}: {e}", m.year, m.semester, m.course_id);
                failed.push(format!("{}/{}/{}", m.year, m.semester, m.course_id));
            }
        }
        counter.fetch_add(1, Ordering::Relaxed);
        bar.draw();
    }
    bar.finish();

    // Phase 4: Remove phantoms from indexes
    let phantoms: Vec<&MissingCourse> = failed
        .iter()
        .filter_map(|key| {
            missing
                .iter()
                .find(|m| format!("{}/{}/{}", m.year, m.semester, m.course_id) == *key)
        })
        .collect();

    // Group phantoms by semester
    let mut phantoms_by_sem: std::collections::BTreeMap<String, Vec<&CourseId>> =
        std::collections::BTreeMap::new();
    for p in &phantoms {
        phantoms_by_sem
            .entry(format!("{}/{}", p.year, p.semester))
            .or_default()
            .push(&p.course_id);
    }

    let mut removed = 0usize;
    for (sem_key, phantom_ids) in &phantoms_by_sem {
        let parts: Vec<&str> = sem_key.split('/').collect();
        let (year, semester) = (parts[0], parts[1]);
        let sem_dir = args.cache_dir.join(year).join(semester);
        let index_path = sem_dir.join("_index.json");

        let Ok(data) = fs::read_to_string(&index_path) else {
            continue;
        };
        let Ok(index) = serde_json::from_str::<Vec<CourseIndexEntry>>(&data) else {
            continue;
        };

        let phantom_set: std::collections::HashSet<&CourseId> = phantom_ids.iter().copied().collect();
        let filtered: Vec<&CourseIndexEntry> = index
            .iter()
            .filter(|e| !phantom_set.contains(&e.id))
            .collect();

        let before = index.len();
        let after = filtered.len();
        let index_json =
            serde_json::to_string_pretty(&filtered).expect("failed to serialize index");
        let _ = atomic_write(&index_path, index_json.as_bytes());
        let label = semester_display(year, semester);
        log::info!(
            target: "sogrim_server",
            "[{label}] rebuilt index: {before} → {after} (removed {} phantoms)",
            before - after
        );
        removed += before - after;
    }

    // Phase 5: Verify
    let still_missing = scan_missing(&args.cache_dir);
    let elapsed = started.elapsed();

    log::info!(
        target: "sogrim_server",
        "Repair complete: {fetched} fetched, {removed} phantoms removed from indexes, {} still missing, {:.1}s",
        still_missing.len(),
        elapsed.as_secs_f64(),
    );

    if interactive {
        eprintln!();
        eprintln!("  ──────────────────────────────────────");
        eprintln!("  fetched:          {fetched} courses");
        eprintln!("  phantoms removed: {removed} from indexes");
        eprintln!("  still missing:    {}", still_missing.len());
        eprintln!("  elapsed:          {:.1}s", elapsed.as_secs_f64());
        eprintln!("  ──────────────────────────────────────");
    }

    if !still_missing.is_empty() {
        log::error!(target: "sogrim_server", "Repair incomplete: {} courses still missing:", still_missing.len());
        for m in &still_missing {
            log::error!(target: "sogrim_server", "  {}/{}/{}", m.year, m.semester, m.course_id);
        }
        if interactive {
            eprintln!();
            eprintln!("  WARNING — still missing:");
            for m in &still_missing {
                let label = semester_display(&m.year, &m.semester);
                eprintln!("    {label}: {}", m.course_id);
            }
        }
        std::process::exit(1);
    }

    if interactive {
        eprintln!();
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/// A (year, semester) pair to fetch.
struct SemesterTarget {
    year: String,
    semester: String,
}

pub async fn run(args: FetcherArgs) {
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

    // Repair mode: scan + fetch missing courses, then exit
    if args.repair {
        run_repair(&args).await;
        if interactive {
            show_cursor();
        }
        return;
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
    log::info!(target: "sogrim_server", "Will fetch: {sem_labels:?}");

    let concurrency = args.concurrency;
    print_header(interactive, &targets, &args.proxy_url, concurrency);
    // Phase 1: Fetch all indexes (fast, serial — need totals for progress bar)
    struct SemesterWork {
        year: String,
        semester: String,
        label: String,
        sem_dir: PathBuf,
        course_ids: Vec<CourseId>,
        index: Vec<CourseIndexEntry>,
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
        let course_ids: Vec<CourseId> = index.iter().map(|entry| entry.id.clone()).collect();
        print_spinner_done(
            interactive,
            &format!("[{label}] fetching index ({} courses)", course_ids.len()),
        );
        log::info!(target: "sogrim_server", "[{label}] {} courses", course_ids.len());
        total_to_fetch += course_ids.len();

        let index_vec: Vec<CourseIndexEntry> = index.as_ref().clone();
        work.push(SemesterWork {
            year: target.year.clone(),
            semester: target.semester.clone(),
            label,
            sem_dir,
            course_ids,
            index: index_vec,
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

    for w in &mut work {
        let mut written = 0usize;
        let mut errors = 0usize;
        let mut failed_ids: Vec<CourseId> = Vec::new();
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
                            failed_ids.push(course_id.clone());
                            errors += 1;
                        }
                    }
                }
                Err(e) => {
                    log::warn!(target: "sogrim_server", "[{}] failed to fetch {course_id}: {e}", w.label);
                    failed_ids.push(course_id.clone());
                    errors += 1;
                }
            }
            disk_counter.fetch_add(1, Ordering::Relaxed);
            disk_bar.draw();
        }
        disk_bar.draw();

        // Rebuild index excluding failed courses
        if !failed_ids.is_empty() {
            let failed_set: std::collections::HashSet<&CourseId> =
                failed_ids.iter().collect();
            w.course_ids.retain(|id| !failed_set.contains(id));
            let filtered_index: Vec<&CourseIndexEntry> = w
                .index
                .iter()
                .filter(|e| !failed_set.contains(&e.id))
                .collect();
            let index_json =
                serde_json::to_string_pretty(&filtered_index).expect("failed to serialize index");
            let _ = atomic_write(&w.sem_dir.join("_index.json"), index_json.as_bytes());
            log::info!(
                target: "sogrim_server",
                "[{}] rebuilt index: removed {} phantom courses",
                w.label,
                failed_ids.len()
            );
        }

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
