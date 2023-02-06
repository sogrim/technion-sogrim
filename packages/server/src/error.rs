use actix_web::{http::StatusCode, HttpResponse, ResponseError};
use colored::Colorize;
use derive_more::Display;

#[derive(Debug, Display)]
pub enum AppError {
    BadRequest(String),     // 400
    Bson(String),           // 400
    Parser(String),         // 400
    NotFound(String),       // 404
    InternalServer(String), // 500
    Middleware(String),     // 500
    MongoDriver(String),    // 500
}

impl From<mongodb::error::Error> for AppError {
    fn from(err: mongodb::error::Error) -> Self {
        AppError::MongoDriver(err.to_string())
    }
}

impl From<bson::ser::Error> for AppError {
    fn from(err: bson::ser::Error) -> Self {
        AppError::Bson(err.to_string())
    }
}

impl From<bson::oid::Error> for AppError {
    fn from(err: bson::oid::Error) -> Self {
        AppError::Bson(err.to_string())
    }
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let (status_code, error) = match self {
            AppError::BadRequest(e) => (StatusCode::BAD_REQUEST, e.to_owned()),
            AppError::Bson(e) => (StatusCode::BAD_REQUEST, format!("Bson error: {e}")),
            AppError::Parser(e) => (StatusCode::BAD_REQUEST, format!("Parser error: {e}")),
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
        };
        log::error!("{}", error.bold().red());
        match status_code {
            StatusCode::BAD_REQUEST => HttpResponse::BadRequest().body(error),
            StatusCode::NOT_FOUND => HttpResponse::NotFound().body(error),
            StatusCode::INTERNAL_SERVER_ERROR => HttpResponse::InternalServerError().body(error),
            _ => unreachable!(),
        }
    }
}
