extern crate my_internet_ip;
use crate::config::CONFIG;
use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpServer};
use dotenv::dotenv;
use mongodb::Client;

mod auth;
mod catalog;
mod config;
mod core;
mod course;
mod db;
mod user;

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
            .wrap(auth::AuthenticateMiddleware)
            .wrap(Cors::permissive())
            .wrap(Logger::default())
            .service(catalog::get_all_catalogs)
            .service(user::login)
            .service(user::add_catalog)
            .service(user::add_courses)
            .service(user::compute_degree_status)
            .service(user::update_details)
            .service(user::debug)
    })
    .bind((CONFIG.ip, CONFIG.port))?
    .run()
    .await
}
