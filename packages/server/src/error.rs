use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

#[derive(Debug)]
pub enum AppError {
    BadRequest(String),        // 400
    Bson(String),              // 400
    Parser(String),            // 400
    Unauthorized(String),      // 401
    NotFound(String),          // 404
    InternalServer(String),    // 500
    Middleware(String),        // 500
    MongoDriver(String),       // 500
    GoogleKeyProvider(String), // 500
}

impl From<mongodb::error::Error> for AppError {
    fn from(err: mongodb::error::Error) -> Self {
        AppError::MongoDriver(err.to_string())
    }
}

impl From<bson::error::Error> for AppError {
    fn from(err: bson::error::Error) -> Self {
        AppError::Bson(err.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        AppError::GoogleKeyProvider(err.to_string())
    }
}

impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        let err_msg = format!("Invalid JWT: {err}");
        match err.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => AppError::Unauthorized(err_msg),
            _ => AppError::InternalServer(err_msg),
        }
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        let error = match self {
            AppError::BadRequest(e) => e.to_owned(),
            AppError::Bson(e) => format!("Bson error: {e}"),
            AppError::Parser(e) => format!("Parser error: {e}"),
            AppError::Unauthorized(e) => format!("Permission denied: {e}"),
            AppError::NotFound(e) => format!("{e} not found"),
            AppError::InternalServer(e) => e.to_owned(),
            AppError::Middleware(e) => format!("Middleware error: {e}"),
            AppError::MongoDriver(e) => format!("MongoDB driver error: {e}"),
            AppError::GoogleKeyProvider(e) => format!("Google key provider error: {e}"),
        };
        write!(f, "{error}")
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error) = match &self {
            AppError::BadRequest(e) => (StatusCode::BAD_REQUEST, e.to_owned()),
            AppError::Bson(e) => (StatusCode::BAD_REQUEST, format!("Bson error: {e}")),
            AppError::Parser(e) => (StatusCode::BAD_REQUEST, format!("Parser error: {e}")),
            AppError::Unauthorized(e) => {
                (StatusCode::UNAUTHORIZED, format!("Permission denied: {e}"))
            }
            AppError::NotFound(e) => (StatusCode::NOT_FOUND, format!("{e} not found")),
            AppError::InternalServer(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_owned()),
            AppError::Middleware(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Middleware error: {e}"),
            ),
            AppError::MongoDriver(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("MongoDB driver error: {e}"),
            ),
            AppError::GoogleKeyProvider(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Google key provider error: {e}"),
            ),
        };
        let mut resp = (status, error.clone()).into_response();
        resp.extensions_mut().insert(error);
        resp
    }
}

#[cfg(test)]
#[path = "error_tests.rs"]
mod error_tests;
