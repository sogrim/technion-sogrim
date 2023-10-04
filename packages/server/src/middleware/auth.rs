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

pub async fn authenticate(
    req: ServiceRequest,
    next: Next<impl MessageBody + 'static>,
) -> Result<ServiceResponse<impl MessageBody>, Error> {
    let (request, payload) = req.into_parts();
    let Some(header) = request.headers().get(header::AUTHORIZATION) else {
        let mut resp = ServiceResponse::new(request, HttpResponse::Unauthorized().finish());
        resp.response_mut()
            .extensions_mut()
            .insert::<String>(String::from("No authorization header"));
        return Ok(resp);
    };

    let Ok(jwt) = header.to_str() else {
        let mut resp = ServiceResponse::new(request, HttpResponse::Unauthorized().finish());
        resp.response_mut()
            .extensions_mut()
            .insert::<String>(String::from("Invalid authorization header"));
        return Ok(resp);
    };

    let Some(decoder) = request.app_data::<JwtDecoder>() else {
        let mut resp = ServiceResponse::new(request, HttpResponse::InternalServerError().finish());
        resp.response_mut()
            .extensions_mut()
            .insert::<String>(String::from("JwtDecoder not initialized"));
        return Ok(resp);
    };

    let sub = match decoder.decode(jwt).await {
        Ok(id_info) => id_info.sub,
        Err(err) => {
            let mut resp = ServiceResponse::new(request, HttpResponse::Unauthorized().finish());
            resp.response_mut()
                .extensions_mut()
                .insert::<String>(format!("Invalid JWT: {err}"));
            return Ok(resp);
        }
    };

    request.extensions_mut().insert::<Sub>(sub);
    let res = next
        .call(ServiceRequest::from_parts(request, payload))
        .await?;
    Ok(res.map_into_boxed_body())
}
