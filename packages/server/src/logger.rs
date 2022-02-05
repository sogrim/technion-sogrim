use actix_web::middleware::Logger;
use colored::Colorize;

pub fn init_env_logger() {
    env_logger::Builder::from_env(env_logger::Env::new().default_filter_or("info"))
        .format_timestamp(None)
        .init();
}
pub fn init_actix_logger() -> Logger {
    Logger::new(
        format!(
            "{} | {} | {} seconds",
            "%r".yellow(),
            "%s".bold().magenta(),
            "%T".cyan()
        )
        .as_str(),
    )
    .log_target("sogrim_server")
}
