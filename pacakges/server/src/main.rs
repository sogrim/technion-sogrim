extern crate my_internet_ip;
use actix_web::{App, HttpServer, Responder, get, middleware::Logger, web};
use actix_web_httpauth::middleware::HttpAuthentication;
use mongodb::Client;

mod auth;
mod db;
mod course;
mod user;
mod core;

#[get("/")]
async fn home_page() -> impl Responder{
    "Hello world!"
}


#[actix_web::main]
async fn main() -> std::io::Result<()> {

    std::env::set_var("RUST_LOG", "actix_web=debug,actix_server=info");
    let uri = std::env::var("MONGODB_URI")
        .unwrap_or_else(|_| "mongodb://localhost:27017".into());

    let client = Client::with_uri_str(uri).await.expect("failed to connect");

    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(client.clone()))
            //.wrap(HttpAuthentication::bearer(auth::validator))
            .wrap(Logger::default())
            .service(home_page)
            .service(user::debug)
            .service(user::user_login)
            .service(user::compute_degree_status)
            .service(user::add_data_from_ug)
    })
    .bind("0.0.0.0:5545")?
    .run()
    .await
}