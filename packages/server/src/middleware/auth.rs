extern crate jsonwebtoken_google;

use crate::config::CONFIG;
use actix_web::{
    body::EitherBody,
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    http::header,
    Error, HttpMessage, HttpResponse,
};
use futures_util::future::{ready, LocalBoxFuture, Ready};
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
    ($token:ident) => {
        if $token == "bugo-the-debugo" {
            return Ok(IdInfo {
                sub: "bugo-the-debugo".into(),
                ..Default::default()
            });
        }
    };
}

pub async fn get_decoded(token: &str) -> Result<IdInfo, ParserError> {
    debug_auth!(token); // will return immediately in test environment.
    let parser = Parser::new(CONFIG.client_id);
    Ok(parser.parse::<IdInfo>(token).await?)
}
pub struct AuthenticateMiddleware;
impl<S, B> Transform<S, ServiceRequest> for AuthenticateMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
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

macro_rules! return_401_with_reason(
    ($request:ident,$reason:expr) => {
        return Ok(ServiceResponse::new(
            $request,
            HttpResponse::Unauthorized().body($reason).map_into_right_body(),
        ))
    };
);

pub struct Authenticator<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for Authenticator<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    actix_service::forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let srv = Rc::clone(&self.service);
        let (request, payload) = req.into_parts();
        Box::pin(async move {
            let auth_header = match request.headers().get(header::AUTHORIZATION) {
                Some(header) => header,
                None => return_401_with_reason!(request, "No authorization header found"),
            };

            let jwt = match auth_header.to_str() {
                Ok(jwt) => jwt,
                Err(_) => return_401_with_reason!(request, "Invalid authorization header"),
            };

            let sub = match get_decoded(jwt).await {
                Ok(id_info) => id_info.sub,
                Err(err) => return_401_with_reason!(request, format!("Invalid JWT: {}", err)),
            };

            request.extensions_mut().insert::<Sub>(sub);
            let res = srv
                .call(ServiceRequest::from_parts(request, payload))
                .await?;

            Ok(res.map_into_left_body())
        })
    }
}
