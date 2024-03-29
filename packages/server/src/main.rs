use crate::config::CONFIG;
use actix_web::{
    web::{self, scope},
    App, HttpResponse, HttpServer,
};
use actix_web_lab::middleware::from_fn;
use db::Db;
use error::AppError;
use middleware::{auth, cors, logger};
use resources::user::Permissions;

mod api;
mod config;
mod consts;
mod core;
mod db;
mod error;
mod middleware;
mod resources;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logger
    logger::init_env_logger();

    // Initialize DB client
    let db = Db::new().await;

    // Start the server
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(db.clone()))
            .app_data(auth::JwtDecoder::new())
            .wrap(cors::cors())
            .wrap(logger::init_actix_logger())
            .service(web::resource("/healthcheck").route(web::get().to(
                |db: web::Data<Db>| async move {
                    db.ping().await?;
                    Result::<HttpResponse, AppError>::Ok(HttpResponse::Ok().finish())
                },
            )))
            .service(
                // Global authentication scope
                // All routes under this scope will be authenticated and authorized
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
                            .service(api::students::update_settings),
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
                            .service(api::owners::delete_course),
                    ),
            )
    })
    .bind(format!("{}:{}", CONFIG.ip, CONFIG.port))?
    .run()
    .await
}
