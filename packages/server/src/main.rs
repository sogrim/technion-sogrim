extern crate my_internet_ip;
use crate::config::CONFIG;
use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpServer};
use dotenv::dotenv;
use mongodb::Client;

mod api;
mod config;
mod core;
mod db;
mod middleware;
mod resources;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    let client = Client::with_uri_str(&CONFIG.uri)
        .await
        .expect("failed to connect");
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(client.clone()))
            .wrap(middleware::auth::AuthenticateMiddleware)
            .wrap(Cors::permissive())
            .wrap(Logger::default())
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
            .service(api::bo::get_catalog_by_id)
            .service(api::bo::create_or_update_catalog)
    })
    .bind((CONFIG.ip, CONFIG.port))?
    .run()
    .await
}
