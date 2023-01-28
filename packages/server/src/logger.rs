use std::time::{Duration, Instant};

use actix_web::{middleware::Logger, HttpMessage};
use colored::{Color, Colorize};

const SEP: &str = "  |  ";
const MAX_QUERY_LEN: usize = 20;
const MAX_REQ_LINE_LEN: usize = 52;

fn format_duration(duration: Duration) -> String {
    // lerp between green, yellow and red depending on the duration
    let duration_micros = duration.as_micros();
    let green = (0., 255., 0.);
    let yellow = (255., 255., 0.);
    let dark_yellow = (180., 180., 0.);
    let color = if duration_micros <= 500_000 {
        let t = duration_micros as f32 / 500_000.;
        (
            green.0 * (1. - t) + yellow.0 * t,
            green.1 * (1. - t) + yellow.1 * t,
            green.2 * (1. - t) + yellow.2 * t,
        )
    } else {
        let t = (duration_micros - 500_000) as f32 / 500_000.;
        (
            yellow.0 * (1. - t) + dark_yellow.0 * t,
            yellow.1 * (1. - t) + dark_yellow.1 * t,
            yellow.2 * (1. - t) + dark_yellow.2 * t,
        )
    };
    let color = Color::TrueColor {
        r: color.0 as u8,
        g: color.1 as u8,
        b: color.2 as u8,
    };
    match duration_micros {
        0..=999 => format!("{}μs", duration.as_micros()).color(color),
        1000..=499_999 => format!("{}ms", duration.as_millis()).color(color),
        500_000..=999_999 => format!("{}ms", duration.as_millis()).color(color),
        _ => format!("{:.2}s", duration.as_secs_f32()).color(color),
    }
    .to_string()
}

fn log_header_once() {
    static ONCE: tokio::sync::OnceCell<()> = tokio::sync::OnceCell::const_new();
    tokio::spawn(ONCE.get_or_init(|| async {
        log::info!(target: "sogrim_server", "+ ------------------------------------------------------ + -------- + ---------- +");
        log::info!(target: "sogrim_server", "|                       REQUEST                          |  STATUS  |  DURATION  |");
        log::info!(target: "sogrim_server", "+ ------------------------------------------------------ + -------- + ---------- +");
    }));
}

pub fn init_env_logger() {
    env_logger::Builder::from_env(env_logger::Env::new().default_filter_or("info"))
        .format_timestamp(None)
        .init();
}

pub fn init_actix_logger() -> Logger {
    log_header_once();
    Logger::new(
        format!(
            " {}{SEP}{}{}",
            "%{method}xi",
            "%{status}xo".bold(),
            "%{reason}xo".bold(),
        )
        .as_str(),
    )
    .custom_request_replace("method", |req| {
        // Adding the start time to the request extensions is a hack to measure the duration of handling a request.
        // This hack works because:
        // 1. The logger middleware is the FIRST and LAST middleware to be called.
        // 2. custom_request_replace is called BEFORE the request is handled.
        // 3. custom_response_replace is called AFTER the response is handled.
        // This means that the start time is stored in the request extensions BEFORE the request is handled
        // and then retrieved in the response formatter AFTER the response is handled.
        let start = Instant::now();
        req.extensions_mut().insert(start);

        let method = &req.method().as_str();
        let query = if req.query_string().is_empty() {
            String::new()
        } else {
            format!("?{}", req.query_string())
        };
        let path = format!(
            "{}{}",
            req.path(),
            &query[0..std::cmp::min(query.len(), MAX_QUERY_LEN)]
        );
        let version = format!("{:?}", req.version());
        format!(
            "{} {} {}{}",
            method,
            path,
            version,
            " ".repeat(MAX_REQ_LINE_LEN.saturating_sub(method.len() + path.len() + version.len())),
        )
        .yellow()
        .to_string()
    })
    .custom_response_replace("status", |res| {
        let extensions = res.request().extensions();
        let start = extensions
            .get::<Instant>()
            .copied()
            .unwrap_or_else(Instant::now);
        if res.status().is_success() {
            format!(
                "  {} {SEP} {}",
                res.status().as_str().green(),
                format_duration(start.elapsed())
            )
        } else {
            format!("  {} ", res.status().as_str().red())
        }
    })
    .custom_response_replace("reason", |res| {
        if res.status().is_success() {
            // no reason for success
            String::new()
        } else {
            // get the error from extensions
            let extensions = res.response().extensions();
            let reason = extensions
                .get::<String>()
                .map(|e| e.red().italic())
                .unwrap_or_default();
            format!("{SEP}{}", reason)
        }
    })
    .log_target("sogrim_server")
}
