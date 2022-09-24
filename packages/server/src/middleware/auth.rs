extern crate jsonwebtoken_google;

use crate::config::CONFIG;
use actix_web::{
    body::MessageBody,
    dev::{ServiceRequest, ServiceResponse},
    http::header,
    Error, HttpMessage, HttpResponse,
};
use actix_web_lab::middleware::Next;
use jsonwebtoken_google::{Parser, ParserError};
use serde::Deserialize;

pub type Sub = String;
#[derive(Default, Debug, Deserialize)]
pub struct IdInfo {
    // Identifier of the user, guaranteed to be unique by Google.
    pub sub: Sub,
}

pub struct JwtDecoder {
    parser: Parser,
}

impl JwtDecoder {
    // Set up a jwt parser with actual google client id
    pub fn new() -> Self {
        JwtDecoder {
            parser: Parser::new(CONFIG.client_id),
        }
    }
    // Decode the jwt and return id info (sub wrapper)
    pub async fn decode(&self, token: &str) -> Result<IdInfo, ParserError> {
        self.parser.parse::<IdInfo>(token).await
    }
    // Set up a debug jwt parser for testing
    #[cfg(test)]
    pub fn new_with_parser(parser: Parser) -> Self {
        JwtDecoder { parser }
    }
}

macro_rules! return_401_with_reason(
    ($request:ident,$reason:expr) => {{
        if $reason.contains("Expired") {
            log::warn!("{}", $reason);
        } else {
            log::error!("{}", $reason);
        }
        return Ok(ServiceResponse::new(
            $request,
            HttpResponse::Unauthorized().body($reason),
        ))
    }};
);

pub async fn authenticate(
    req: ServiceRequest,
    next: Next<impl MessageBody + 'static>,
) -> Result<ServiceResponse<impl MessageBody>, Error> {
    let (request, payload) = req.into_parts();
    let auth_header = match request.headers().get(header::AUTHORIZATION) {
        Some(header) => header,
        None => return_401_with_reason!(request, "No authorization header found"),
    };

    let jwt = match auth_header.to_str() {
        Ok(jwt) => jwt,
        Err(_) => return_401_with_reason!(request, "Invalid authorization header"),
    };

    let decoder = match request.app_data::<JwtDecoder>() {
        Some(decoder) => decoder,
        None => {
            return Ok(ServiceResponse::new(
                request,
                HttpResponse::InternalServerError().body("JwtDecoder not initialized"),
            ));
        }
    };

    let sub = match decoder.decode(jwt).await {
        Ok(id_info) => id_info.sub,
        Err(err) => return_401_with_reason!(request, format!("Invalid JWT: {}", err)),
    };

    request.extensions_mut().insert::<Sub>(sub);
    let res = next
        .call(ServiceRequest::from_parts(request, payload))
        .await?;
    Ok(res.map_into_boxed_body())
}
