use anyhow::{Context, Error};
use reqwest::header::{ACCEPT, AUTHORIZATION, USER_AGENT};
use rocket::http::{Cookie, CookieJar, SameSite};
use rocket::response::{Debug, Redirect};
use rocket_oauth2::{OAuth2, TokenResponse};
use serde_json::{self, Value};

/// User information to be retrieved from the GitHub API.
#[derive(Debug, serde::Deserialize)]
#[serde(transparent)]
pub struct GitHubUserInfo {
    emails: Vec<Value>,
}

/// User information to be retrieved from the Google People API.
#[derive(serde::Deserialize)]
pub struct GoogleUserInfo {
    picture : String,
    email : String,    
}

#[get("/login/github")]
pub fn github_login(oauth2: OAuth2<GitHubUserInfo>, cookies: &CookieJar<'_>) -> Redirect {
    oauth2.get_redirect(cookies, &["user:email"]).unwrap()
}

#[get("/auth/github")]
pub async fn github_callback(token: TokenResponse<GitHubUserInfo>, cookies: &CookieJar<'_>) -> Result<Redirect, Debug<Error>> {
    
    // Use the token to retrieve the user's GitHub account information.
    let user_info: GitHubUserInfo = reqwest::Client::builder()
        .build()
        .context("failed to build reqwest client")?
        .get("https://api.github.com/user/emails")
        .header(AUTHORIZATION, format!("token {}", token.access_token()))
        .header(ACCEPT, "application/vnd.github.v3+json")
        .header(USER_AGENT, "Sogrim-App-Server")
        .send()
        .await
        .context("failed to complete request")?
        .json()
        .await
        .context("failed to deserialize response")?;

    //Extract user email from response
    let email = user_info
        .emails
        .first()
        .and_then(|json_obj| json_obj.get("email"))
        .and_then(|field| field.as_str())
        .context("failed to parse email from response")?;

    // Set a private cookie with the user's name, and redirect to the home page.
    cookies.add_private(
        Cookie::build("email", email.to_string())
            .same_site(SameSite::Lax)
            .finish(),
    );

    // Get the original URI which the user requested or redirect him to /user if he just logged in.
    let original_request_uri = cookies
        .get("origin-req-uri")
        .map(|cookie| cookie.value().to_string())
        .and_then(|uri| Some({
            if uri.starts_with("/login") {
                "/user".to_string()
            }
            else{
                uri
            }
        }))
        .unwrap_or("/user".into());

    Ok(Redirect::to(format!("{}", original_request_uri)))
}

#[get("/login/google")]
pub fn google_login(oauth2: OAuth2<GoogleUserInfo>, cookies: &CookieJar<'_>) -> Redirect {
    oauth2.get_redirect(cookies, &["profile, email"]).unwrap()
}

#[get("/auth/google")]
pub async fn google_callback(token: TokenResponse<GoogleUserInfo>, cookies: &CookieJar<'_>) -> Result<Redirect, Debug<Error>> {

    // Use the token to retrieve the user's Google account information.
    let user_info : GoogleUserInfo = reqwest::Client::builder()
        .build()
        .context("failed to build reqwest client")?
        .get("https://www.googleapis.com/oauth2/v2/userinfo")
        .header(AUTHORIZATION, format!("Bearer {}", token.access_token()))
        .send()
        .await
        .context("failed to complete request")?   
        .json()
        .await
        .context("failed to deserialize response")?;   

    // Set a private cookie with the user's email.
    cookies.add_private(
        Cookie::build("email", user_info.email)
            .same_site(SameSite::Lax)
            .finish(),
    );

    // Set a private cookie with the user's picture from Google.
    cookies.add_private(
        Cookie::build("avatar", user_info.picture)
            .same_site(SameSite::Lax)
            .finish(),
    );

    // Get the original URI which the user requested or redirect him to /user if he just logged in.
    let original_request_uri = cookies
        .get("origin-req-uri")
        .map(|cookie| cookie.value().to_string())
        .and_then(|uri| Some({
            if uri.starts_with("/login") {
                "/user".to_string()
            }
            else{
                uri
            }
        }))
        .unwrap_or("/user".into());

    Ok(Redirect::to(format!("{}", original_request_uri)))
}

#[get("/logout")]
pub async fn logout(cookies: &CookieJar<'_>) -> Redirect {
    cookies.remove(Cookie::named("username"));
    Redirect::to("/")
}