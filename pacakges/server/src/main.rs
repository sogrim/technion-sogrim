extern crate rocket_db_pools;
extern crate my_internet_ip;
#[macro_use] extern crate rocket;

mod oauth2;
mod db;
mod course;
mod user;
mod core;

use oauth2::{GitHubUserInfo, GoogleUserInfo};
use db::Db;

pub use rocket::{Rocket, Build, State};
pub use rocket::http::{CookieJar, Status};
use rocket::figment::providers::Env;
use rocket_db_pools::Database;
use rocket_oauth2::OAuth2;
use rocket::{get, routes};

#[get("/")]
async fn home_page(cookies: &CookieJar<'_>) -> String{
    let token = cookies.get_private("username");
    match token{
        Some(cookie) => {
            let username : String = cookie.to_string().strip_prefix("username=").unwrap().into();
            format!("Hello {}, welcome to Sogrim!", username)
        },
        None => "Hello guest (you are logged out), welcome to Sogrim!".into(),
    }
}

pub fn rocket_build() -> Rocket<Build> {

    let env = Env::var("ROCKET_PROFILE").unwrap_or("debug".into());
    if env == "debug" {
        let external_ip_addr = my_internet_ip::get().unwrap().to_string();
        println!("Starting rocket app at http://localhost:{}", 5545);   
        println!("Try github oauth2 at http://localhost:{}/login/github", 5545);   
        println!("URL with external ip address at http://{}:{}", external_ip_addr, 5545);   
    }
    
    rocket::build()
        .manage(env)
        .attach(Db::init())
        .mount("/", 
        routes![
            oauth2::github_callback, 
            oauth2::github_login, 
            oauth2::google_callback, 
            oauth2::google_login,
            oauth2::logout, 
            user::fetch_or_insert_user,
            //user::update_user_details, <<< Broken
            user::user_login_redirect,
            user::user_greet,
            user::user_request_redirect,
            user::compute_degree_status_for_user,
            home_page,
            ])
        .attach(OAuth2::<GitHubUserInfo>::fairing("github"))
        .attach(OAuth2::<GoogleUserInfo>::fairing("google"))
}

#[launch]
fn rocket() -> Rocket<Build> {
    rocket_build()
}
