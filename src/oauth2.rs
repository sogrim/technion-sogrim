use anyhow::{Context, Error};
use reqwest::header::{ACCEPT, AUTHORIZATION, USER_AGENT};
use rocket::http::{Cookie, CookieJar, SameSite};
use rocket::response::{Debug, Redirect};
use rocket_oauth2::{OAuth2, TokenResponse};
use serde_json::{self, Value};

/// User information to be retrieved from the GitHub API.
#[derive(serde::Deserialize)]
pub struct GitHubUserInfo {
    #[serde(default)]
    login: String,
}

/// User information to be retrieved from the Google People API.
#[derive(serde::Deserialize)]
pub struct GoogleUserInfo {
    names: Vec<Value>,
}

#[get("/login/github")]
pub fn github_login(oauth2: OAuth2<GitHubUserInfo>, cookies: &CookieJar<'_>) -> Redirect {
    oauth2.get_redirect(cookies, &["user:read"]).unwrap()
}

#[get("/auth/github")]
pub async fn github_callback(token: TokenResponse<GitHubUserInfo>, cookies: &CookieJar<'_>) -> Result<Redirect, Debug<Error>> {

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
        Cookie::build("username", user_info.login)
            .same_site(SameSite::Lax)
            .finish(),
    );

    let original_request_uri = cookies
                                .get("origin-req-uri")
                                .map(|cookie| cookie.value().to_string())
                                .unwrap_or("/user".into());

    Ok(Redirect::to(format!("{}", original_request_uri.to_string())))
}

#[get("/login/google")]
pub fn google_login(oauth2: OAuth2<GoogleUserInfo>, cookies: &CookieJar<'_>) -> Redirect {
    oauth2.get_redirect(cookies, &["profile"]).unwrap()
}

#[get("/auth/google")]
pub async fn google_callback(token: TokenResponse<GoogleUserInfo>, cookies: &CookieJar<'_>) -> Result<Redirect, Debug<Error>> {

    // Use the token to retrieve the user's Google account information.
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
    Ok(Redirect::to("/user"))
}

#[get("/logout")]
pub async fn logout(cookies: &CookieJar<'_>) -> Redirect {
    cookies.remove(Cookie::named("username"));
    Redirect::to("/")
}

// #[get("/login")]
// pub fn successful_login (cookies: &CookieJar<'_>) -> String{
//     let token = cookies.get_private("username");
//     match token{
//         Some(cookie) => {
//             let username : String = cookie.to_string().strip_prefix("username=").unwrap().into();
//             format!("Hello {}, welcome to Sogrim!", username)
//         },
//         None => "Bad token".into(),
//     }
    
// }