use axum::{
    extract::Request,
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};

use super::jwt_decoder::JwtDecoder;

// use `pub` to re-export the `Sub` type from the `jwt_decoder` module
pub use super::jwt_decoder::Sub;

pub async fn authenticate(mut req: Request, next: Next) -> Response {
    let Some(auth_header) = req.headers().get(header::AUTHORIZATION) else {
        return (StatusCode::UNAUTHORIZED, "No authorization header").into_response();
    };

    let Ok(jwt) = auth_header.to_str() else {
        return (StatusCode::UNAUTHORIZED, "Invalid authorization header").into_response();
    };

    let Some(decoder) = req.extensions().get::<JwtDecoder>().cloned() else {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            "JwtDecoder not initialized",
        )
            .into_response();
    };

    let sub = match decoder.decode(jwt).await {
        Ok(sub) => sub,
        Err(err) => {
            return (StatusCode::UNAUTHORIZED, err.to_string()).into_response();
        }
    };

    req.extensions_mut().insert::<Sub>(sub);
    next.run(req).await
}
