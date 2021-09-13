#[macro_use] extern crate rocket;
use anyhow::{Context, Error};
use reqwest::header::{ACCEPT, AUTHORIZATION, USER_AGENT};
use rocket::http::{Cookie, CookieJar, SameSite};
use rocket::{routes};
use rocket::response::{Debug, Redirect};
use rocket_oauth2::{OAuth2, TokenResponse};
use serde_json::{self, Value};

/// User information to be retrieved from the GitHub API.
#[derive(serde::Deserialize)]
struct GitHubUserInfo {
    #[serde(default)]
    name: String,
}

/// User information to be retrieved from the Google People API.
#[derive(serde::Deserialize)]
struct GoogleUserInfo {
    names: Vec<Value>,
}

#[get("/login/github")]
fn github_login(oauth2: OAuth2<GitHubUserInfo>, cookies: &CookieJar<'_>) -> Redirect {
    oauth2.get_redirect(cookies, &["user:read"]).unwrap()
}

#[get("/auth/github")]
async fn github_callback( token: TokenResponse<GitHubUserInfo>, cookies: &CookieJar<'_>) -> Result<Redirect, Debug<Error>> {
    // Use the token to retrieve the user's GitHub account information.
    let user_info: GitHubUserInfo = reqwest::Client::builder()
        .build()
        .context("failed to build reqwest client")?
        .get("https://api.github.com/user")
        .header(AUTHORIZATION, format!("token {}", token.access_token()))
        .header(ACCEPT, "application/vnd.github.v3+json")
        .header(USER_AGENT, "rocket_oauth2 demo application")
        .send()
        .await
        .context("failed to complete request")?
        .json()
        .await
        .context("failed to deserialize response")?;

    // Set a private cookie with the user's name, and redirect to the home page.
    cookies.add_private(
        Cookie::build("username", user_info.name)
            .same_site(SameSite::Lax)
            .finish(),
    );
    Ok(Redirect::to("/login"))
}

#[get("/login/google")]
fn google_login(oauth2: OAuth2<GoogleUserInfo>, cookies: &CookieJar<'_>) -> Redirect {
    oauth2.get_redirect(cookies, &["profile"]).unwrap()
}

#[get("/auth/google")]
async fn google_callback(
    token: TokenResponse<GoogleUserInfo>,
    cookies: &CookieJar<'_>,
) -> Result<Redirect, Debug<Error>> {
    // Use the token to retrieve the user's Google account information.
    let response = reqwest::Client::builder()
        .build()
        .context("failed to build reqwest client")?
        .get("https://people.googleapis.com/v1/people/me?personFields=names")
        .header(AUTHORIZATION, format!("Bearer {}", token.access_token()))
        .send()
        .await
        .context("failed to complete request")?;

    let respone_txt = response.text().await.unwrap_or("couldn't unwrap response".to_string());
    println!("{}", respone_txt);

    let user_info : GoogleUserInfo = reqwest::Client::builder()
        .build()
        .context("failed to build reqwest client")?
        .get("https://people.googleapis.com/v1/people/me?personFields=names")
        .header(AUTHORIZATION, format!("Bearer {}", token.access_token()))
        .send()
        .await
        .context("failed to complete request")?   
        .json()
        .await
        .context("failed to deserialize response")?;   

    let real_name = user_info
        .names
        .first()
        .and_then(|n| n.get("displayName"))
        .and_then(|s| s.as_str())
        .unwrap_or("");

    // Set a private cookie with the user's name, and redirect to the home page.
    cookies.add_private(
        Cookie::build("username", real_name.to_string())
            .same_site(SameSite::Lax)
            .finish(),
    );
    Ok(Redirect::to("/login"))
}

#[get("/login")]
fn successful_login (cookies: &CookieJar<'_>) -> String{
    let token = cookies.get_private("username");
    match token{
        Some(cookie) => {
            let username : String = cookie.to_string().strip_prefix("username=").unwrap().into();
            format!("Hello {}, welcome to Sogrim!", username)
        },
        None => "Bad token".into(),
    }
    
}

#[get("/")]
fn index () -> &'static str{
    "index"
}

#[launch]
fn rocket() -> _ {

    let external_ip_addr = my_internet_ip::get().unwrap().to_string();
    println!("Starting rocket app at http://{}:{}", external_ip_addr, std::env::var("ROCKET_PORT").unwrap_or("no port".to_string()));

    rocket::build()
        .mount("/", routes![github_callback, github_login, 
        google_callback, google_login, successful_login, index])
        .attach(OAuth2::<GitHubUserInfo>::fairing("github"))
        .attach(OAuth2::<GoogleUserInfo>::fairing("google"))
}
