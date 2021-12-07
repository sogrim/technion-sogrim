extern crate jsonwebtoken_google;

use crate::config::CONFIG;
use actix_web::{
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
    http::header,
    Error, HttpMessage,
};
use futures_util::{
    future::{ready, LocalBoxFuture, Ready},
    FutureExt,
};
use jsonwebtoken_google::{Parser, ParserError};
use serde::Deserialize;
use std::rc::Rc;

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

pub type Sub = String;

macro_rules! debug_auth {
    () => {
        if CONFIG.profile == "debug" {
            return Ok(IdInfo {
                sub: "bugo-the-debugo".into(),
                ..Default::default()
            });
        }
    };
}

pub async fn get_decoded(token: &str) -> Result<IdInfo, ParserError> {
    debug_auth!(); // will return immediately in debug environment.
    let parser = Parser::new(CONFIG.client_id);
    Ok(parser.parse::<IdInfo>(token).await?)
}
pub struct AuthenticateMiddleware;
impl<S, B> Transform<S, ServiceRequest> for AuthenticateMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = Authenticator<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(Authenticator {
            service: Rc::new(service),
        }))
    }
}

pub struct Authenticator<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for Authenticator<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    actix_service::forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let srv = Rc::clone(&self.service);
        async move {
            let jwt = req
                .headers()
                .get(header::AUTHORIZATION)
                .ok_or_else(|| ErrorUnauthorized("Authorization Header Missing"))?
                .to_str()
                .map_err(|_| ErrorUnauthorized("Authorization Header Invalid"))?;

            let sub = get_decoded(jwt)
                .await
                .map_err(|err| ErrorUnauthorized(err.to_string()))?
                .sub;

            req.extensions_mut().insert::<Sub>(sub);
            let res = srv.call(req).await?;

            Ok(res)
        }
        .boxed_local()
    }
}
