use crate::config::CONFIG;
use actix_web::{
    web::{self, scope},
    App, HttpResponse, HttpServer,
};
use actix_web_lab::middleware::from_fn;
use db::Db;
use disk_cache::DiskCourseCache;
use error::AppError;
use log::info;
use middleware::{auth, cors, jwt_decoder::JwtDecoder, logger};
use resources::user::Permissions;
use std::path::PathBuf;

mod api;
mod config;
mod consts;
mod core;
mod db;
mod disk_cache;
mod error;
mod middleware;
mod resources;

const CACHE_DIR_ENV: &str = "SOGRIM_CACHE_DIR";
const DEFAULT_CACHE_DIR: &str = "/home/opc/cache";

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let now = std::time::Instant::now();
    // Initialize logger
    logger::init_env_logger();
    info!(target: "server", "Initialized logger in {}μs", now.elapsed().as_micros());

    // Initialize DB client
    let db = Db::new().await;
    info!(target: "server", "Initialized DB client in {}ms", now.elapsed().as_millis());

    // Initialize JWT decoder
    let jwt_decoder = JwtDecoder::new().await;
    info!(target: "server", "Initialized JWT decoder in {}ms", now.elapsed().as_millis());

    // Initialize disk-backed course cache
    let cache_dir = std::env::var(CACHE_DIR_ENV).unwrap_or_else(|_| DEFAULT_CACHE_DIR.to_string());
    let course_cache = web::Data::new(DiskCourseCache::new(PathBuf::from(&cache_dir)));

    // Load all disk cache into memory on startup
    course_cache.load_all().await;

    // Start the server
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db.clone()))
            .app_data(course_cache.clone())
            .app_data(jwt_decoder.clone())
            .wrap(cors::cors())
            .wrap(logger::init_actix_logger())
            .service(web::resource("/healthcheck").route(web::get().to(
                |db: web::Data<Db>| async move {
                    db.ping().await?;
                    Result::<HttpResponse, AppError>::Ok(HttpResponse::Ok().finish())
                },
            )))
            .service(api::courses::get_semesters)
            .service(api::courses::get_course_index)
            .service(api::courses::get_course)
            .service(
                // Global authentication scope
                scope("")
                    .wrap(from_fn(auth::authenticate))
                    .service(
                        scope("/students")
                            .app_data(web::Data::new(Permissions::Student))
                            .service(api::students::get_catalogs)
                            .service(api::students::login)
                            .service(api::students::update_catalog)
                            .service(api::students::get_courses_by_filter)
                            .service(api::students::add_courses)
                            .service(api::students::compute_degree_status)
                            .service(api::students::update_details)
                            .service(api::students::update_settings)
                            .service(api::students::get_timetable)
                            .service(api::students::update_timetable),
                    )
                    .service(
                        scope("/admins")
                            .app_data(web::Data::new(Permissions::Admin))
                            .service(api::admins::parse_courses_and_compute_degree_status),
                    )
                    .service(
                        scope("/owners")
                            .app_data(web::Data::new(Permissions::Owner))
                            .service(api::owners::get_all_courses)
                            .service(api::owners::get_course_by_id)
                            .service(api::owners::create_or_update_course)
                            .service(api::owners::delete_course)
                            .service(api::owners::get_catalog_by_id)
                            .service(api::owners::create_or_update_catalog),
                    ),
            )
    })
    .bind(format!("{}:{}", CONFIG.ip, CONFIG.port))?
    .run()
    .await
}
