use crate::config::CONFIG;
use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use dotenv::dotenv;
use mongodb::Client;

mod api;
mod config;
mod core;
mod db;
mod logger;
mod middleware;
mod resources;

#[macro_export]
macro_rules! sogrim_server {
    ($mongo_client:ident) => {
        App::new()
            .app_data(web::Data::new($mongo_client.clone()))
            .wrap(middleware::auth::AuthenticateMiddleware)
            .wrap(Cors::permissive())
            .wrap(logger::init_actix_logger())
            .service(api::students::get_all_catalogs)
            .service(api::students::login)
            .service(api::students::add_catalog)
            .service(api::students::add_courses)
            .service(api::students::compute_degree_status)
            .service(api::students::update_details)
            .service(api::bo::get_all_courses)
            .service(api::bo::get_course_by_id)
            .service(api::bo::create_or_update_course)
            .service(api::bo::delete_course)
    };
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load .env (in development environment)
    dotenv().ok();

    // Initialize logger
    logger::init_env_logger();

    // Initialize MongoDB client
    let client = init_mongodb_client!();

    // Start the server
    HttpServer::new(move || sogrim_server!(client))
        .bind((CONFIG.ip, CONFIG.port))?
        .run()
        .await
}
