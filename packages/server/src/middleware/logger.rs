use std::time::{Duration, Instant};

use axum::{extract::Request, middleware::Next, response::Response};
use colored::{Color, ColoredString, Colorize};

const SEP: &str = "  |  ";
const MAX_QUERY_LEN: usize = 20;
const MAX_REQ_LINE_LEN: usize = 52;
const DURATION_TO_DETAILS_OFFSET: usize = 7;

fn log_header_once() {
    static ONCE: tokio::sync::OnceCell<()> = tokio::sync::OnceCell::const_new();
    tokio::spawn(ONCE.get_or_init(|| async {
        log::info!(target: "sogrim_server", "+ ------------------------------------------------------ + -------- + ---------- + --------------------- +");
        log::info!(target: "sogrim_server", "|                       REQUEST                          |  STATUS  |  DURATION  |       DETAILS         |");
        log::info!(target: "sogrim_server", "+ ------------------------------------------------------ + -------- + ---------- + --------------------- +");
    }));
}

pub fn init_env_logger() {
    env_logger::Builder::from_env(env_logger::Env::new().default_filter_or("info"))
        .format_timestamp(None)
        .init();
}

pub async fn log_requests(req: Request, next: Next) -> Response {
    log_header_once();

    let start = Instant::now();
    let method = req.method().to_string();
    let uri = req.uri().clone();

    let query = uri.query().map(|q| format!("?{q}")).unwrap_or_default();
    let path = format!(
        "{}{}",
        uri.path(),
        &query[0..std::cmp::min(query.len(), MAX_QUERY_LEN)]
    );
    let version = format!("{:?}", req.version());
    let request_line = format!(
        "{} {} {}{}",
        method,
        path,
        version,
        " ".repeat(MAX_REQ_LINE_LEN.saturating_sub(method.len() + path.len() + version.len())),
    )
    .yellow()
    .to_string();

    let res = next.run(req).await;

    let status = res.status();
    let elapsed = start.elapsed();

    let status_str = if status.is_success() {
        format!("  {} ", status.as_str().green())
    } else {
        format!("  {} ", status.as_str().red())
    };

    let duration_str = format_duration(elapsed, status.is_success());

    let canonical_reason = status.canonical_reason().unwrap_or_default().to_string();
    let reason_str = if status.is_success() {
        format!("{}", canonical_reason.green().italic())
    } else {
        let extensions = res.extensions();
        let reason = extensions.get::<String>().unwrap_or(&canonical_reason);
        format!("{}", reason.red().italic())
    };

    log::info!(
        target: "sogrim_server",
        " {}{SEP}{}{SEP}{}{SEP}{}",
        request_line.bold(),
        status_str.bold(),
        duration_str.bold(),
        reason_str.bold(),
    );

    res
}

fn format_duration(duration: Duration, is_success: bool) -> String {
    fn __format_duration(duration: Duration) -> ColoredString {
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
            let t = ((duration_micros - 500_000) as f32 / 500_000.).min(1.);
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
    }
    if is_success {
        let duration = __format_duration(duration);
        format!(
            " {}{}",
            duration,
            " ".repeat(DURATION_TO_DETAILS_OFFSET - duration.chars().count()),
        )
    } else {
        let duration = __format_duration(duration).red();
        format!(
            " {}{}",
            duration,
            " ".repeat(DURATION_TO_DETAILS_OFFSET - duration.chars().count()),
        )
    }
}
