use std::path::PathBuf;
use std::sync::Arc;

use axum::{
    extract::Extension,
    routing::{delete, get, post, put},
    Router,
};
use log::info;
use anyhow::Context;
use sogrim_server::config::Config;

// Re-export library modules so server-specific submodules can use crate:: paths
pub use sogrim_server::{consts, core, db, error, resources};

mod api;
mod disk_cache;
mod middleware;

use db::Db;
use disk_cache::DiskCourseCache;
use error::AppError;
use middleware::{auth, cors, jwt_decoder::JwtDecoder, logger};
use resources::user::Permissions;

const CACHE_DIR_ENV: &str = "SOGRIM_CACHE_DIR";
const DEFAULT_CACHE_DIR: &str = "/home/opc/cache";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let _ = dotenvy::dotenv();

    let now = std::time::Instant::now();
    // Initialize logger
    logger::init_env_logger();
    info!(target: "server", "Initialized logger in {}μs", now.elapsed().as_micros());

    // Load configuration from environment variables
    let config = Config::from_env().context("failed to load configuration")?;
    let is_debug = config.profile == "debug";

    // Initialize DB client
    let db = Db::connect(&config.uri, &config.profile)
        .await
        .context("failed to connect to MongoDB")?;
    info!(target: "server", "Initialized DB client in {}ms", now.elapsed().as_millis());

    // Initialize JWT decoder
    let jwt_decoder = JwtDecoder::new(config.client_id).await;
    info!(target: "server", "Initialized JWT decoder in {}ms", now.elapsed().as_millis());

    // Initialize disk-backed course cache
    let cache_dir = std::env::var(CACHE_DIR_ENV).unwrap_or_else(|_| DEFAULT_CACHE_DIR.to_string());
    let course_cache = Arc::new(DiskCourseCache::new(PathBuf::from(&cache_dir)));

    // Load all disk cache into memory on startup
    let cache_start = std::time::Instant::now();
    course_cache.load_all().await;
    info!(target: "server", "Loaded disk cache in {}ms", cache_start.elapsed().as_millis());

    // Public routes (no auth required)
    let public_routes = Router::new()
        .route(
            "/healthcheck",
            get(|Extension(db): Extension<Db>| async move {
                db.ping().await?;
                Result::<_, AppError>::Ok(http::StatusCode::OK)
            }),
        )
        .route("/semesters", get(api::courses::get_semesters))
        .route(
            "/courses/{year}/{semester}/index",
            get(api::courses::get_course_index),
        )
        .route(
            "/courses/{year}/{semester}/{course_id}",
            get(api::courses::get_course),
        );

    // Student routes
    let student_routes = Router::new()
        .route("/catalogs", get(api::students::get_catalogs))
        .route("/login", get(api::students::login))
        .route("/catalog", put(api::students::update_catalog))
        .route("/courses", get(api::students::get_courses_by_filter))
        .route("/courses", post(api::students::add_courses))
        .route("/degree-status", get(api::students::compute_degree_status))
        .route("/details", put(api::students::update_details))
        .route("/settings", put(api::students::update_settings))
        .route("/timetable", get(api::students::get_timetable))
        .route("/timetable", put(api::students::update_timetable))
        .layer(Extension(Permissions::Student));

    // Admin routes
    let admin_routes = Router::new()
        .route(
            "/parse-compute",
            post(api::admins::parse_courses_and_compute_degree_status),
        )
        .layer(Extension(Permissions::Admin));

    // Owner routes
    let owner_routes = Router::new()
        .route("/courses", get(api::owners::get_all_courses))
        .route("/courses/{id}", get(api::owners::get_course_by_id))
        .route("/courses/{id}", put(api::owners::create_or_update_course))
        .route("/courses/{id}", delete(api::owners::delete_course))
        .route("/catalogs/{id}", get(api::owners::get_catalog_by_id))
        .route("/catalogs/{id}", put(api::owners::create_or_update_catalog))
        .layer(Extension(Permissions::Owner));

    // Auth-protected routes
    let auth_routes = Router::new()
        .nest("/students", student_routes)
        .nest("/admins", admin_routes)
        .nest("/owners", owner_routes)
        .layer(axum::middleware::from_fn(auth::authenticate));

    let app = Router::new()
        .merge(public_routes)
        .merge(auth_routes)
        .layer(axum::middleware::from_fn(logger::log_requests))
        .layer(cors::cors(is_debug))
        .layer(Extension(db))
        .layer(Extension(course_cache))
        .layer(Extension(jwt_decoder));

    let addr = format!("0.0.0.0:{}", config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    info!(target: "server", "Listening on {addr}");
    Ok(axum::serve(listener, app).await?)
}
