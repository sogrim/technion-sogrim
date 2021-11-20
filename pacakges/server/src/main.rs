extern crate my_internet_ip;
use actix_web::{App, HttpServer, middleware::Logger, web};
use actix_cors::Cors;
use mongodb::Client;
use dotenv::dotenv;
use crate::config::Config;

mod auth;
mod db;
mod course;
mod catalog;
mod user;
mod core;
mod config;

#[actix_web::main]
async fn main() -> std::io::Result<()> {

    dotenv().ok();
    let config = Config::from_env().unwrap();
    let app_config = config.clone();
    let client = Client::with_uri_str(&config.uri).await.expect("failed to connect");
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(client.clone()))
            .wrap(auth::AuthenticateMiddleware)
            .wrap(Cors::permissive())
            .wrap(Logger::default())
            .app_data(app_config.clone())
            .service(catalog::get_all_catalogs)
            .service(user::user_login)
            .service(user::add_catalog)
            .service(user::add_data_from_ug)
            .service(user::compute_degree_status)
            .service(user::update_user_details)
            .service(user::debug)
    })
    .bind((config.ip, config.port))?
    .run()
    .await
}