extern crate jsonwebtoken_google;

use std::{env::{self, VarError}};

use actix_web::{Error, HttpMessage, dev::ServiceRequest, error::ErrorUnauthorized};
use actix_web_httpauth::{extractors::bearer::BearerAuth};
use jsonwebtoken_google::{Parser, ParserError};
use serde::Deserialize;

#[derive(Default, Debug, Deserialize)]
pub struct IdInfo {
    /// These six fields are included in all Google ID Tokens.
    pub iss: String,
    pub sub: String,
    pub azp: String,
    pub aud: String,
    pub iat: u64,
    pub exp: u64,

    /// These seven fields are only included when the user has granted the "profile" and
    /// "email" OAuth scopes to the application.
    pub email: Option<String>,
    pub email_verified: Option<bool>, 
    pub name: Option<String>,
    pub picture: Option<String>,
    pub given_name: Option<String>,
    pub family_name: Option<String>,
    pub locale: Option<String>,
}

#[derive(Debug)]
pub enum AuthError{
    ParserError(ParserError),
    VarError(VarError),
}
impl std::fmt::Display for AuthError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

pub async fn get_decoded(token: &str) -> Result<IdInfo, AuthError> {
    if env::var("PROFILE").unwrap_or("debug".into()) == "debug" {
        return Ok(IdInfo{
            sub: "bugo-the-debugo".into(),
            ..Default::default()
        })
    }
    
    let parser = Parser::new(
        &env::var("CLIENT_ID")
            .map_err(|e| AuthError::VarError(e))?
    );

    Ok(parser
        .parse::<IdInfo>(token)
        .await
        .map_err(|e| AuthError::ParserError(e))?
    )
}

pub async fn validator(req: ServiceRequest, credentials: BearerAuth) -> Result<ServiceRequest, Error>{
    let id_info : IdInfo = get_decoded(credentials.token())
        .await
        .map_err(|err|{
            eprintln!("Error: {}", err);
            ErrorUnauthorized(err.to_string())
        })?;
    
    req.extensions_mut().insert(id_info.sub);
    Ok(req)
}

